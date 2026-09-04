import type { Request } from 'express';
import { AppError } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import type { DeviceRiskAssessmentInput, ListQuery } from './safety.schema.js';
type AuditRequest=Pick<Request,'method'|'path'|'ip'|'header'>;
export async function assertAllowed(userId:bigint,scope:'reward'|'withdrawal'){const user=await prisma.user.findUniqueOrThrow({where:{id:userId},select:{riskStatus:true}});const blocked=['FROZEN','BANNED',scope==='reward'?'REWARD_RESTRICTED':'WITHDRAWAL_RESTRICTED'];if(blocked.includes(user.riskStatus))throw new AppError(403,3401,`当前账号已被限制${scope==='reward'?'领取奖励':'提现'}`);}
export const createFeedback=(userId:bigint,data:any)=>prisma.feedback.create({data:{...data,userId,imageUrls:data.imageUrls}});
export const myFeedback=(userId:bigint)=>prisma.feedback.findMany({where:{userId},orderBy:{id:'desc'}});
export const createReport=(userId:bigint,data:any)=>prisma.report.create({data:{...data,userId,evidenceUrls:data.evidenceUrls}});
export async function listFeedback(q:ListQuery){const where=q.status?{status:q.status as any}:{};const [list,total]=await prisma.$transaction([prisma.feedback.findMany({where,include:{user:{select:{phone:true,nickname:true}}},skip:(q.page-1)*q.pageSize,take:q.pageSize,orderBy:{id:'desc'}}),prisma.feedback.count({where})]);return{list,total,...q};}
export async function handleFeedback(operatorId:bigint,id:bigint,data:any,req:AuditRequest){return prisma.$transaction(async tx=>{const item=await tx.feedback.update({where:{id},data:{...data,handlerId:operatorId,...(['RESOLVED','CLOSED'].includes(data.status)?{resolvedAt:new Date()}: {})}});await tx.auditLog.create({data:{operatorId,action:'feedback.handle',method:req.method,path:req.path,targetType:'feedback',targetId:id.toString(),ip:req.ip,userAgent:req.header('user-agent'),detail:{status:data.status}}});return item;});}
export async function listReports(q:ListQuery){const where=q.status?{status:q.status as any}:{};const [list,total]=await prisma.$transaction([prisma.report.findMany({where,include:{user:{select:{phone:true,nickname:true}}},skip:(q.page-1)*q.pageSize,take:q.pageSize,orderBy:{id:'desc'}}),prisma.report.count({where})]);return{list,total,...q};}
export const handleReport=(operatorId:bigint,id:bigint,data:any)=>prisma.report.update({where:{id},data:{...data,handlerId:operatorId,...(['VALID','INVALID','CLOSED'].includes(data.status)?{resolvedAt:new Date()}: {})}});
export async function listRisks(q:ListQuery){const where=q.status?{status:q.status as any}:{};const [list,total]=await prisma.$transaction([prisma.riskEvent.findMany({where,include:{user:{select:{phone:true,nickname:true,riskStatus:true}}},skip:(q.page-1)*q.pageSize,take:q.pageSize,orderBy:{id:'desc'}}),prisma.riskEvent.count({where})]);return{list,total,...q};}
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
export function calculateDeviceRiskScore(input:DeviceRiskAssessmentInput) {
  const distanceMeters=input.location?distanceInMeters(input.location,{latitude:input.location.referenceLatitude,longitude:input.location.referenceLongitude}):null;
  const checks={simPresent:input.simPresent,wechatInstalled:input.wechatInstalled,douyinInstalled:input.douyinInstalled,alipayInstalled:input.alipayInstalled,emulatorSafe:!input.emulatorDetected,cloudDeviceSafe:!input.cloudDeviceDetected,scriptEnvironmentSafe:!input.scriptDetected,networkTrusted:!input.networkRiskDetected,ipTrusted:!input.ipRiskDetected,locationDistanceSafe:distanceMeters!==null&&distanceMeters<=input.location!.maxDistanceMeters};
  return {score:Object.values(checks).filter(Boolean).length*10,checks,distanceMeters};
}

/** 快照入库；低于 60 分时封号、撤销刷新令牌并创建严重风险事件。 */
export async function assessDeviceRisk(userId:bigint,input:DeviceRiskAssessmentInput,req:AuditRequest) {
  const result=calculateDeviceRiskScore(input); const autoBanned=result.score<60;
  return prisma.$transaction(async tx=>{
    const assessment=await tx.deviceRiskAssessment.create({data:{userId,deviceId:input.deviceId,score:result.score,autoBanned,simPresent:result.checks.simPresent,wechatInstalled:result.checks.wechatInstalled,douyinInstalled:result.checks.douyinInstalled,alipayInstalled:result.checks.alipayInstalled,emulatorDetected:input.emulatorDetected,cloudDeviceDetected:input.cloudDeviceDetected,scriptDetected:input.scriptDetected,networkTrusted:result.checks.networkTrusted,ipTrusted:result.checks.ipTrusted,locationDistanceSafe:result.checks.locationDistanceSafe,distanceMeters:result.distanceMeters,ip:req.ip,detail:{checks:result.checks,evidenceJson:JSON.stringify(input.evidence??{})}}});
    if(autoBanned){
      await tx.user.update({where:{id:userId},data:{riskStatus:'BANNED',status:'DISABLED',riskRemark:`设备环境评分 ${result.score} 分，低于 60 分自动封号`}});
      await tx.refreshToken.updateMany({where:{userId,revokedAt:null},data:{revokedAt:new Date()}});
      await tx.riskEvent.create({data:{userId,ruleCode:'DEVICE_ENV_SCORE_LOW',level:'CRITICAL',title:'设备环境评分过低，已自动封号',detail:{assessmentId:assessment.id,score:result.score,checks:result.checks,distanceMeters:result.distanceMeters,ip:req.ip}}});
    } else if(result.score<80) await tx.riskEvent.create({data:{userId,ruleCode:'DEVICE_ENV_SCORE_WARNING',level:'MEDIUM',title:'设备环境评分偏低',detail:{assessmentId:assessment.id,score:result.score,checks:result.checks}}});
    return {id:assessment.id,score:result.score,autoBanned,checks:result.checks,distanceMeters:result.distanceMeters};
  });
}

/** 后台分页查看设备环境评分历史及当前账号状态。 */
export async function listDeviceRiskAssessments(q:ListQuery){const [list,total]=await prisma.$transaction([prisma.deviceRiskAssessment.findMany({include:{user:{select:{id:true,phone:true,nickname:true,riskStatus:true,status:true}}},skip:(q.page-1)*q.pageSize,take:q.pageSize,orderBy:{createdAt:'desc'}}),prisma.deviceRiskAssessment.count()]);return{list,total,...q};}
