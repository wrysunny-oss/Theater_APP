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

/** 原生实现完成后通过此入口注入，便于独立测试 Service 和 Hook。 */
export const registerAndroidAdBridge = (nativeBridge: AndroidAdBridge) => { bridge = nativeBridge; initialized = false; };

export const initializeAds = async () => {
  if (initialized) return;
  if (!adConfig.enabled || !adConfig.appId) return notConfigured();
  const options: AdInitializeOptions = { appId: adConfig.appId, debug: adConfig.debug, personalizedAds: adConfig.personalizedAds };
  await bridge.initialize(options);
  initialized = true;
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
export const disposeAds = () => { bridge.dispose(); initialized = false; };
