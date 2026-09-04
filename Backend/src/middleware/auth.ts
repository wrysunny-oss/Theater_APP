import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config.js";
import { AppError } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";

type Claims = { sub: string; type: "access" };

/**
 * 验证访问令牌后重新读取账号状态及权限。
 * 这样禁用账号或收回角色会立即生效，不需要等待 JWT 自然过期。
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new AppError(401, 2001, "请先登录");
  try {
    const claims = jwt.verify(token, env.JWT_ACCESS_SECRET) as Claims;
    if (claims.type !== "access") throw new Error("invalid type");
    const user = await prisma.user.findFirst({
      where: { id: BigInt(claims.sub), status: "ACTIVE", riskStatus: { notIn: ["FROZEN", "BANNED"] } },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    });
    if (!user) throw new Error("user unavailable");
    req.auth = {
      userId: user.id,
      permissions: [
        ...new Set(
          user.roles.flatMap(({ role }) =>
            role.permissions.map(({ permission }) => permission.code),
          ),
        ),
      ],
    };
    next();
  } catch {
    throw new AppError(401, 2002, "登录已过期，请重新登录");
  }
};

/** 要求当前用户同时拥有传入的全部权限；`*` 是预留的超级权限。 */
export const permit =
  (...required: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const owned = req.auth?.permissions ?? [];
    if (!required.every((code) => owned.includes("*") || owned.includes(code)))
      throw new AppError(403, 2003, "无权执行此操作");
    next();
  };

/**
 * 高风险后台操作要求再次提交当前密码。
 * 密码只从请求头读取并即时比较，不写入日志、数据库或业务请求体。
 */
export const verifySecondaryPassword = async (req: Request, _res: Response, next: NextFunction) => {
  const password = req.header("x-confirm-password");
  if (!password) throw new AppError(428, 2010, "请输入当前登录密码进行二次验证");
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId }, select: { passwordHash: true } });
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(403, 2011, "二次验证密码错误");
  }
  next();
};
