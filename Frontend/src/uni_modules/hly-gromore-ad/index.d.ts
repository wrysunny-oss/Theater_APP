export interface GroMoreInitOptions {
  appId: string;
  appName: string;
  debug: boolean;
  limitPersonalAds: boolean;
  programmaticRecommend: boolean;
}
export interface GroMoreRewardOptions { placementId: string; userId: string; rewardName: string; rewardAmount: number; extra: string }
export interface GroMoreRewardResult { placementId: string; completed: boolean; transactionId: string }
export type GroMoreFailure = (code: string, message: string, nativeCode: number) => void;
export function initializeGroMore(options: GroMoreInitOptions, success: () => void, failure: GroMoreFailure): void;
export function loadGroMoreReward(options: GroMoreRewardOptions, success: () => void, failure: GroMoreFailure): void;
export function showGroMoreReward(placementId: string, success: (result: GroMoreRewardResult) => void, failure: GroMoreFailure): void;
export function disposeGroMoreReward(): void;
