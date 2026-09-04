import { createHash, randomUUID } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/http.js";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const durationMs = (value: string) => value.endsWith("d") ? Number(value.slice(0, -1)) * 86400000 : 30 * 86400000;

/**
 * 数据库只保存刷新令牌的摘要，泄库后攻击者也不能直接使用存储值。
 * jti 作为单次令牌 ID，便于后续实现令牌轮换、单设备下线和风险封禁。
 */
export const issueTokens = async (userId: bigint) => {
  const accessToken = jwt.sign({ type: "access" }, env.JWT_ACCESS_SECRET, { subject: userId.toString(), expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"] });
  const tokenId = randomUUID();
  const refreshToken = jwt.sign({ type: "refresh", jti: tokenId }, env.JWT_REFRESH_SECRET, { subject: userId.toString(), expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"] });
  await prisma.refreshToken.create({ data: { id: tokenId, userId, tokenHash: hash(refreshToken), expiresAt: new Date(Date.now() + durationMs(env.REFRESH_TOKEN_EXPIRES_IN)) } });
  return { accessToken, refreshToken, expiresIn: 900 };
};

/** 刷新令牌单次使用：原令牌原子撤销后签发新令牌，阻止重放。 */
export async function rotateRefreshToken(token: string) {
  let claims: { sub: string; type: string; jti: string };
  try { claims = jwt.verify(token, env.JWT_REFRESH_SECRET) as typeof claims; }
  catch { throw new AppError(401, 2008, "刷新令牌无效或已过期"); }
  if (claims.type !== "refresh" || !claims.jti) throw new AppError(401, 2008, "刷新令牌无效或已过期");
  const revoked = await prisma.refreshToken.updateMany({ where: { id: claims.jti, userId: BigInt(claims.sub), tokenHash: hash(token), revokedAt: null, expiresAt: { gt: new Date() } }, data: { revokedAt: new Date() } });
  if (revoked.count !== 1) throw new AppError(401, 2008, "刷新令牌无效或已使用");
  return issueTokens(BigInt(claims.sub));
}

export const revokeRefreshToken = (token: string) => prisma.refreshToken.updateMany({ where: { tokenHash: hash(token), revokedAt: null }, data: { revokedAt: new Date() } });
