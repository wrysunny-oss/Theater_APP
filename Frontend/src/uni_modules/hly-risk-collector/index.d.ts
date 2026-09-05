/** TypeScript/Vue 页面侧使用的声明，原生实现位于 utssdk/app-android。 */
export type RiskCheckStatus = 'PASS' | 'RISK' | 'UNKNOWN';
export function collectRiskSignals(options:{nonce:string}):Record<string,unknown>;
