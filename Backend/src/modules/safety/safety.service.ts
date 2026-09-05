import type { Request } from 'express';
import { randomBytes } from 'node:crypto';
import { AppError } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import type { DeviceRiskAssessmentInput, ListQuery, RiskAssessmentContext, RiskPolicy } from './safety.schema.js';
type AuditRequest=Pick<Request,'method'|'path'|'ip'|'header'>;
export async function assertAllowed(userId:bigint,scope:'reward'|'withdrawal'){const user=await prisma.user.findUniqueOrThrow({where:{id:userId},select:{riskStatus:true}});const blocked=['FROZEN','BANNED',scope==='reward'?'REWARD_RESTRICTED':'WITHDRAWAL_RESTRICTED'];if(blocked.includes(user.riskStatus))throw new AppError(403,3401,`当前账号已被限制${scope==='reward'?'领取奖励':'提现'}`);}
export const createFeedback=(userId:bigint,data:any)=>prisma.feedback.create({data:{...data,userId,imageUrls:data.imageUrls}});
export const myFeedback=(userId:bigint)=>prisma.feedback.findMany({where:{userId},orderBy:{id:'desc'}});
export const createReport=(userId:bigint,data:any)=>prisma.report.create({data:{...data,userId,evidenceUrls:data.evidenceUrls}});
export async function listFeedback(q:ListQuery){const where=q.status?{status:q.status as any}:{};const [list,total]=await prisma.$transaction([prisma.feedback.findMany({where,include:{user:{select:{phone:true,nickname:true}}},skip:(q.page-1)*q.pageSize,take:q.pageSize,orderBy:{id:'desc'}}),prisma.feedback.count({where})]);return{list,total,...q};}
export async function handleFeedback(operatorId:bigint,id:bigint,data:any,req:AuditRequest){return prisma.$transaction(async tx=>{const item=await tx.feedback.update({where:{id},data:{...data,handlerId:operatorId,...(['RESOLVED','CLOSED'].includes(data.status)?{resolvedAt:new Date()}: {})}});await tx.auditLog.create({data:{operatorId,action:'feedback.handle',method:req.method,path:req.path,targetType:'feedback',targetId:id.toString(),ip:req.ip,userAgent:req.header('user-agent'),detail:{status:data.status}}});return item;});}
export async function listReports(q:ListQuery){const where=q.status?{status:q.status as any}:{};const [list,total]=await prisma.$transaction([prisma.report.findMany({where,include:{user:{select:{phone:true,nickname:true}}},skip:(q.page-1)*q.pageSize,take:q.pageSize,orderBy:{id:'desc'}}),prisma.report.count({where})]);return{list,total,...q};}
export const handleReport=(operatorId:bigint,id:bigint,data:any)=>prisma.report.update({where:{id},data:{...data,handlerId:operatorId,...(['VALID','INVALID','CLOSED'].includes(data.status)?{resolvedAt:new Date()}: {})}});
export async function listRisks(q:ListQuery){const where=q.status?{status:q.status as any}:{};const [list,total]=await prisma.$transaction([prisma.riskEvent.findMany({where,include:{user:{select:{id:true,phone:true,nickname:true,riskStatus:true}}},skip:(q.page-1)*q.pageSize,take:q.pageSize,orderBy:{id:'desc'}}),prisma.riskEvent.count({where})]);return{list,total,...q};}
export const handleRisk=(operatorId:bigint,id:bigint,data:any)=>prisma.riskEvent.update({where:{id},data:{...data,handlerId:operatorId,handledAt:new Date()}});
export async function updateUserRisk(operatorId:bigint,userId:bigint,data:any,req:AuditRequest){return prisma.$transaction(async tx=>{const status=data.riskStatus==='BANNED'?'DISABLED':data.riskStatus==='NORMAL'?'ACTIVE':undefined;const user=await tx.user.update({where:{id:userId},data:{...data,...(status?{status}: {})}});if(['BANNED','FROZEN'].includes(data.riskStatus))await tx.refreshToken.updateMany({where:{userId,revokedAt:null},data:{revokedAt:new Date()}});await tx.auditLog.create({data:{operatorId,action:'user.risk.update',method:req.method,path:req.path,targetType:'user',targetId:userId.toString(),ip:req.ip,userAgent:req.header('user-agent'),detail:{...data,status}}});return user;});}
export const userSecurity=(userId:bigint)=>Promise.all([prisma.loginLog.findMany({where:{userId},take:50,orderBy:{id:'desc'}}),prisma.userDevice.findMany({where:{userId},orderBy:{lastSeenAt:'desc'}}),prisma.riskEvent.findMany({where:{userId},take:50,orderBy:{id:'desc'}}),prisma.deviceRiskAssessment.findMany({where:{userId},take:50,orderBy:{createdAt:'desc'}})]).then(([loginLogs,devices,riskEvents,riskAssessments])=>({loginLogs,devices,riskEvents,riskAssessments}));

const toRadians = (degrees:number) => degrees * Math.PI / 180;
/** 使用 Haversine 公式由服务端计算两坐标距离，不直接信任客户端提交的距离。 */
export function distanceInMeters(a:{latitude:number;longitude:number},b:{latitude:number;longitude:number}) {
  const earthRadius=6_371_000; const dLat=toRadians(b.latitude-a.latitude); const dLon=toRadians(b.longitude-a.longitude);
  const value=Math.sin(dLat/2)**2+Math.cos(toRadians(a.latitude))*Math.cos(toRadians(b.latitude))*Math.sin(dLon/2)**2;
  return Math.round(earthRadius*2*Math.atan2(Math.sqrt(value),Math.sqrt(1-value)));
}

/** SIM、三款常用应用、模拟器、云机、脚本、网络、IP 和位置各占 10 分。 */
export const DEFAULT_RISK_POLICY:RiskPolicy={enabled:true,requireFreshAssessment:false,minKnownChecks:6,autoBanThreshold:60,warningThreshold:80,maxDistanceMeters:50_000,loginValidityHours:24,rewardValidityMinutes:360,withdrawalValidityMinutes:10,multiAccountDeviceThreshold:3,multiAccountIpThreshold:10};
export function calculateDeviceRiskScore(input:DeviceRiskAssessmentInput,policy:RiskPolicy=DEFAULT_RISK_POLICY) {
  const distanceMeters=input.location?distanceInMeters(input.location,{latitude:input.location.referenceLatitude,longitude:input.location.referenceLongitude}):null;
  const checks={sim:input.simStatus,wechat:input.wechatStatus,douyin:input.douyinStatus,alipay:input.alipayStatus,emulator:input.emulatorStatus,cloudDevice:input.cloudDeviceStatus,script:input.scriptStatus,network:input.networkStatus,ip:input.ipStatus,location:distanceMeters===null?'UNKNOWN':distanceMeters<=policy.maxDistanceMeters?'PASS':'RISK'} as const;
  const values=Object.values(checks);const knownChecks=values.filter(value=>value!=='UNKNOWN').length;const riskChecks=values.filter(value=>value==='RISK').length;
  return {score:100-riskChecks*10,knownChecks,eligibleForDecision:knownChecks>=policy.minKnownChecks,checks,distanceMeters};
}

/** 快照入库；低于 60 分时封号、撤销刷新令牌并创建严重风险事件。 */
export async function assessDeviceRisk(userId:bigint,input:DeviceRiskAssessmentInput,req:AuditRequest) {
  const policy=await getRiskPolicy(); const result=calculateDeviceRiskScore(input,policy); const autoBanned=policy.enabled&&result.eligibleForDecision&&result.score<policy.autoBanThreshold;
  return prisma.$transaction(async tx=>{
    const challenge=await tx.deviceRiskChallenge.findFirst({where:{id:input.challengeId,userId,usedAt:null,expiresAt:{gt:new Date()}}});if(!challenge)throw new AppError(409,3403,'设备检测挑战不存在、已过期或已使用');await tx.deviceRiskChallenge.update({where:{id:challenge.id},data:{usedAt:new Date()}});
    const safe=(value:'PASS'|'RISK'|'UNKNOWN')=>value==='UNKNOWN'?null:value==='PASS';const detected=(value:'PASS'|'RISK'|'UNKNOWN')=>value==='UNKNOWN'?null:value==='RISK';
    const assessment=await tx.deviceRiskAssessment.create({data:{userId,deviceId:input.deviceId,score:result.score,knownChecks:result.knownChecks,autoBanned,simPresent:safe(input.simStatus),wechatInstalled:safe(input.wechatStatus),douyinInstalled:safe(input.douyinStatus),alipayInstalled:safe(input.alipayStatus),emulatorDetected:detected(input.emulatorStatus),cloudDeviceDetected:detected(input.cloudDeviceStatus),scriptDetected:detected(input.scriptStatus),networkTrusted:safe(input.networkStatus),ipTrusted:safe(input.ipStatus),locationDistanceSafe:safe(result.checks.location),distanceMeters:result.distanceMeters,ip:req.ip,detail:{context:challenge.context,checks:result.checks,evidenceJson:JSON.stringify(input.evidence??{})}}});
    const [deviceUsers,ipUsers]=await Promise.all([tx.deviceRiskAssessment.findMany({where:{deviceId:input.deviceId},distinct:['userId'],select:{userId:true}}),req.ip?tx.deviceRiskAssessment.findMany({where:{ip:req.ip},distinct:['userId'],select:{userId:true}}):Promise.resolve([])]);
    if(autoBanned){
      await tx.user.update({where:{id:userId},data:{riskStatus:'BANNED',status:'DISABLED',riskRemark:`设备环境评分 ${result.score} 分，低于 ${policy.autoBanThreshold} 分自动封号`}});
      await tx.refreshToken.updateMany({where:{userId,revokedAt:null},data:{revokedAt:new Date()}});
      await tx.riskEvent.create({data:{userId,ruleCode:'DEVICE_ENV_SCORE_LOW',level:'CRITICAL',title:'设备环境评分过低，已自动封号',detail:{assessmentId:assessment.id,score:result.score,checks:result.checks,distanceMeters:result.distanceMeters,ip:req.ip}}});
    } else if(policy.enabled&&result.eligibleForDecision&&result.score<policy.warningThreshold) await tx.riskEvent.create({data:{userId,ruleCode:'DEVICE_ENV_SCORE_WARNING',level:'MEDIUM',title:'设备环境评分偏低',detail:{assessmentId:assessment.id,score:result.score,checks:result.checks}}});
    if(!result.eligibleForDecision)await tx.riskEvent.create({data:{userId,ruleCode:'DEVICE_ENV_EVIDENCE_INSUFFICIENT',level:'MEDIUM',title:'设备检测有效项目不足',detail:{assessmentId:assessment.id,knownChecks:result.knownChecks,required:policy.minKnownChecks,checks:result.checks}}});
    if(deviceUsers.length>=policy.multiAccountDeviceThreshold)await tx.riskEvent.create({data:{userId,ruleCode:'DEVICE_MULTI_ACCOUNT',level:'HIGH',title:'同一设备关联多个账号',detail:{assessmentId:assessment.id,deviceId:input.deviceId,accountCount:deviceUsers.length}}});
    if(req.ip&&ipUsers.length>=policy.multiAccountIpThreshold)await tx.riskEvent.create({data:{userId,ruleCode:'IP_MULTI_ACCOUNT',level:'HIGH',title:'同一 IP 关联账号过多',detail:{assessmentId:assessment.id,ip:req.ip,accountCount:ipUsers.length}}});
    return {id:assessment.id,score:result.score,knownChecks:result.knownChecks,eligibleForDecision:result.eligibleForDecision,autoBanned,checks:result.checks,distanceMeters:result.distanceMeters,deviceAccountCount:deviceUsers.length,ipAccountCount:ipUsers.length};
  });
}

/** 后台分页查看设备环境评分历史及当前账号状态。 */
export async function listDeviceRiskAssessments(q:ListQuery){const [list,total]=await prisma.$transaction([prisma.deviceRiskAssessment.findMany({include:{user:{select:{id:true,phone:true,nickname:true,riskStatus:true,status:true}}},skip:(q.page-1)*q.pageSize,take:q.pageSize,orderBy:{createdAt:'desc'}}),prisma.deviceRiskAssessment.count()]);return{list,total,...q};}

export async function getRiskPolicy():Promise<RiskPolicy>{const row=await prisma.systemConfig.findUnique({where:{key:'risk.device_policy'}});if(!row||typeof row.value!=='object'||Array.isArray(row.value))return DEFAULT_RISK_POLICY;return {...DEFAULT_RISK_POLICY,...row.value as Partial<RiskPolicy>};}
export async function createRiskChallenge(userId:bigint,context:RiskAssessmentContext){await prisma.deviceRiskChallenge.deleteMany({where:{userId,usedAt:null,expiresAt:{lt:new Date()}}});return prisma.deviceRiskChallenge.create({data:{userId,context,nonce:randomBytes(32).toString('hex'),expiresAt:new Date(Date.now()+2*60_000)},select:{id:true,context:true,nonce:true,expiresAt:true}});}
function validityMilliseconds(policy:RiskPolicy,context:RiskAssessmentContext){return context==='login'?policy.loginValidityHours*3_600_000:(context==='reward'?policy.rewardValidityMinutes:policy.withdrawalValidityMinutes)*60_000;}
/** 返回最近检测是否满足登录、广告奖励或提现场景的有效期。 */
export async function getRiskAssessmentStatus(userId:bigint,context:RiskAssessmentContext){const policy=await getRiskPolicy();const latest=await prisma.deviceRiskAssessment.findFirst({where:{userId},orderBy:{createdAt:'desc'},select:{id:true,score:true,autoBanned:true,createdAt:true}});const expiresAt=latest?new Date(latest.createdAt.getTime()+validityMilliseconds(policy,context)):null;const fresh=Boolean(expiresAt&&expiresAt.getTime()>Date.now());return{context,fresh,required:policy.enabled&&policy.requireFreshAssessment,latest,expiresAt};}
/** 强制模式开启后，高价值操作必须存在对应时效内的设备检测。 */
export async function assertFreshRiskAssessment(userId:bigint,context:'reward'|'withdrawal'){const status=await getRiskAssessmentStatus(userId,context);if(status.required&&!status.fresh)throw new AppError(403,3402,context==='reward'?'设备安全检测已过期，请重新检测后观看广告':'设备安全检测已过期，请重新检测后提现',{context,expiresAt:status.expiresAt});return status;}
export async function updateRiskPolicy(operatorId:bigint,data:RiskPolicy,req:AuditRequest){return prisma.$transaction(async tx=>{const item=await tx.systemConfig.upsert({where:{key:'risk.device_policy'},create:{key:'risk.device_policy',value:data,description:'设备环境评分、关联账号和自动封号策略'},update:{value:data}});await tx.auditLog.create({data:{operatorId,action:'risk.policy.update',method:req.method,path:req.path,targetType:'system_config',targetId:item.key,ip:req.ip,userAgent:req.header('user-agent'),detail:data}});return item.value;});}
export async function getRiskDashboard(){const policy=await getRiskPolicy();const [total,banned,warning,pending,average]=await prisma.$transaction([prisma.deviceRiskAssessment.count(),prisma.deviceRiskAssessment.count({where:{autoBanned:true}}),prisma.deviceRiskAssessment.count({where:{score:{gte:policy.autoBanThreshold,lt:policy.warningThreshold}}}),prisma.riskEvent.count({where:{status:'PENDING'}}),prisma.deviceRiskAssessment.aggregate({_avg:{score:true}})]);return{totalAssessments:total,autoBanned:banned,warningAssessments:warning,pendingEvents:pending,averageScore:average._avg.score??0};}
