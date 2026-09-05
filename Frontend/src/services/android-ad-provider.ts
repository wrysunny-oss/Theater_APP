import { registerAndroidAdBridge } from "./ad";
import type { AdError } from "../types/ad";
// #ifdef APP-PLUS
import {
  disposeGroMoreReward,
  initializeGroMore,
  loadGroMoreReward,
  showGroMoreReward,
} from "@/uni_modules/hly-gromore-ad";
// #endif

/** 将 UTS 的回调式 API 统一包装为业务层使用的 Promise 错误模型。 */
const toError = (code: string, message: string, nativeCode: number): AdError => ({ code, message, nativeCode });

/**
 * 注册 Android GroMore 桥接。
 * 条件编译保证 H5 调试不会解析 Android 原生类，真实 SDK 则在首次播放广告时延迟初始化。
 */
export function registerAndroidAdProvider() {
  // #ifdef APP-PLUS
  registerAndroidAdBridge({
    initialize: (options) => new Promise((resolve, reject) => {
      initializeGroMore(
        {
          appId: options.appId,
          // 使用穿山甲后台生成代码中的应用名称；展示品牌名可在平台改名后再同步。
          appName: "富商笔记",
          debug: options.debug,
          limitPersonalAds: !options.personalizedAds,
          programmaticRecommend: true,
        },
        resolve,
        (code, message, nativeCode) => reject(toError(code, message, nativeCode)),
      );
    }),
    loadRewarded: (options) => new Promise((resolve, reject) => {
      loadGroMoreReward(
        {
          placementId: options.placementId,
          userId: options.userId || "",
          rewardName: options.rewardName || "金币",
          rewardAmount: options.rewardAmount || 0,
          extra: options.extra || "",
        },
        resolve,
        (code, message, nativeCode) => reject(toError(code, message, nativeCode)),
      );
    }),
    showRewarded: (placementId) => new Promise((resolve, reject) => {
      showGroMoreReward(
        placementId,
        (result) => resolve(result),
        (code, message, nativeCode) => reject(toError(code, message, nativeCode)),
      );
    }),
    // GroMore 个性化推荐权限需在初始化隐私控制器中设置；当前版本不允许运行中切换。
    setPersonalizedAdsEnabled: async () => undefined,
    dispose: disposeGroMoreReward,
  });
  // #endif
}
