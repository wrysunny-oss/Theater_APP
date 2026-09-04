import compression from "compression";
import cors from "cors";
import express from "express";
import path from "node:path";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { pinoHttp } from "pino-http";
import { corsOrigins } from "./config.js";
import { ok } from "./lib/http.js";
import { prisma } from "./lib/prisma.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { requestContext } from "./middleware/request.js";
import { openApiDocument } from "./docs/openapi.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import contentRoutes from "./modules/content/content.routes.js";
import libraryRoutes from "./modules/library/library.routes.js";
import rewardRoutes from "./modules/reward/reward.routes.js";
import withdrawalRoutes from "./modules/withdrawal/withdrawal.routes.js";
import operationRoutes from "./modules/operation/operation.routes.js";
import safetyRoutes from "./modules/safety/safety.routes.js";
import webhookRoutes from "./modules/webhook/webhook.routes.js";

export const app = express();
// 反向代理后的真实 IP 会用于限流、访问日志和后台审计。
app.set("trust proxy", 1);
// 注册顺序很重要：上下文最先建立，业务路由居中，404 与错误出口始终放在最后。
app.use(requestContext);
app.use(pinoHttp());
// 文档必须先于全局 Helmet 注册；Swagger UI 使用内联初始化脚本，避免被默认 CSP 拦截。
app.get("/openapi.json", (_req, res) => res.json(openApiDocument));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument, { customSiteTitle: "幻悦短剧 API 文档" }));
app.use(helmet());
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "1mb" }));
// 本地开发文件服务；H5 与 API 使用不同端口，因此头像需要允许被跨源页面加载。
// 生产环境替换为对象存储 CDN 后，也应为资源配置等价的跨源访问策略。
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads"), {
  immutable: true,
  maxAge: "7d",
  setHeaders: (res) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  },
}));

// 轻量存活检查不访问数据库；部署时可另外增加包含数据库检查的 readiness 接口。
app.get("/health", (_req, res) => ok(res, { status: "up", timestamp: new Date() }));
/** GET /ready：检查服务进程和数据库是否同时可用，供负载均衡器决定是否接收流量。 */
app.get("/ready", async (_req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; return ok(res, { status: "ready", database: "up", timestamp: new Date() }); }
  catch { return res.status(503).json({ code: 1503, message: "数据库暂不可用", data: { status: "not_ready", database: "down" }, requestId: res.locals.requestId }); }
});
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/content", contentRoutes);
app.use("/api/v1/library", libraryRoutes);
app.use("/api/v1/rewards", rewardRoutes);
app.use("/api/v1/withdrawals", withdrawalRoutes);
app.use("/api/v1/operations", operationRoutes);
app.use("/api/v1/safety", safetyRoutes);
app.use("/api/v1/webhooks", webhookRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use(notFound);
app.use(errorHandler);
