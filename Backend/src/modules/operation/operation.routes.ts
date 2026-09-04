import { Router } from "express";
import { ok } from "../../lib/http.js";
import { validate } from "../../middleware/request.js";
import { documentCodeSchema, versionCheckSchema } from "./operation.schema.js";
import * as operationService from "./operation.service.js";

const router = Router();
/** GET /bootstrap：App 启动时获取有效运营位、公告、基础参数和功能开关；公开接口。 */
router.get("/bootstrap", async (_req, res) => ok(res, await operationService.getBootstrap()));
/** GET /documents/:code：获取指定协议或帮助文档的最新发布版本；公开接口。 */
router.get("/documents/:code", validate(documentCodeSchema, "params"), async (req, res) => ok(res, await operationService.getPublishedDocument(String(req.params.code))));
/** GET /version-check：根据平台、版本号和设备标识判断升级及强制更新；公开接口。 */
router.get("/version-check", validate(versionCheckSchema, "query"), async (_req, res) => { const query = res.locals.validatedQuery; return ok(res, await operationService.checkVersion(query.platform, query.versionCode, query.deviceId)); });
export default router;
