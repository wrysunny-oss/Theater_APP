import { computed, onUnmounted, ref } from "vue";
import { disposeAds, loadRewardedAd, showRewardedAd } from "../services/ad";
import type { AdError, AdStatus, RewardedAdLoadOptions, RewardedAdResult } from "../types/ad";

/** 激励视频加载与展示状态机；奖励到账仍需后端确认。 */
export function useRewardedAd(options: RewardedAdLoadOptions) {
  const status = ref<AdStatus>("idle");
  const error = ref<AdError | null>(null);
  const ready = computed(() => status.value === "ready");
  const busy = computed(() => ["initializing", "loading", "showing"].includes(status.value));

  const normalizeError = (value: unknown): AdError => {
    const source = value as Partial<AdError> | undefined;
    return { code: source?.code || "AD_UNKNOWN_ERROR", message: source?.message || "广告加载失败", nativeCode: source?.nativeCode };
  };
  const load = async () => {
    if (busy.value) return false;
    status.value = "loading"; error.value = null;
    try { await loadRewardedAd(options); status.value = "ready"; return true; }
    catch (reason) { error.value = normalizeError(reason); status.value = "error"; return false; }
  };
  const show = async (): Promise<RewardedAdResult | null> => {
    if (!ready.value && !(await load())) return null;
    status.value = "showing";
    try {
      const result = await showRewardedAd(options.placementId);
      status.value = result.completed ? "completed" : "closed";
      return result;
    } catch (reason) { error.value = normalizeError(reason); status.value = "error"; return null; }
  };
  const retry = () => load();
  onUnmounted(disposeAds);
  return { status, error, ready, busy, load, show, retry };
}
