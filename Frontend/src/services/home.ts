import type { HomeMovie, MoviePage } from "../types/content";
import { apiRequest } from "./api";

interface MovieQuery { category: string; rank: string; page: number; pageSize?: number }

/** 模拟分页接口：保留异步边界，未来可无缝替换成 uni.request。 */
export const fetchHomeMovies = async ({ category, rank, page, pageSize = 12 }: MovieQuery): Promise<MoviePage> => {
  const result = await apiRequest<any>(`/content/dramas?page=${page}&pageSize=${pageSize}${category === "all" ? "" : `&category=${encodeURIComponent(category)}`}`, { auth: false });
  return { page, hasMore: result.hasMore, list: result.list.map((item: any): HomeMovie => ({
    id: Number(item.id), sourceId: Number(item.id), title: item.title,
    meta: `共 ${item._count?.episodes ?? 0} 集`, category: item.category,
    ranks: [rank], image: item.coverUrl, badge: item.tags?.[0], badgeType: "warning",
  })) };
};
