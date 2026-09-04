import { rateLimit } from "express-rate-limit";

const response = { code: 1008, message: "请求过于频繁，请稍后重试", data: null };
/** 奖励、反馈等写操作的通用 IP 限流器；生产环境可在网关叠加分布式限流。 */
export const actionLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 60, standardHeaders: true, legacyHeaders: false, message: response });
/** 提现属于资金操作，使用更严格的每小时请求上限。 */
export const financialLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false, message: response });
/** 图片上传限制频率，避免本地磁盘被恶意请求快速占满。 */
export const uploadLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 30, standardHeaders: true, legacyHeaders: false, message: response });
