import { computed, nextTick, onUnmounted, ref } from "vue";
import { onHide, onLoad, onShow, onUnload } from "@dcloudio/uni-app";
import { fetchDramaPlayback, isDramaFavorite, recordWatchProgress, toggleDramaFavorite } from "../services/library";
import { advanceDailyProgress } from "../services/reward";
import type { DramaPlayback } from "../types/library";

/** 沉浸式播放器状态机：负责加载、切集、播放、进度、收藏与历史上报。 */
export function useDramaPlayer() {
  const dramaId = ref(0);
  const initialEpisode = ref(1);
  const drama = ref<DramaPlayback | null>(null);
  const currentIndex = ref(0);
  const loading = ref(true);
  const favorite = ref(false);
  const episodePopup = ref(false);
  const playing = ref(false);
  const watchedSeconds = ref(0);
  const durationSeconds = ref(0);
  const networkOnline = ref(true);
  const videoError = ref(false);
  const reloadKey = ref(0);
  const resumeSeconds = ref(0);
  let lastPlaybackSecond = 0;
  let accumulatedWatchSeconds = 0;
  let lastSavedBucket = -1;
  const currentEpisode = computed(() => drama.value!.episodes[currentIndex.value]);
  const videoId = (number: number) => `episode-video-${number}`;
  const videoContext = () => uni.createVideoContext(videoId(currentEpisode.value.number));
  const resetPlayback = () => { watchedSeconds.value = 0; durationSeconds.value = 0; resumeSeconds.value = 0; playing.value = false; videoError.value = false; lastPlaybackSecond = 0; lastSavedBucket = -1; };
  const saveProgress = () => { if (drama.value) recordWatchProgress(drama.value, currentEpisode.value.number, watchedSeconds.value); };

  const load = async () => {
    loading.value = true;
    try {
      drama.value = await fetchDramaPlayback(dramaId.value);
      if (drama.value) {
        currentIndex.value = Math.min(Math.max(initialEpisode.value - 1, 0), drama.value.episodes.length - 1);
        favorite.value = await isDramaFavorite(drama.value.id);
      }
    } finally { loading.value = false; }
  };
  const selectEpisode = async (number: number) => {
    videoContext().pause(); currentIndex.value = number - 1; episodePopup.value = false; resetPlayback();
    await nextTick(); videoContext().play();
  };
  const playNext = () => {
    if (!drama.value || currentIndex.value >= drama.value.episodes.length - 1) return uni.showToast({ title: "已经是最后一集", icon: "none" });
    selectEpisode(currentIndex.value + 2);
  };
  const handleEpisodeSwipe = async (event: Event) => {
    const nextIndex = Number((event as unknown as { detail?: { current?: number } }).detail?.current);
    if (!Number.isFinite(nextIndex) || nextIndex === currentIndex.value) return;
    videoContext().pause(); currentIndex.value = nextIndex; resetPlayback();
    await nextTick(); videoContext().play();
  };
  const togglePlayback = () => { if (playing.value) videoContext().pause(); else videoContext().play(); };
  const toggleFavorite = async () => {
    if (!drama.value) return;
    favorite.value = await toggleDramaFavorite(drama.value);
    uni.showToast({ title: favorite.value ? "收藏成功" : "已取消收藏", icon: "none" });
  };
  const seek = (seconds: number) => { videoContext().seek(seconds); watchedSeconds.value = seconds; };
  const eventDetail = (event: Event) => (event as unknown as { detail?: { currentTime?: number; duration?: number } }).detail;
  const reportWatchTask = (currentTime: number) => {
    const delta = currentTime - lastPlaybackSecond;
    if (playing.value && delta > 0 && delta <= 3) accumulatedWatchSeconds += delta;
    lastPlaybackSecond = currentTime;
    if (accumulatedWatchSeconds < 60) return;
    const minutes = Math.floor(accumulatedWatchSeconds / 60);
    accumulatedWatchSeconds -= minutes * 60;
    advanceDailyProgress("watchMinutes", minutes, 10);
    const hour = new Date().getHours();
    if ((hour >= 12 && hour < 14) || (hour >= 18 && hour < 22)) advanceDailyProgress("periodCount", 1, 1);
  };
  const handleTimeUpdate = (event: Event) => {
    const detail = eventDetail(event);
    watchedSeconds.value = detail?.currentTime || 0;
    durationSeconds.value = detail?.duration || durationSeconds.value;
    reportWatchTask(watchedSeconds.value);
    const bucket = Math.floor(watchedSeconds.value / 15);
    if (bucket !== lastSavedBucket) { lastSavedBucket = bucket; saveProgress(); }
  };
  const handleLoadedMetadata = (event: Event) => {
    durationSeconds.value = eventDetail(event)?.duration || 0;
    if (resumeSeconds.value > 0) { const target = Math.min(resumeSeconds.value, Math.max(0, durationSeconds.value - 1)); resumeSeconds.value = 0; seek(target); }
  };
  const handleVideoError = () => { videoError.value = true; playing.value = false; };
  const retryVideo = async () => { if (!networkOnline.value) return uni.showToast({ title: "当前网络不可用", icon: "none" }); videoError.value = false; reloadKey.value++; await nextTick(); videoContext().play(); };
  const handleNetworkChange = ({ isConnected }: { isConnected: boolean }) => { networkOnline.value = isConnected; if (!isConnected) { videoContext().pause(); saveProgress(); } };

  onLoad((query) => {
    dramaId.value = Number(query?.id) || 1;
    initialEpisode.value = Number(query?.episode) || 1;
    resumeSeconds.value = Math.max(0, Number(query?.time) || 0);
    uni.getNetworkType({ success: ({ networkType }) => { networkOnline.value = networkType !== "none"; } });
    uni.onNetworkStatusChange(handleNetworkChange);
    load();
  });
  onHide(() => { if (drama.value) { videoContext().pause(); saveProgress(); } });
  onShow(() => { if (drama.value && !networkOnline.value) uni.getNetworkType({ success: ({ networkType }) => { networkOnline.value = networkType !== "none"; } }); });
  onUnload(saveProgress);
  onUnmounted(() => uni.offNetworkStatusChange(handleNetworkChange));

  return { drama, currentIndex, currentEpisode, loading, favorite, episodePopup, playing, watchedSeconds, durationSeconds, networkOnline, videoError, reloadKey, videoId, load, selectEpisode, playNext, handleEpisodeSwipe, togglePlayback, toggleFavorite, seek, retryVideo, handleTimeUpdate, handleLoadedMetadata, handleVideoError };
}
