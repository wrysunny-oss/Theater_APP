/** 广告层统一状态，页面不感知穿山甲原生 SDK 的具体回调名称。 */
export type AdStatus = "idle" | "initializing" | "loading" | "ready" | "showing" | "completed" | "closed" | "error";

export interface AdError {
  code: string;
  message: string;
  nativeCode?: number;
}

export interface RewardedAdResult {
  placementId: string;
  completed: boolean;
  transactionId?: string;
}

export interface AdInitializeOptions {
  appId: string;
  debug: boolean;
  personalizedAds: boolean;
}

export interface RewardedAdLoadOptions {
  placementId: string;
  userId?: string;
  rewardName?: string;
  rewardAmount?: number;
  /** 服务端验奖透传数据，不在客户端存放任何签名密钥。 */
  extra?: string;
}

export interface AndroidAdBridge {
  initialize(options: AdInitializeOptions): Promise<void>;
  loadRewarded(options: RewardedAdLoadOptions): Promise<void>;
  showRewarded(placementId: string): Promise<RewardedAdResult>;
  setPersonalizedAdsEnabled(enabled: boolean): Promise<void>;
  dispose(): void;
}
