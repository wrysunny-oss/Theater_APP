<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { appApi, hasRemoteSession } from "./services/api";
import { ensureRiskAssessment } from "./services/risk-assessment";
import { registerAndroidRiskProvider } from "./services/android-risk-provider";
import { registerAndroidAdProvider } from "./services/android-ad-provider";
import { initializeAdsAfterConsent } from "./services/privacy-consent";

// 必须在首次登录态校验前注册，否则强制风控模式会误报采集器未就绪。
registerAndroidRiskProvider();
registerAndroidAdProvider();

/** 冷启动或重新回到前台时执行登录检查，阻止直接打开任意业务页面。 */
let checkingSession = false;
const ensureAuthenticated = async () => {
  if (hasRemoteSession()) {
    if (checkingSession) return;
    checkingSession = true;
    try { await appApi.me(); await ensureRiskAssessment("login"); return; }
    catch { /* 请求层会清理失效令牌，下面统一回到登录页。 */ }
    finally { checkingSession = false; }
  }
  const route = getCurrentPages().at(-1)?.route || "";
  if (["pages/auth/auth", "pages/agreement/agreement"].includes(route)) return;
  uni.reLaunch({ url: "/pages/auth/auth" });
};
onLaunch(() => {
  // onLaunch 在主线程触发；未授权用户不会执行任何 GroMore 初始化代码。
  void initializeAdsAfterConsent().catch((error) => console.error("GroMore 初始化失败", error));
  setTimeout(ensureAuthenticated, 0);
});
onShow(() => {
  ensureAuthenticated();
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style lang="scss">
/* 注意要写在第一行，同时给style标签加入lang="scss"属性 */
@import "uview-plus/index.scss";
@import "./styles/reset.scss";
@import "./styles/theme.scss";
</style>
