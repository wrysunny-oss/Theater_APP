<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { appApi, hasRemoteSession } from "./services/api";

/** 冷启动或重新回到前台时执行登录检查，阻止直接打开任意业务页面。 */
let checkingSession = false;
const ensureAuthenticated = async () => {
  if (hasRemoteSession()) {
    if (checkingSession) return;
    checkingSession = true;
    try { await appApi.me(); return; }
    catch { /* 请求层会清理失效令牌，下面统一回到登录页。 */ }
    finally { checkingSession = false; }
  }
  const route = getCurrentPages().at(-1)?.route || "";
  if (["pages/auth/auth", "pages/agreement/agreement"].includes(route)) return;
  uni.reLaunch({ url: "/pages/auth/auth" });
};
onLaunch(() => {
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
