import { homeMovieSeeds } from "../mock/home";
import type { HomeMovie, MoviePage } from "../types/content";

interface MovieQuery { category: string; rank: string; page: number; pageSize?: number }
const MOCK_TOTAL = 54;

/** 模拟分页接口：保留异步边界，未来可无缝替换成 uni.request。 */
export const fetchHomeMovies = async ({ category, rank, page, pageSize = 12 }: MovieQuery): Promise<MoviePage> => {
  await new Promise((resolve) => setTimeout(resolve, 320));
  const matched = homeMovieSeeds.filter((movie) =>
    (category === "all" || movie.category === category) && movie.ranks.includes(rank),
  );
  if (!matched.length) return { list: [], page, hasMore: false };

  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, MOCK_TOTAL);
  const list: HomeMovie[] = Array.from({ length: Math.max(0, end - start) }, (_, offset) => {
    const absoluteIndex = start + offset;
    const source = matched[absoluteIndex % matched.length];
    return { ...source, id: source.sourceId * 100000 + absoluteIndex };
  });
  return { list, page, hasMore: end < MOCK_TOTAL };
};
