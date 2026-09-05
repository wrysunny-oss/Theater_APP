import { adConfig } from "../config/ad";
import type { AdInitializeOptions, AndroidAdBridge, RewardedAdLoadOptions, RewardedAdResult } from "../types/ad";

const notConfigured = () => Promise.reject({ code: "AD_NOT_CONFIGURED", message: "穿山甲 SDK 或广告位尚未配置" });

/**
 * 原生桥接默认占位实现，保证未配置 SDK 时项目仍可开发和构建。
 * 完成 app-android/index.uts 后，在此处替换为 UTS 插件导出的真实方法。
 */
const placeholderBridge: AndroidAdBridge = {
  initialize: notConfigured,
  loadRewarded: notConfigured,
  showRewarded: notConfigured,
  setPersonalizedAdsEnabled: notConfigured,
  dispose: () => undefined,
};

let bridge: AndroidAdBridge = placeholderBridge;
let initialized = false;
let initializationPromise: Promise<void> | null = null;

/** 原生实现完成后通过此入口注入，便于独立测试 Service 和 Hook。 */
export const registerAndroidAdBridge = (nativeBridge: AndroidAdBridge) => {
  bridge = nativeBridge;
  // 这里只注册实现，不主动初始化；调用时机必须晚于用户同意隐私协议。
};

export const initializeAds = async () => {
  if (initialized) return;
  if (!adConfig.enabled || !adConfig.appId) return notConfigured();
  // 多个页面同时请求广告时共用同一个初始化任务，保证 useMediation 和 TTAdSdk.init 只执行一次。
  if (!initializationPromise) {
    const options: AdInitializeOptions = { appId: adConfig.appId, debug: adConfig.debug, personalizedAds: adConfig.personalizedAds };
    initializationPromise = bridge.initialize(options).then(() => { initialized = true; });
  }
  await initializationPromise;
};

export const loadRewardedAd = async (options: RewardedAdLoadOptions) => {
  await initializeAds();
  if (!options.placementId) return notConfigured();
  await bridge.loadRewarded(options);
};

export const showRewardedAd = async (placementId: string): Promise<RewardedAdResult> => {
  if (!initialized) await initializeAds();
  return bridge.showRewarded(placementId);
};

export const setPersonalizedAdsEnabled = (enabled: boolean) => bridge.setPersonalizedAdsEnabled(enabled);
// 这里只销毁当前广告对象，不能重置 SDK 初始化状态；GroMore 默认只允许初始化一次。
export const disposeAds = () => { bridge.dispose(); };
