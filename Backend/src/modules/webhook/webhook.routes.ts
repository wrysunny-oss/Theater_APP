import { Router } from "express";
import { ok } from "../../lib/http.js";
import { validate } from "../../middleware/request.js";
import { pangleAdRevenueSchema } from "./webhook.schema.js";
import { receivePangleAdRevenue, verifyPangleSignature } from "./webhook.service.js";

const router = Router();

/** POST /pangle/ad-revenue：接收广告收入事件；需携带时间戳、随机串和 HMAC-SHA256 签名。 */
router.post("/pangle/ad-revenue", validate(pangleAdRevenueSchema), async (req, res) => {
  verifyPangleSignature(req);
  return ok(res, await receivePangleAdRevenue(req.body, req), "广告回调处理成功");
});

export default router;

