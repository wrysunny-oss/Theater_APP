import { createSSRApp } from "vue";
import uviewPlus from "uview-plus";
import App from "./App.vue";
import { hasRemoteSession } from "./services/api";
import "uno.css";

const publicPages = ["/pages/auth/auth", "/pages/agreement/agreement"];

/** 拦截所有页面跳转，未登录用户只能访问认证页和注册所需协议页。 */
function installAuthNavigationGuard() {
  const guard = { invoke: (options: { url?: string }) => {
    const path = `/${(options.url || "").split("?")[0].replace(/^\//, "")}`;
    if (hasRemoteSession() || publicPages.includes(path)) return true;
    uni.reLaunch({ url: "/pages/auth/auth" });
    return false;
  } };
  (["navigateTo", "redirectTo", "reLaunch", "switchTab"] as const).forEach((method) => uni.addInterceptor(method, guard));
}

export function createApp() {
  const app = createSSRApp(App);
  app.use(uviewPlus);
  installAuthNavigationGuard();
  return {
    app,
  };
}
