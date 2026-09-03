/**
 * 用户端本地奖励仓库。
 * 所有任务和收益页面只能通过这里读写，避免金币余额、任务状态和流水相互脱节。
 */
export type DailyProgressKey = "adCount" | "watchMinutes" | "periodCount" | "shareCount";
export type RewardCategory = "signin" | "task" | "ad" | "share";

export interface RewardLedgerItem {
  id: string;
  title: string;
  amount: number;
  category: RewardCategory;
  createdAt: string;
  date: string;
}

export interface RewardState {
  balance: number;
  streakDays: number;
  lastSignDate: string;
  daily: {
    date: string;
    adCount: number;
    watchMinutes: number;
    periodCount: number;
    shareCount: number;
    claimed: string[];
  };
  ledger: RewardLedgerItem[];
}

const STORAGE_KEY = "hly_reward_state_v1";
const dateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const createDaily = () => ({ date: dateKey(), adCount: 0, watchMinutes: 0, periodCount: 0, shareCount: 0, claimed: [] as string[] });
const initialState = (): RewardState => ({ balance: 0, streakDays: 0, lastSignDate: "", daily: createDaily(), ledger: [] });

export const getRewardState = (): RewardState => {
  const saved = uni.getStorageSync(STORAGE_KEY) as RewardState | "";
  const state = saved && typeof saved === "object" ? saved : initialState();
  if (state.daily.date !== dateKey()) state.daily = createDaily();
  // 为旧版本本地流水补充分类，升级后无需清空用户已有金币数据。
  state.ledger = (state.ledger || []).map((item) => ({
    ...item,
    category: item.category || inferCategory(item.title),
  }));
  uni.setStorageSync(STORAGE_KEY, state);
  return state;
};

const save = (state: RewardState) => uni.setStorageSync(STORAGE_KEY, state);
const inferCategory = (title: string): RewardCategory => title.includes("签到") ? "signin" : title.includes("广告") ? "ad" : title.includes("分享") ? "share" : "task";
const addLedger = (state: RewardState, title: string, amount: number, category: RewardCategory) => {
  const now = new Date();
  state.balance += amount;
  state.ledger.unshift({ id: `${now.getTime()}-${title}`, title, amount, category, createdAt: now.toLocaleString(), date: dateKey(now) });
  state.ledger = state.ledger.slice(0, 100);
};

export const signIn = () => {
  const state = getRewardState();
  if (state.lastSignDate === dateKey()) return { state, amount: 0 };
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  state.streakDays = state.lastSignDate === dateKey(yesterday) ? state.streakDays + 1 : 1;
  state.lastSignDate = dateKey();
  state.daily.claimed.push("signin");
  const amount = Math.min(10 + (state.streakDays - 1) * 5, 40);
  addLedger(state, "每日签到", amount, "signin");
  save(state);
  return { state, amount };
};

export const advanceDailyProgress = (key: DailyProgressKey, amount: number, maximum: number) => {
  const state = getRewardState();
  state.daily[key] = Math.min(state.daily[key] + amount, maximum);
  save(state);
  return state;
};

export const claimDailyReward = (id: string, title: string, amount: number) => {
  const state = getRewardState();
  if (state.daily.claimed.includes(id)) return { state, claimed: false };
  state.daily.claimed.push(id);
  const category: RewardCategory = id === "ad" ? "ad" : id === "share" ? "share" : "task";
  addLedger(state, title, amount, category);
  save(state);
  return { state, claimed: true };
};

/** 设置页使用的显式重置入口，必须在用户二次确认后调用。 */
export const resetRewardState = () => {
  const state = initialState();
  save(state);
  return state;
};
