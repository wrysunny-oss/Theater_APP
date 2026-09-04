import { Router } from "express";
import { ok } from "../../lib/http.js";
import { validate } from "../../middleware/request.js";
import { dramaIdSchema, dramaListQuerySchema, type DramaListQuery } from "./content.schema.js";
import * as contentService from "./content.service.js";

const router = Router();

/** GET /dramas：分页查询已发布短剧，可使用分类和关键词筛选；公开接口。 */
router.get("/dramas", validate(dramaListQuerySchema, "query"), async (req, res) => {
  return ok(res, await contentService.listDramas(res.locals.validatedQuery as DramaListQuery));
});

/** GET /dramas/:id：查询单部已发布短剧及其剧集；id 为正整数，公开接口。 */
router.get("/dramas/:id", validate(dramaIdSchema, "params"), async (req, res) => {
  return ok(res, await contentService.getDrama(BigInt(String(req.params.id))));
});

export default router;
