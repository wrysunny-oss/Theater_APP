import { homeMovieSeeds } from "../mock/home";
import type { DramaPlayback, FavoriteItem, WatchHistoryItem } from "../types/library";

let historyItems: WatchHistoryItem[] = homeMovieSeeds.slice(0, 5).map((movie, index) => ({
  id: movie.sourceId,
  title: movie.title,
  image: movie.image,
  episode: [12, 45, 8, 36, 21][index],
  positionSeconds: [18, 42, 8, 65, 24][index],
  totalEpisodes: [80, 45, 96, 72, 68][index],
  watchedAt: index < 2 ? "今天" : index < 4 ? "昨天" : "2026-09-01",
}));

let favoriteItems: FavoriteItem[] = homeMovieSeeds.slice(1, 6).map((movie) => ({
  id: movie.sourceId,
  title: movie.title,
  image: movie.image,
  meta: movie.meta,
}));

// 当前为内存 Mock；接入后端后保留函数签名并替换函数体即可。
export const fetchWatchHistory = async () => [...historyItems];
export const removeWatchHistory = async (id: number) => { historyItems = historyItems.filter((item) => item.id !== id); return [...historyItems]; };
export const clearWatchHistory = async () => { historyItems = []; return []; };
export const fetchFavorites = async () => [...favoriteItems];
export const removeFavorite = async (id: number) => { favoriteItems = favoriteItems.filter((item) => item.id !== id); return [...favoriteItems]; };
export const clearFavorites = async () => { favoriteItems = []; return []; };

const demoVideos = [
  "https://media.w3.org/2010/05/sintel/trailer.mp4",
  "https://media.w3.org/2010/05/bunny/trailer.mp4",
];

/** 获取播放所需的最小剧集数据，不依赖尚未开发的详情页。 */
export const fetchDramaPlayback = async (id: number): Promise<DramaPlayback | null> => {
  const movie = homeMovieSeeds.find((item) => item.sourceId === id);
  if (!movie) return null;
  const total = 24;
  return {
    id,
    title: movie.title,
    image: movie.image,
    description: "精彩短剧持续更新中，沉浸式观看完整剧情。",
    episodes: Array.from({ length: total }, (_, index) => ({ number: index + 1, title: `第${index + 1}集`, videoUrl: demoVideos[index % demoVideos.length] })),
  };
};

export const isDramaFavorite = async (id: number) => favoriteItems.some((item) => item.id === id);
export const toggleDramaFavorite = async (drama: DramaPlayback) => {
  const existing = favoriteItems.some((item) => item.id === drama.id);
  favoriteItems = existing
    ? favoriteItems.filter((item) => item.id !== drama.id)
    : [{ id: drama.id, title: drama.title, image: drama.image, meta: `共${drama.episodes.length}集` }, ...favoriteItems];
  return !existing;
};

/** 更新最近一次观看位置；正式接口还应提交视频时间点。 */
export const recordWatchProgress = async (drama: DramaPlayback, episode: number, positionSeconds = 0) => {
  historyItems = historyItems.filter((item) => item.id !== drama.id);
  historyItems.unshift({ id: drama.id, title: drama.title, image: drama.image, episode, positionSeconds: Math.max(0, Math.floor(positionSeconds)), totalEpisodes: drama.episodes.length, watchedAt: "刚刚" });
};
