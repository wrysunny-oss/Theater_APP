import { registerRiskSignalProvider } from './risk-assessment';
// #ifdef APP-PLUS
import { collectRiskSignals } from '@/uni_modules/hly-risk-collector';
// #endif

/** 注册 Android 原生采集器；条件编译确保 H5 开发环境不会加载 Android 类。 */
export function registerAndroidRiskProvider() {
  // #ifdef APP-PLUS
  registerRiskSignalProvider(async ({nonce}) => collectRiskSignals({nonce}) as any);
  // #endif
}
