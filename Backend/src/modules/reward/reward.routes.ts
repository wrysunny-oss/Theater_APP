import { Router } from "express";
import { ok } from "../../lib/http.js";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/request.js";
import { bindInviteSchema, rewardListQuerySchema, updateInviteCodeSchema, type RewardListQuery } from "./reward.schema.js";
import * as rewardService from "./reward.service.js";
import { actionLimiter } from "../../middleware/rate-limit.js";

const router = Router();
router.use(authenticate);

/** GET /center：返回个人邀请码、邀请数量、签到状态和签到规则；需要登录。 */
router.get("/center", async (req, res) => ok(res, await rewardService.getRewardCenter(req.auth!.userId)));
/** GET /ledgers：分页读取当前用户自己的金币流水；需要登录。 */
router.get("/ledgers", validate(rewardListQuerySchema, "query"), async (req, res) => ok(res, await rewardService.listMyLedgers(req.auth!.userId, res.locals.validatedQuery as RewardListQuery)));
/** POST /invite/bind：首次绑定邀请人并事务化发放邀请奖励；需要登录。 */
router.post("/invite/bind", actionLimiter, validate(bindInviteSchema), async (req, res) => ok(res, await rewardService.bindInvite(req.auth!.userId, req.body.inviteCode), "邀请关系绑定成功", 201));
/** PUT /invite-code：修改当前用户自己的邀请码；自动转为大写且全局唯一。 */
router.put("/invite-code", actionLimiter, validate(updateInviteCodeSchema), async (req, res) =>
  ok(res, await rewardService.updateInviteCode(req.auth!.userId, req.body.inviteCode), "邀请码修改成功"),
);
/** POST /check-ins：按北京时间完成当日签到并发放连续签到奖励；需要登录。 */
router.post("/check-ins", actionLimiter, async (req, res) => ok(res, await rewardService.checkIn(req.auth!.userId), "签到成功", 201));

export default router;
