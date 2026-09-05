import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { extname, resolve } from "node:path";
import multer from "multer";
import { AppError, ok } from "../../lib/http.js";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/request.js";
import { uploadLimiter } from "../../middleware/rate-limit.js";
import { changePasswordSchema, credentialsSchema, refreshSchema, registerSchema, updateProfileSchema } from "./auth.schema.js";
import { revokeRefreshToken, rotateRefreshToken } from "../../services/token.service.js";
import * as authService from "./auth.service.js";

const router = Router();
const avatarDirectory = resolve(process.cwd(), "uploads");
mkdirSync(avatarDirectory, { recursive: true });
const uploadAvatar = multer({
  storage: multer.diskStorage({
    destination: avatarDirectory,
    filename: (_req, file, callback) => callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => callback(null, ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)),
});
const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { code: 1008, message: "请求过于频繁，请稍后重试", data: null } });

/** POST /register：注册 App 用户，可选绑定邀请码；成功返回令牌，公开接口。 */
router.post("/register", authLimiter, validate(registerSchema), async (req, res) => {
  return ok(res, await authService.register(req.body), "注册成功", 201);
});

/** POST /login：使用手机号或后台账号加密码登录；成功返回访问令牌和刷新令牌。 */
router.post("/login", authLimiter, validate(credentialsSchema), async (req, res) => {
  return ok(res, await authService.login(req.body.phone, req.body.password, req));
});

/** POST /admin-login：后台专用登录入口，仅管理员和代理账号可以登录。 */
router.post("/admin-login", authLimiter, validate(credentialsSchema), async (req, res) => {
  return ok(res, await authService.login(req.body.phone, req.body.password, req, true));
});

/** POST /refresh：单次使用刷新令牌并轮换一组新令牌。 */
router.post("/refresh", authLimiter, validate(refreshSchema), async (req, res) => ok(res, await rotateRefreshToken(req.body.refreshToken)));
/** POST /logout：撤销指定刷新令牌，重复调用保持幂等。 */
router.post("/logout", validate(refreshSchema), async (req, res) => { await revokeRefreshToken(req.body.refreshToken); return ok(res, null, "已退出登录"); });
/** PUT /password：验证旧密码并修改当前账号密码，同时撤销所有刷新令牌。 */
router.put("/password", authenticate, validate(changePasswordSchema), async (req, res) => ok(res, await authService.changePassword(req.auth!.userId, req.body.oldPassword, req.body.newPassword), "密码修改成功"));

/** GET /me：读取当前登录用户的安全资料字段；需要 Bearer Token。 */
router.get("/me", authenticate, async (req, res) => {
  return ok(res, await authService.getProfile(req.auth!.userId));
});

/** PUT /me：更新当前用户昵称、性别、生日和简介；需要 Bearer Token。 */
router.put("/me", authenticate, validate(updateProfileSchema), async (req, res) =>
  ok(res, await authService.updateProfile(req.auth!.userId, req.body), "资料保存成功"),
);

/** POST /avatar：上传 5MB 以内头像并立即绑定当前用户；需要 Bearer Token。 */
router.post("/avatar", authenticate, uploadLimiter, uploadAvatar.single("file"), async (req, res) => {
  if (!req.file) throw new AppError(422, 2010, "请选择 JPEG、PNG、WebP 或 GIF 图片");
  return ok(res, await authService.updateAvatar(req.auth!.userId, `/uploads/${req.file.filename}`), "头像上传成功", 201);
});

export default router;
