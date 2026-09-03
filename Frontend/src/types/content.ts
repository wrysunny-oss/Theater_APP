/** 首页内容域模型，后续接入后端时可直接作为接口响应类型。 */
export interface HomeBanner {
  id: number;
  tag: string;
  eyebrow: string;
  title: string;
  image: string;
}

export interface HomeCategory {
  name: string;
  key: string;
}

export interface RankTab {
  label: string;
  value: string;
}

export type BadgeType = "primary" | "success" | "error" | "warning" | "info";

export interface HomeMovie {
  id: number;
  sourceId: number;
  title: string;
  meta: string;
  category: string;
  ranks: string[];
  image: string;
  badge?: string;
  badgeType?: BadgeType;
}

export interface MoviePage {
  list: HomeMovie[];
  page: number;
  hasMore: boolean;
}
