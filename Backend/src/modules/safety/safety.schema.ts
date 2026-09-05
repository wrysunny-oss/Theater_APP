import { z } from "zod";
export const feedbackSchema = z.object({ type:z.string().trim().min(2).max(30),content:z.string().trim().min(2).max(10000),contact:z.string().trim().max(100).optional(),imageUrls:z.array(z.string().max(1000)).max(9).optional() });
export const reportSchema = z.object({ type:z.string().trim().min(2).max(30),targetType:z.string().trim().min(2).max(30),targetId:z.string().trim().max(100).optional(),content:z.string().trim().min(2).max(10000),evidenceUrls:z.array(z.string().max(1000)).max(9).optional() });
export const listSchema=z.object({page:z.coerce.number().int().min(1).default(1),pageSize:z.coerce.number().int().min(1).max(100).default(20),status:z.string().optional()});
export const idSchema=z.object({id:z.coerce.bigint().positive()});
export const feedbackHandleSchema=z.object({status:z.enum(['PROCESSING','RESOLVED','CLOSED']),reply:z.string().max(10000).optional(),internalNote:z.string().max(10000).optional()});
export const reportHandleSchema=z.object({status:z.enum(['PROCESSING','VALID','INVALID','CLOSED']),disposition:z.string().max(100).optional(),remark:z.string().max(10000).optional()});
export const riskHandleSchema=z.object({status:z.enum(['CONFIRMED','IGNORED']),remark:z.string().trim().min(2).max(500)});
export const userRiskSchema=z.object({riskStatus:z.enum(['NORMAL','WATCH','REWARD_RESTRICTED','WITHDRAWAL_RESTRICTED','FROZEN','BANNED']),riskRemark:z.string().trim().min(2).max(500)});
/** APP 环境检测统一上报格式；UNKNOWN 表示无法可靠判断，不参与自动处罚。 */
const checkResult=z.enum(['PASS','RISK','UNKNOWN']);
export const deviceRiskAssessmentSchema = z.object({
  challengeId:z.string().uuid(),deviceId: z.string().trim().min(8).max(100), simStatus:checkResult, wechatStatus:checkResult, douyinStatus:checkResult, alipayStatus:checkResult,
  emulatorStatus:checkResult, cloudDeviceStatus:checkResult, scriptStatus:checkResult, networkStatus:checkResult, ipStatus:checkResult,
  location: z.object({ latitude:z.number().min(-90).max(90), longitude:z.number().min(-180).max(180), referenceLatitude:z.number().min(-90).max(90), referenceLongitude:z.number().min(-180).max(180), maxDistanceMeters:z.number().int().min(100).max(1_000_000).default(50_000) }).optional(),
  evidence: z.record(z.string(), z.unknown()).optional(),
});
export const riskPolicySchema=z.object({enabled:z.boolean(),requireFreshAssessment:z.boolean(),minKnownChecks:z.number().int().min(1).max(10),autoBanThreshold:z.number().int().min(10).max(100),warningThreshold:z.number().int().min(10).max(100),maxDistanceMeters:z.number().int().min(100).max(1_000_000),loginValidityHours:z.number().int().min(1).max(168),rewardValidityMinutes:z.number().int().min(1).max(1440),withdrawalValidityMinutes:z.number().int().min(1).max(1440),multiAccountDeviceThreshold:z.number().int().min(2).max(100),multiAccountIpThreshold:z.number().int().min(2).max(100)}).refine(value=>value.warningThreshold>=value.autoBanThreshold,{message:'预警阈值不能低于自动封号阈值'});
export const riskAssessmentStatusSchema=z.object({context:z.enum(['login','reward','withdrawal']).default('login')});
export const createRiskChallengeSchema=z.object({context:z.enum(['login','reward','withdrawal'])});
export type ListQuery=z.infer<typeof listSchema>;
export type DeviceRiskAssessmentInput=z.infer<typeof deviceRiskAssessmentSchema>;
export type RiskPolicy=z.infer<typeof riskPolicySchema>;
export type RiskAssessmentContext=z.infer<typeof riskAssessmentStatusSchema>['context'];
