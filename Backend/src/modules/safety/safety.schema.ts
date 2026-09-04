import { z } from "zod";
export const feedbackSchema = z.object({ type:z.string().trim().min(2).max(30),content:z.string().trim().min(2).max(10000),contact:z.string().trim().max(100).optional(),imageUrls:z.array(z.string().max(1000)).max(9).optional() });
export const reportSchema = z.object({ type:z.string().trim().min(2).max(30),targetType:z.string().trim().min(2).max(30),targetId:z.string().trim().max(100).optional(),content:z.string().trim().min(2).max(10000),evidenceUrls:z.array(z.string().max(1000)).max(9).optional() });
export const listSchema=z.object({page:z.coerce.number().int().min(1).default(1),pageSize:z.coerce.number().int().min(1).max(100).default(20),status:z.string().optional()});
export const idSchema=z.object({id:z.coerce.bigint().positive()});
export const feedbackHandleSchema=z.object({status:z.enum(['PROCESSING','RESOLVED','CLOSED']),reply:z.string().max(10000).optional(),internalNote:z.string().max(10000).optional()});
export const reportHandleSchema=z.object({status:z.enum(['PROCESSING','VALID','INVALID','CLOSED']),disposition:z.string().max(100).optional(),remark:z.string().max(10000).optional()});
export const riskHandleSchema=z.object({status:z.enum(['CONFIRMED','IGNORED']),remark:z.string().trim().min(2).max(500)});
export const userRiskSchema=z.object({riskStatus:z.enum(['NORMAL','WATCH','REWARD_RESTRICTED','WITHDRAWAL_RESTRICTED','FROZEN','BANNED']),riskRemark:z.string().trim().min(2).max(500)});
/** APP 环境检测统一上报格式；风险布尔值为 true 表示检测到了异常。 */
export const deviceRiskAssessmentSchema = z.object({
  deviceId: z.string().trim().min(8).max(100), simPresent: z.boolean(), wechatInstalled: z.boolean(), douyinInstalled: z.boolean(), alipayInstalled: z.boolean(),
  emulatorDetected: z.boolean(), cloudDeviceDetected: z.boolean(), scriptDetected: z.boolean(), networkRiskDetected: z.boolean(), ipRiskDetected: z.boolean(),
  location: z.object({ latitude:z.number().min(-90).max(90), longitude:z.number().min(-180).max(180), referenceLatitude:z.number().min(-90).max(90), referenceLongitude:z.number().min(-180).max(180), maxDistanceMeters:z.number().int().min(100).max(1_000_000).default(50_000) }).optional(),
  evidence: z.record(z.string(), z.unknown()).optional(),
});
export type ListQuery=z.infer<typeof listSchema>;
export type DeviceRiskAssessmentInput=z.infer<typeof deviceRiskAssessmentSchema>;
