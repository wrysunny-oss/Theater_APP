import { computed, nextTick, ref } from "vue";
import { onLoad, onUnload } from "@dcloudio/uni-app";
import { fetchDramaPlayback, isDramaFavorite, recordWatchProgress, toggleDramaFavorite } from "../services/library";
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
  const currentEpisode = computed(() => drama.value!.episodes[currentIndex.value]);
  const videoId = (number: number) => `episode-video-${number}`;
  const videoContext = () => uni.createVideoContext(videoId(currentEpisode.value.number));
  const resetPlayback = () => { watchedSeconds.value = 0; durationSeconds.value = 0; playing.value = false; };

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
  const handleTimeUpdate = (event: Event) => { const detail = eventDetail(event); watchedSeconds.value = detail?.currentTime || 0; durationSeconds.value = detail?.duration || durationSeconds.value; };
  const handleLoadedMetadata = (event: Event) => { durationSeconds.value = eventDetail(event)?.duration || 0; };
  const handleVideoError = () => uni.showToast({ title: "视频加载失败，请检查网络", icon: "none" });

  onLoad((query) => { dramaId.value = Number(query?.id) || 1; initialEpisode.value = Number(query?.episode) || 1; load(); });
  onUnload(() => { if (drama.value) recordWatchProgress(drama.value, currentEpisode.value.number); });

  return { drama, currentIndex, currentEpisode, loading, favorite, episodePopup, playing, watchedSeconds, durationSeconds, videoId, load, selectEpisode, playNext, handleEpisodeSwipe, togglePlayback, toggleFavorite, seek, handleTimeUpdate, handleLoadedMetadata, handleVideoError };
}
