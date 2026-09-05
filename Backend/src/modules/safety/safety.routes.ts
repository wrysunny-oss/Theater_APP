import { Router } from "express";
import { ok } from "../../lib/http.js";
import { authenticate } from "../../middleware/auth.js";
import { actionLimiter } from "../../middleware/rate-limit.js";
import { validate } from "../../middleware/request.js";
import { createRiskChallengeSchema, deviceRiskAssessmentSchema, feedbackSchema, reportSchema, riskAssessmentStatusSchema } from "./safety.schema.js";
import * as service from "./safety.service.js";

const router = Router();
router.use(authenticate);

/** POST /feedback：提交问题、联系方式和图片证据；需要登录。 */
router.post("/feedback", actionLimiter, validate(feedbackSchema), async (req, res) => ok(res, await service.createFeedback(req.auth!.userId, req.body), "反馈已提交", 201));
/** GET /feedback/mine：查看当前用户反馈状态和官方回复；需要登录。 */
router.get("/feedback/mine", async (req, res) => ok(res, await service.myFeedback(req.auth!.userId)));
/** POST /reports：提交内容、广告或用户行为举报；需要登录。 */
router.post("/reports", actionLimiter, validate(reportSchema), async (req, res) => ok(res, await service.createReport(req.auth!.userId, req.body), "举报已提交", 201));
/** POST /device-risk-assessments：服务端按十项环境检测评分，低于 60 分自动封号。 */
router.post("/device-risk-assessments", actionLimiter, validate(deviceRiskAssessmentSchema), async (req, res) => ok(res, await service.assessDeviceRisk(req.auth!.userId, req.body, req), "设备风险检测完成", 201));
/** GET /device-risk-status：查询登录、广告或提现场景下最近检测是否仍然有效。 */
router.get("/device-risk-status", validate(riskAssessmentStatusSchema, "query"), async (req, res) => ok(res, await service.getRiskAssessmentStatus(req.auth!.userId, res.locals.validatedQuery.context)));
/** POST /device-risk-challenges：签发两分钟有效的一次性随机挑战，用于绑定本次原生检测。 */
router.post("/device-risk-challenges", actionLimiter, validate(createRiskChallengeSchema), async (req, res) => ok(res, await service.createRiskChallenge(req.auth!.userId, req.body.context), "设备检测挑战已签发", 201));

export default router;
