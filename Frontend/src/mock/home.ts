import type { HomeBanner, HomeCategory, HomeMovie, RankTab } from "../types/content";

export const homeCategories: HomeCategory[] = [
  { name: "全部", key: "all" }, { name: "都市", key: "city" },
  { name: "古装", key: "historical" }, { name: "玄幻", key: "fantasy" },
  { name: "末世", key: "endworld" }, { name: "爱情", key: "romance" },
];

export const homeRankTabs: RankTab[] = [
  { label: "热门榜", value: "hot" },
  { label: "新剧榜", value: "new" },
  { label: "推荐榜", value: "recommend" },
];

export const homeBanners: HomeBanner[] = [
  { id: 1, tag: "HOT", eyebrow: "古装 · 共80集", title: "错嫁豪门：总裁的秘密新娘", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=85" },
  { id: 2, tag: "NEW", eyebrow: "悬疑 · 共45集", title: "逆天重生：皇后娘娘杀疯了", image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1200&q=85" },
];

/** 基础素材池会由 Mock 服务组合为多页数据，避免页面层维护演示数据。 */
export const homeMovieSeeds: Omit<HomeMovie, "id">[] = [
  { sourceId: 1, title: "错嫁豪门：总裁的秘密新娘", meta: "看到第12集", category: "city", ranks: ["hot", "recommend"], badge: "HOT", badgeType: "error", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80" },
  { sourceId: 2, title: "逆天重生：皇后娘娘杀疯了", meta: "看到第45集", category: "historical", ranks: ["new", "hot"], badge: "NEW", badgeType: "primary", image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=500&q=80" },
  { sourceId: 3, title: "霸道医神：废材小姐逆袭记", meta: "共96集", category: "fantasy", ranks: ["recommend", "hot"], badge: "精选", badgeType: "warning", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80" },
  { sourceId: 4, title: "替嫁福妻：王爷他宠妻无度", meta: "共72集", category: "historical", ranks: ["hot", "new", "recommend"], badge: "完结", badgeType: "success", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80" },
  { sourceId: 5, title: "全球末日：我独自升级", meta: "更新至68集", category: "endworld", ranks: ["hot", "new"], badge: "HOT", badgeType: "error", image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=500&q=80" },
  { sourceId: 6, title: "长相思：与你岁岁年年", meta: "共60集", category: "romance", ranks: ["hot", "recommend", "new"], image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80" },
];
