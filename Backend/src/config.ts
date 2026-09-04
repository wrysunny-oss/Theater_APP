import "dotenv/config";
import { z } from "zod";

/** 启动时集中校验配置，避免服务带着缺失密钥或错误端口继续运行。 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("30d"),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  WITHDRAW_DATA_SECRET: z.string().min(32),
  PANGLE_CALLBACK_SECRET: z.string().min(32).default("local-pangle-callback-secret-change-me"),
  PANGLE_CALLBACK_IPS: z.string().default(""),
});

export const env = schema.parse(process.env);
// 只允许白名单中的前端来源跨域访问，不在生产环境使用通配符。
export const corsOrigins = env.CORS_ORIGINS.split(",").map((item) => item.trim()).filter(Boolean);
