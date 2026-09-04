import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { env } from "../../config.js";
import { AppError } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";
import { settleAdReward } from "../admin/admin.service.js";

const MAX_CLOCK_SKEW_SECONDS = 300;

/** 校验时间戳、来源 IP 和 HMAC，避免伪造请求及五分钟以外的重放请求。 */
export function verifyPangleSignature(request: Request) {
  const timestamp = request.header("x-pangle-timestamp") ?? "";
  const nonce = request.header("x-pangle-nonce") ?? "";
  const signature = request.header("x-pangle-signature") ?? "";
  const seconds = Number(timestamp);
  if (!Number.isInteger(seconds) || Math.abs(Date.now() / 1000 - seconds) > MAX_CLOCK_SKEW_SECONDS) {
    throw new AppError(401, 3601, "回调时间戳无效或已过期");
  }
  const allowedIps = env.PANGLE_CALLBACK_IPS.split(",").map((item) => item.trim()).filter(Boolean);
  if (allowedIps.length && !allowedIps.includes(request.ip ?? "")) throw new AppError(403, 3602, "回调来源 IP 不在白名单中");
  const expected = createHmac("sha256", env.PANGLE_CALLBACK_SECRET).update(`${timestamp}.${nonce}.${JSON.stringify(request.body)}`).digest("hex");
  const actualBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (!nonce || actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new AppError(401, 3603, "回调签名验证失败");
  }
}

/** 先落接收日志，再使用 eventId 作为结算 requestId，重复回调只返回首次处理结果。 */
export async function receivePangleAdRevenue(input: { eventId: string; userId: bigint; revenueYuan: string; source: string }, request: Request) {
  const existing = await prisma.adCallbackLog.findUnique({ where: { eventId: input.eventId } });
  if (existing?.status === "SUCCESS") return { eventId: input.eventId, status: "SUCCESS", duplicate: true };
  if (existing?.status === "PROCESSING") throw new AppError(409, 3604, "该回调正在处理中");
  await prisma.adCallbackLog.upsert({
    where: { eventId: input.eventId },
    create: { eventId: input.eventId, status: "PROCESSING", payload: { ...input, userId: input.userId.toString() }, ip: request.ip },
    update: { status: "PROCESSING", reason: null, payload: { ...input, userId: input.userId.toString() }, ip: request.ip },
  });
  try {
    const settlement = await settleAdReward(null, { ...input, requestId: input.eventId }, request);
    await prisma.adCallbackLog.update({ where: { eventId: input.eventId }, data: { status: "SUCCESS" } });
    return { eventId: input.eventId, settlementId: settlement.id, status: "SUCCESS", duplicate: false };
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 500) : "未知错误";
    await prisma.adCallbackLog.update({ where: { eventId: input.eventId }, data: { status: "FAILED", reason } });
    throw error;
  }
}

/** 后台分页查看成功、失败和处理中回调，便于运营排查平台对接问题。 */
export async function listCallbackLogs(query: { page: number; pageSize: number }) {
  const [list, total] = await prisma.$transaction([
    prisma.adCallbackLog.findMany({ skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: { createdAt: "desc" } }),
    prisma.adCallbackLog.count(),
  ]);
  return { list, total, ...query };
}

