import { computed, onMounted, ref, watch, type Ref } from "vue";
import { fetchHomeMovies } from "../services/home";
import type { HomeMovie } from "../types/content";

/** 首页筛选、分页、下拉刷新和过期请求丢弃逻辑。 */
export function useHomeMovies(activeCategory: Ref<string>, activeRank: Ref<string>) {
  const movies = ref<HomeMovie[]>([]);
  const page = ref(1);
  const loading = ref(false);
  const refreshing = ref(false);
  const finished = ref(false);
  let requestVersion = 0;
  const listKey = computed(() => `${activeCategory.value}-${activeRank.value}`);

  const requestPage = async (reset = false) => {
    if (loading.value || (!reset && finished.value)) return;
    const version = ++requestVersion;
    loading.value = true;
    try {
      const targetPage = reset ? 1 : page.value;
      const result = await fetchHomeMovies({ category: activeCategory.value, rank: activeRank.value, page: targetPage });
      if (version !== requestVersion) return;
      movies.value = reset ? result.list : [...movies.value, ...result.list];
      page.value = targetPage + 1;
      finished.value = !result.hasMore;
    } finally {
      if (version === requestVersion) { loading.value = false; refreshing.value = false; }
    }
  };
  const refresh = () => { refreshing.value = true; finished.value = false; requestPage(true); };
  watch([activeCategory, activeRank], () => {
    requestVersion++; loading.value = false; finished.value = false; movies.value = []; page.value = 1; requestPage(true);
  });
  onMounted(() => requestPage(true));
  return { movies, loading, refreshing, finished, listKey, loadMore: () => requestPage(false), refresh };
}
