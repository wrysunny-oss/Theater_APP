import type { Request } from "express";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { AppError } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";
import type { LedgerListQuery, UserListQuery } from "./admin.schema.js";

export async function getDashboard() {
  // 独立统计放入批量事务，只占用一次数据库往返。
  const [users, publishedDramas, feedbackPending, coins, reconciliationPending, latestReconciliation] = await prisma.$transaction([
    prisma.user.count(),
    prisma.drama.count({ where: { status: "PUBLISHED" } }),
    prisma.feedback.count({ where: { status: "PENDING" } }),
    prisma.rewardLedger.aggregate({ _sum: { amount: true }, where: { amount: { gt: 0 } } }),
    prisma.riskEvent.count({ where: { status: "PENDING", ruleCode: { startsWith: "RECONCILIATION_" } } }),
    prisma.reconciliationRun.findFirst({ orderBy: { startedAt: "desc" }, select: { status: true, issueCount: true, startedAt: true } }),
  ]);
  return { users, publishedDramas, feedbackPending, coinsIssued: coins._sum.amount ?? 0, reconciliationPending, latestReconciliation };
}

/**
 * 后台直接创建一级代理，不建立上级邀请关系。
 * 用户、代理角色关系和审计日志在同一事务提交，避免产生半成品账号。
 */
export async function createLevelOneAgent(
  operatorId: bigint,
  input: { nickname: string; password: string; phone: string },
  request: Pick<Request, "method" | "path" | "ip" | "header">,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const role = await tx.role.upsert({
        where: { code: "level_one_agent" },
        create: { code: "level_one_agent", name: "一级代理", description: "由管理员直接创建的一级代理用户", isSystem: true },
        update: { name: "一级代理", description: "由管理员直接创建的一级代理用户" },
      });
      const user = await tx.user.create({
        data: {
          phone: input.phone,
          nickname: input.nickname,
          passwordHash: await bcrypt.hash(input.password, 12),
          inviteCode: randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase(),
          roles: { create: { roleId: role.id } },
        },
        select: { id: true, phone: true, nickname: true, inviteCode: true, status: true, createdAt: true, roles: { select: { role: { select: { code: true, name: true } } } } },
      });
      await tx.auditLog.create({ data: {
        operatorId, action: "agent.level_one.create", method: request.method, path: request.path,
        targetType: "user", targetId: user.id.toString(), ip: request.ip,
        userAgent: request.header("user-agent"), detail: { phone: input.phone, role: "level_one_agent" },
      } });
      return user;
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") throw new AppError(409, 3010, "手机号已存在，请更换后重试");
    throw error;
  }
}

export const getAdRewardConfig = () => prisma.adRewardConfig.upsert({
  where: { id: 1 }, create: { id: 1 }, update: {},
});

/** 更新全局广告分成比例并记录审计；比例以万分比保存。 */
export function updateAdRewardConfig(operatorId: bigint, rates: { defaultShareRateBps: number; directShareRateBps: number; indirectShareRateBps: number }, request: Pick<Request, "method" | "path" | "ip" | "header">) {
  return prisma.$transaction(async (tx) => {
    const config = await tx.adRewardConfig.upsert({ where: { id: 1 }, create: { id: 1, ...rates }, update: rates });
    await tx.auditLog.create({ data: { operatorId, action: "ad.reward.config.update", method: request.method, path: request.path, targetType: "ad_reward_config", targetId: "1", ip: request.ip, userAgent: request.header("user-agent"), detail: rates } });
    return config;
  });
}

/** 设置用户独立广告分成；null 恢复继承全局比例。 */
export function updateUserAdShare(operatorId: bigint, userId: bigint, shareRateBps: null | number, request: Pick<Request, "method" | "path" | "ip" | "header">) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id: userId }, data: { adShareRateBps: shareRateBps }, select: { id: true, adShareRateBps: true } });
    await tx.auditLog.create({ data: { operatorId, action: "user.ad_share.update", method: request.method, path: request.path, targetType: "user", targetId: userId.toString(), ip: request.ip, userAgent: request.header("user-agent"), detail: { shareRateBps } } });
    return user;
  });
}

/** 将最多 6 位小数的人民币元字符串转换为百万分之一元，整个过程不使用浮点数。 */
function yuanToMicros(value: string) {
  const [yuan, fraction = ""] = value.split(".");
  return BigInt(yuan!) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
}

/** 纯函数：计算单次广告的基础金币、用户净收益及两级返佣，便于独立测试。 */
export function calculateAdDistribution(input: { revenueMicros: bigint; coinsPerCent: number; userRateBps: number; directRateBps: number; indirectRateBps: number; hasDirect: boolean; hasIndirect: boolean }) {
  const baseUserCoins = input.revenueMicros * BigInt(input.coinsPerCent) * BigInt(input.userRateBps) / 100_000_000n;
  const directAwardedCoins = input.hasDirect ? baseUserCoins * BigInt(input.directRateBps) / 10_000n : 0n;
  const indirectAwardedCoins = input.hasIndirect ? baseUserCoins * BigInt(input.indirectRateBps) / 10_000n : 0n;
  return { baseUserCoins, awardedCoins: baseUserCoins - directAwardedCoins - indirectAwardedCoins, directAwardedCoins, indirectAwardedCoins };
}

/**
 * 按“人民币收入 × 每元金币 × 有效分成比例”结算单次广告收益。
 * requestId 幂等；用户独立比例优先，否则使用全局比例。
 */
export function settleAdReward(operatorId: bigint | null, input: { requestId: string; revenueYuan: string; source: string; userId: bigint }, request: Pick<Request, "method" | "path" | "ip" | "header">) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.adRewardSettlement.findUnique({ where: { requestId: input.requestId } });
    if (existing) return existing;
    const [user, globalConfig, withdrawalConfig, invitation] = await Promise.all([
      tx.user.findUniqueOrThrow({ where: { id: input.userId }, select: { adShareRateBps: true } }),
      tx.adRewardConfig.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} }),
      tx.withdrawalConfig.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} }),
      tx.inviteRelation.findUnique({ where: { inviteeId: input.userId }, include: { inviter: { select: { invitedBy: { select: { inviterId: true } } } } } }),
    ]);
    const revenueMicros = yuanToMicros(input.revenueYuan);
    const shareRateBps = user.adShareRateBps ?? globalConfig.defaultShareRateBps;
    const indirectInviterId = invitation?.inviter.invitedBy?.inviterId;
    const { baseUserCoins, awardedCoins, directAwardedCoins, indirectAwardedCoins } = calculateAdDistribution({ revenueMicros, coinsPerCent: withdrawalConfig.coinsPerCent, userRateBps: shareRateBps, directRateBps: globalConfig.directShareRateBps, indirectRateBps: globalConfig.indirectShareRateBps, hasDirect: Boolean(invitation), hasIndirect: Boolean(indirectInviterId) });
    const settlement = await tx.adRewardSettlement.create({ data: {
      requestId: input.requestId, userId: input.userId, revenueMicros, shareRateBps,
      directInviterId: invitation?.inviterId, indirectInviterId,
      directShareRateBps: globalConfig.directShareRateBps, indirectShareRateBps: globalConfig.indirectShareRateBps,
      coinsPerCent: withdrawalConfig.coinsPerCent, baseUserCoins, awardedCoins, directAwardedCoins, indirectAwardedCoins, source: input.source,
    } });
    const credit = async (userId: bigint, coins: bigint, title: string, suffix: string) => {
      if (coins <= 0n) return;
      const updated = await tx.user.update({ where: { id: userId }, data: { coinBalance: { increment: coins } }, select: { coinBalance: true } });
      await tx.rewardLedger.create({ data: { userId, type: "AD", amount: coins, balanceAfter: updated.coinBalance, title, bizId: `ad:${settlement.id}:${suffix}` } });
    };
    await credit(input.userId, awardedCoins, "观看广告收益", "viewer");
    if (invitation) await credit(invitation.inviterId, directAwardedCoins, "直推用户广告分成", "direct");
    if (indirectInviterId) await credit(indirectInviterId, indirectAwardedCoins, "间推用户广告分成", "indirect");
    await tx.auditLog.create({ data: { operatorId, action: "ad.reward.settle", method: request.method, path: request.path, targetType: "ad_reward_settlement", targetId: settlement.id, ip: request.ip, userAgent: request.header("user-agent"), detail: { requestId: input.requestId, revenueYuan: input.revenueYuan, shareRateBps, directShareRateBps: globalConfig.directShareRateBps, indirectShareRateBps: globalConfig.indirectShareRateBps, baseUserCoins: baseUserCoins.toString(), awardedCoins: awardedCoins.toString(), directAwardedCoins: directAwardedCoins.toString(), indirectAwardedCoins: indirectAwardedCoins.toString(), source: input.source } } });
    return settlement;
  }, { isolationLevel: "Serializable" });
}

export async function listAdRewardSettlements(query: { page: number; pageSize: number; userId?: bigint }) {
  const where = query.userId ? { userId: query.userId } : {};
  const [list, total] = await prisma.$transaction([
    prisma.adRewardSettlement.findMany({ where, skip: (query.page - 1) * query.pageSize, take: query.pageSize, include: { user: { select: { phone: true, nickname: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.adRewardSettlement.count({ where }),
  ]);
  return { list, total, page: query.page, pageSize: query.pageSize };
}

/** 广告收益看板使用结算快照聚合，避免受后续比例变更影响。 */
export async function getAdRewardDashboard() {
  const rows = await prisma.adRewardSettlement.findMany({ select: { revenueMicros: true, coinsPerCent: true, baseUserCoins: true, awardedCoins: true, directAwardedCoins: true, indirectAwardedCoins: true } });
  const summary = rows.reduce((result, row) => {
    result.revenueMicros += row.revenueMicros;
    result.grossEquivalentCoins += row.revenueMicros * BigInt(row.coinsPerCent) / 10_000n;
    result.baseUserCoins += row.baseUserCoins;
    result.awardedCoins += row.awardedCoins;
    result.directAwardedCoins += row.directAwardedCoins;
    result.indirectAwardedCoins += row.indirectAwardedCoins;
    return result;
  }, { revenueMicros: 0n, grossEquivalentCoins: 0n, baseUserCoins: 0n, awardedCoins: 0n, directAwardedCoins: 0n, indirectAwardedCoins: 0n });
  return { count: rows.length, ...summary, platformRetainedCoins: summary.grossEquivalentCoins - summary.baseUserCoins };
}

/** 返回指定用户向下两级团队及各成员贡献，层级相对于当前查看用户。 */
export async function getUserTeam(userId: bigint) {
  const [direct, indirect, directContribution, indirectContribution] = await Promise.all([
    prisma.inviteRelation.findMany({ where: { inviterId: userId }, include: { invitee: { select: { id: true, phone: true, nickname: true, status: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.inviteRelation.findMany({ where: { inviter: { invitedBy: { inviterId: userId } } }, include: { inviter: { select: { id: true, nickname: true } }, invitee: { select: { id: true, phone: true, nickname: true, status: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.adRewardSettlement.aggregate({ where: { directInviterId: userId }, _sum: { directAwardedCoins: true } }),
    prisma.adRewardSettlement.aggregate({ where: { indirectInviterId: userId }, _sum: { indirectAwardedCoins: true } }),
  ]);
  return { direct, indirect, summary: { directCount: direct.length, indirectCount: indirect.length, directCommissionCoins: directContribution._sum.directAwardedCoins ?? 0n, indirectCommissionCoins: indirectContribution._sum.indirectAwardedCoins ?? 0n } };
}

export async function listUsers(query: UserListQuery) {
  const { page, pageSize, keyword } = query;
  const where = keyword
    ? { OR: [{ phone: { contains: keyword } }, { nickname: { contains: keyword } }] }
    : {};
  const [list, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, phone: true, nickname: true, status: true, coinBalance: true, frozenCoinBalance: true, adShareRateBps: true, createdAt: true, roles: { select: { role: { select: { code: true, name: true } } } } },
      orderBy: { id: "desc" },
    }),
    prisma.user.count({ where }),
  ]);
  return { list, page, pageSize, total };
}

/** 用户详情使用字段白名单，不返回密码摘要、刷新令牌等安全字段。 */
export function getUserDetail(userId: bigint) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true, phone: true, nickname: true, avatarUrl: true, gender: true,
      birthday: true, bio: true, status: true, coinBalance: true, frozenCoinBalance: true, adShareRateBps: true,
      createdAt: true, updatedAt: true,
      roles: { select: { role: { select: { id: true, code: true, name: true } } } },
      _count: { select: { favorites: true, histories: true, ledgers: true } },
    },
  });
}

export async function listCoinLedgers(query: LedgerListQuery) {
  const { page, pageSize, userId } = query;
  const where = userId ? { userId } : {};
  const [list, total] = await prisma.$transaction([
    prisma.rewardLedger.findMany({
      where, skip: (page - 1) * pageSize, take: pageSize,
      include: { user: { select: { phone: true, nickname: true } } },
      orderBy: { id: "desc" },
    }),
    prisma.rewardLedger.count({ where }),
  ]);
  return { list, page, pageSize, total };
}

/**
 * 人工调账使用串行化事务，并先做原子条件更新。
 * 余额、不可变流水和审计记录要么全部成功，要么全部回滚。
 */
export function adjustUserCoins(
  operatorId: bigint,
  userId: bigint,
  amount: bigint,
  reason: string,
  request: Pick<Request, "method" | "path" | "ip" | "header">,
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: { id: userId, ...(amount < 0n ? { coinBalance: { gte: -amount } } : {}) },
      data: { coinBalance: { increment: amount } },
    });
    if (updated.count !== 1) throw new AppError(409, 3001, "用户不存在或金币余额不足");
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { coinBalance: true } });
    const ledger = await tx.rewardLedger.create({
      data: { userId, type: "ADJUSTMENT", amount, balanceAfter: user.coinBalance, title: reason, bizId: randomUUID() },
    });
    await tx.auditLog.create({ data: {
      operatorId, action: "coin.adjust", method: request.method, path: request.path,
      targetType: "user", targetId: userId.toString(), ip: request.ip,
      userAgent: request.header("user-agent"), detail: { amount: amount.toString(), reason, ledgerId: ledger.id.toString() },
    } });
    return { balance: user.coinBalance, ledger };
  }, { isolationLevel: "Serializable" });
}

/**
 * 用户状态与审计日志必须在同一事务提交，避免出现“账号已封禁但没有操作记录”。
 * request 只用于提取审计上下文，不应把完整请求体写入日志以免泄露敏感信息。
 */
export function updateUserStatus(
  operatorId: bigint,
  userId: bigint,
  status: "ACTIVE" | "DISABLED",
  request: Pick<Request, "method" | "path" | "ip" | "header">,
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id: userId }, data: { status } });
    await tx.auditLog.create({
      data: {
        operatorId,
        action: "user.status.update",
        method: request.method,
        path: request.path,
        targetType: "user",
        targetId: user.id.toString(),
        ip: request.ip,
        userAgent: request.header("user-agent"),
        detail: { status },
      },
    });
    return user;
  });
}

export const listPermissions = () => prisma.permission.findMany({ orderBy: [{ module: "asc" }, { id: "asc" }] });
export const listRoles = () => prisma.role.findMany({
  include: { permissions: { select: { permission: true } }, _count: { select: { users: true } } },
  orderBy: { id: "asc" },
});

export async function updateRolePermissions(roleId: number, permissionIds: number[]) {
  const role = await prisma.role.findUniqueOrThrow({ where: { id: roleId } });
  if (role.isSystem) throw new AppError(409, 3002, "系统内置角色不允许修改");
  return prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId } });
    await tx.rolePermission.createMany({ data: permissionIds.map((permissionId) => ({ roleId, permissionId })), skipDuplicates: true });
    return tx.role.findUniqueOrThrow({ where: { id: roleId }, include: { permissions: { include: { permission: true } } } });
  });
}

export const listAdmins = () => prisma.user.findMany({
  where: { roles: { some: {} } },
  select: { id: true, phone: true, nickname: true, status: true, createdAt: true, roles: { select: { role: true } } },
  orderBy: { id: "asc" },
});
export const listAuditLogs = () => prisma.auditLog.findMany({ take: 100, orderBy: { id: "desc" } });
