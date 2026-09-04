import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../lib/http.js";

export const notFound: RequestHandler = (req, _res, next) =>
  next(new AppError(404, 1004, `接口不存在: ${req.method} ${req.path}`));

/** 最终错误出口：未知异常不向客户端泄漏 SQL、密钥和调用栈。 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  let normalized =
    error instanceof AppError
      ? error
      : new AppError(500, 1000, "服务器内部错误");
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
    normalized = new AppError(409, 1002, "数据已存在");
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  )
    normalized = new AppError(404, 1004, "数据不存在");
  if (normalized.status >= 500) console.error(error);
  res
    .status(normalized.status)
    .json({
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
      data: null,
      requestId: res.locals.requestId,
    });
};
