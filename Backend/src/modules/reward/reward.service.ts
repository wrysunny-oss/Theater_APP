import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { Request } from "express";
import { AppError } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";
import type { RewardListQuery } from "./reward.schema.js";
import { assertAllowed } from "../safety/safety.service.js";

type Tx = Prisma.TransactionClient;

/** 生成不易误读的个人邀请码；唯一索引负责处理极低概率的碰撞。 */
function newInviteCode() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(8);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

/** 奖励、余额和流水始终在调用方事务中同时提交。 */
async function award(tx: Tx, userId: bigint, ruleCode: string, type: "INVITE" | "SIGNIN" | "TASK", bizId: string, title: string) {
  const rule = await tx.rewardRule.findUnique({ where: { code: ruleCode } });
  if (!rule?.enabled || rule.amount <= 0n) return null;
  const user = await tx.user.update({ where: { id: userId }, data: { coinBalance: { increment: rule.amount } }, select: { coinBalance: true } });
  return tx.rewardLedger.create({
    data: { userId, type, amount: rule.amount, balanceAfter: user.coinBalance, title, bizId },
  });
}

async function bindInviteInTx(tx: Tx, inviteeId: bigint, inviteCode: string) {
  const existing = await tx.inviteRelation.findUnique({ where: { inviteeId } });
  if (existing) throw new AppError(409, 3101, "该用户已经绑定过邀请关系");
  const inviter = await tx.user.findUnique({ where: { inviteCode }, select: { id: true, invitedBy: { select: { inviterId: true } } } });
  if (!inviter) throw new AppError(404, 3102, "邀请码不存在或已失效");
  if (inviter.id === inviteeId) throw new AppError(409, 3103, "不能绑定自己的邀请码");

  const relation = await tx.inviteRelation.create({ data: { inviterId: inviter.id, inviteeId, inviteCode } });
  await award(tx, inviter.id, "INVITE_DIRECT", "INVITE", `invite-direct:${relation.id}`, "邀请好友奖励");
  if (inviter.invitedBy) {
    await award(tx, inviter.invitedBy.inviterId, "INVITE_INDIRECT", "INVITE", `invite-indirect:${relation.id}`, "间接邀请奖励");
  }
  return relation;
}

export function createRegisteredUser(input: { phone: string; passwordHash: string; nickname: string; inviteCode: string }) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { phone: input.phone, passwordHash: input.passwordHash, nickname: input.nickname, inviteCode: newInviteCode() } });
    await award(tx, user.id, "REGISTER", "TASK", `register:${user.id}`, "新用户注册奖励");
    await bindInviteInTx(tx, user.id, input.inviteCode.toUpperCase());
    return tx.user.findUniqueOrThrow({ where: { id: user.id } });
  }, { isolationLevel: "Serializable" });
}

export async function ensureInviteCode(userId: bigint) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { inviteCode: true } });
  if (user.inviteCode) return user.inviteCode;
  // 旧用户首次访问时补发邀请码；碰撞时重新尝试。
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const updated = await prisma.user.update({ where: { id: userId }, data: { inviteCode: newInviteCode() }, select: { inviteCode: true } });
      return updated.inviteCode!;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  throw new AppError(500, 3104, "邀请码生成失败");
}

export async function bindInvite(userId: bigint, inviteCode: string) {
  await assertAllowed(userId, "reward");
  return prisma.$transaction((tx) => bindInviteInTx(tx, userId, inviteCode), { isolationLevel: "Serializable" });
}

/** 修改个人邀请码；历史邀请关系仍保留绑定时的邀请码快照。 */
export async function updateInviteCode(userId: bigint, inviteCode: string) {
  const normalizedCode = inviteCode.trim().toUpperCase();
  try {
    return await prisma.user.update({ where: { id: userId }, data: { inviteCode: normalizedCode }, select: { inviteCode: true } });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") throw new AppError(409, 3105, "该邀请码已被其他用户使用");
    throw error;
  }
}

/** 将 Asia/Shanghai 的自然日映射为稳定的 UTC 日期值，避免服务器时区变化导致重复签到。 */
function chinaDate(offsetDays = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const date = new Date(`${parts}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date;
}

export function checkIn(userId: bigint) {
  return assertAllowed(userId, "reward").then(() => prisma.$transaction(async (tx) => {
    const today = chinaDate();
    if (await tx.checkIn.findUnique({ where: { userId_date: { userId, date: today } } })) throw new AppError(409, 3110, "今天已经签到");
    const latest = await tx.checkIn.findFirst({ where: { userId }, orderBy: { date: "desc" } });
    const yesterday = chinaDate(-1);
    const streak = latest?.date.getTime() === yesterday.getTime() ? latest.streak + 1 : 1;
    const cycleDay = ((streak - 1) % 7) + 1;
    const rule = await tx.rewardRule.findUnique({ where: { code: `SIGNIN_DAY_${cycleDay}` } });
    const reward = rule?.enabled ? rule.amount : 0n;
    const record = await tx.checkIn.create({ data: { userId, date: today, streak, reward } });
    if (reward > 0n) await award(tx, userId, `SIGNIN_DAY_${cycleDay}`, "SIGNIN", `signin:${userId}:${today.toISOString().slice(0, 10)}`, `连续签到第 ${cycleDay} 天`);
    return record;
  }, { isolationLevel: "Serializable" }));
}

export async function getRewardCenter(userId: bigint) {
  const inviteCode = await ensureInviteCode(userId);
  const today = chinaDate();
  const [relation, invitedCount, todayCheckIn, recentCheckIns, rules] = await prisma.$transaction([
    prisma.inviteRelation.findUnique({ where: { inviteeId: userId }, include: { inviter: { select: { nickname: true, phone: true } } } }),
    prisma.inviteRelation.count({ where: { inviterId: userId } }),
    prisma.checkIn.findUnique({ where: { userId_date: { userId, date: today } } }),
    prisma.checkIn.findMany({ where: { userId, date: { gte: chinaDate(-30) } }, orderBy: { date: "desc" } }),
    prisma.rewardRule.findMany({ where: { code: { startsWith: "SIGNIN_DAY_" } }, orderBy: { code: "asc" } }),
  ]);
  return { inviteCode, relation, invitedCount, checkedInToday: Boolean(todayCheckIn), streak: recentCheckIns[0]?.streak ?? 0, recentCheckIns, signInRules: rules };
}

/** App 金币明细只返回当前用户的数据，按创建时间倒序分页。 */
export async function listMyLedgers(userId: bigint, query: RewardListQuery) {
  const [list, total] = await prisma.$transaction([
    prisma.rewardLedger.findMany({ where: { userId }, skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: { createdAt: "desc" } }),
    prisma.rewardLedger.count({ where: { userId } }),
  ]);
  return { list, total, page: query.page, pageSize: query.pageSize };
}

export const listRewardRules = () => prisma.rewardRule.findMany({ orderBy: { code: "asc" } });
export function updateRewardRule(operatorId: bigint, code: string, data: { amount: bigint; enabled: boolean }, request: Pick<Request, "method" | "path" | "ip" | "header">) {
  return prisma.$transaction(async (tx) => {
    const rule = await tx.rewardRule.update({ where: { code }, data });
    await tx.auditLog.create({ data: {
      operatorId, action: "reward.rule.update", method: request.method, path: request.path,
      targetType: "reward_rule", targetId: code, ip: request.ip, userAgent: request.header("user-agent"),
      detail: { amount: data.amount.toString(), enabled: data.enabled },
    } });
    return rule;
  });
}

export async function listInvites(query: RewardListQuery) {
  const [list, total] = await prisma.$transaction([
    prisma.inviteRelation.findMany({ skip: (query.page - 1) * query.pageSize, take: query.pageSize, include: { inviter: { select: { phone: true, nickname: true } }, invitee: { select: { phone: true, nickname: true } } }, orderBy: { id: "desc" } }),
    prisma.inviteRelation.count(),
  ]);
  return { list, total, ...query };
}

export async function listCheckIns(query: RewardListQuery) {
  const [list, total] = await prisma.$transaction([
    prisma.checkIn.findMany({ skip: (query.page - 1) * query.pageSize, take: query.pageSize, include: { user: { select: { phone: true, nickname: true } } }, orderBy: { id: "desc" } }),
    prisma.checkIn.count(),
  ]);
  return { list, total, ...query };
}
