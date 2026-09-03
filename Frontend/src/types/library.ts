/** 用户内容库与播放器领域模型。页面和服务共同依赖此文件，避免类型反向依赖服务实现。 */
export interface WatchHistoryItem {
  id: number;
  title: string;
  image: string;
  episode: number;
  positionSeconds: number;
  totalEpisodes: number;
  watchedAt: string;
}

export interface FavoriteItem {
  id: number;
  title: string;
  image: string;
  meta: string;
}

export interface DramaEpisode {
  number: number;
  title: string;
  videoUrl: string;
}

export interface DramaPlayback {
  id: number;
  title: string;
  image: string;
  description: string;
  episodes: DramaEpisode[];
}
