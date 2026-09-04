import { z } from "zod";

export const bindInviteSchema = z.object({
  inviteCode: z.string().trim().toUpperCase().min(6).max(12),
});

/** 自定义邀请码仅允许 6 至 12 位大写字母或数字。 */
export const updateInviteCodeSchema = z.object({
  inviteCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6,12}$/, "邀请码必须为 6-12 位字母或数字"),
});

export const rewardListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const rewardRuleCodeSchema = z.object({ code: z.string().trim().min(1).max(50) });
export const updateRewardRuleSchema = z.object({
  amount: z.coerce.bigint().min(0n),
  enabled: z.boolean(),
});

export type RewardListQuery = z.infer<typeof rewardListQuerySchema>;
