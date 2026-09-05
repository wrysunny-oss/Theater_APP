import { appApi, deviceId } from './api';

export type RiskContext='login'|'reward'|'withdrawal';
export type RiskSignals=Parameters<typeof appApi.submitDeviceRiskAssessment>[0];
export type RiskSignalProvider=(challenge:{context:RiskContext;nonce:string})=>Promise<Omit<RiskSignals,'challengeId'|'deviceId'>>;

let provider:RiskSignalProvider|undefined;
/** 原生安全 SDK 初始化后注册采集器；H5 不伪造 SIM、应用安装或模拟器结果。 */
export function registerRiskSignalProvider(value:RiskSignalProvider){provider=value;}

/** 登录、广告和提现共用的检测时效入口；强制模式下缺少原生采集器会阻断高风险操作。 */
export async function ensureRiskAssessment(context:RiskContext){
  const status=await appApi.riskAssessmentStatus(context);
  if(status.fresh)return {fresh:true,assessed:false};
  if(provider){const challenge=await appApi.createRiskChallenge(context);await appApi.submitDeviceRiskAssessment({challengeId:challenge.id,deviceId:deviceId(),...await provider({context,nonce:challenge.nonce})});return {fresh:true,assessed:true};}
  if(status.required)throw new Error('设备安全检测组件尚未就绪，请重新打开 APP 后重试');
  return {fresh:false,assessed:false};
}
