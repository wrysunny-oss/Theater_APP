import { z } from "zod";

/** 穿山甲广告收入回调的内部统一格式；正式字段映射可在适配层单独调整。 */
export const pangleAdRevenueSchema = z.object({
  eventId: z.string().trim().min(8).max(100),
  userId: z.coerce.bigint().positive(),
  revenueYuan: z.string().trim().regex(/^\d+(\.\d{1,6})?$/, "广告收入必须是最多 6 位小数的人民币金额"),
  source: z.string().trim().min(1).max(30).default("PANGLE"),
});

