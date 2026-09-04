import { z } from "zod";

const optionalDate = z.string().datetime().nullish().transform((value) => value ? new Date(value) : null);
export const operationIdSchema = z.object({ id: z.coerce.bigint().positive() });
export const documentCodeSchema = z.object({ code: z.string().trim().min(2).max(50) });
export const configKeySchema = z.object({ key: z.string().trim().min(2).max(100) });
export const slotSchema = z.object({
  placement: z.enum(["HOME_BANNER", "HOME_RECOMMEND", "STARTUP_POPUP"]),
  title: z.string().trim().min(1).max(100), imageUrl: z.string().trim().min(1).max(1000),
  targetType: z.enum(["NONE", "DRAMA", "INTERNAL", "EXTERNAL"]), targetValue: z.string().trim().max(1000).nullish(),
  sort: z.number().int().min(-99999).max(99999), enabled: z.boolean(), startAt: optionalDate, endAt: optionalDate,
}).refine((data) => !data.startAt || !data.endAt || data.endAt > data.startAt, { message: "结束时间必须晚于开始时间", path: ["endAt"] });
export const announcementSchema = z.object({
  title: z.string().trim().min(1).max(150), content: z.string().trim().min(1).max(50_000),
  status: z.enum(["DRAFT", "PUBLISHED", "OFFLINE"]), startAt: optionalDate, endAt: optionalDate,
});
export const systemConfigSchema = z.object({ value: z.unknown(), description: z.string().trim().max(255).nullish() });
export const documentSchema = z.object({
  code: z.string().trim().min(2).max(50), title: z.string().trim().min(1).max(150), version: z.string().trim().min(1).max(30),
  content: z.string().trim().min(1).max(500_000), status: z.enum(["DRAFT", "PUBLISHED", "OFFLINE"]),
});
export const versionSchema = z.object({
  platform: z.enum(["ANDROID", "IOS"]), versionName: z.string().trim().min(1).max(30),
  versionCode: z.number().int().positive(), minVersionCode: z.number().int().positive(),
  downloadUrl: z.string().trim().url().max(1000), releaseNotes: z.string().trim().min(1).max(20_000),
  enabled: z.boolean(), rolloutPercent: z.number().int().min(0).max(100), publishedAt: optionalDate,
}).refine((data) => data.minVersionCode <= data.versionCode, { message: "最低版本号不能高于发布版本号", path: ["minVersionCode"] });
export const versionCheckSchema = z.object({
  platform: z.enum(["ANDROID", "IOS"]), versionCode: z.coerce.number().int().positive(), deviceId: z.string().trim().min(1).max(100),
});
