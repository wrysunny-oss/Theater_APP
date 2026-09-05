import { initializeAds } from "./ad";

const PRIVACY_CONSENT_KEY = "hly_privacy_consent_v1";

/** 判断用户是否已经通过登录页明确同意用户协议和隐私政策。 */
export const hasPrivacyConsent = () => uni.getStorageSync(PRIVACY_CONSENT_KEY) === true;

/**
 * 保存用户授权并立即初始化广告 SDK。
 * 必须由用户点击登录/注册按钮的主线程事件调用，不能在同意前提前调用 SDK。
 */
export const grantPrivacyConsentAndInitializeAds = () => {
  uni.setStorageSync(PRIVACY_CONSENT_KEY, true);
  return initializeAds();
};

/** 冷启动恢复：只有历史上已明确授权的用户才初始化并拉取 GroMore 配置。 */
export const initializeAdsAfterConsent = async () => {
  if (!hasPrivacyConsent()) return;
  await initializeAds();
};
