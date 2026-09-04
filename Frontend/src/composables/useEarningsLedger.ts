import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { rewardRules } from "../config/reward";
import { getRewardState, type RewardCategory } from "../services/reward";
import { appApi, hasRemoteSession } from "../services/api";

export type CategoryFilter = "all" | RewardCategory;
export type RangeFilter = "today" | "7days" | "30days" | "all";
export const categoryTabs = [{ name: "全部", value: "all" }, { name: "签到", value: "signin" }, { name: "任务", value: "task" }, { name: "广告", value: "ad" }, { name: "分享", value: "share" }, { name: "提现", value: "withdraw" }] as const;
export const ranges: { label: string; value: RangeFilter }[] = [{ label: "今天", value: "today" }, { label: "近7天", value: "7days" }, { label: "近30天", value: "30days" }, { label: "全部", value: "all" }];

const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** 收益页筛选、汇总和增量展示逻辑。 */
export function useEarningsLedger() {
  const state = ref(getRewardState());
  const activeCategory = ref<CategoryFilter>("all");
  const activeRange = ref<RangeFilter>("today");
  const visibleCount = ref(15);
  const categoryIndex = computed(() => categoryTabs.findIndex((item) => item.value === activeCategory.value));
  const startDate = computed(() => {
    if (activeRange.value === "all") return "";
    const date = new Date();
    if (activeRange.value === "7days") date.setDate(date.getDate() - 6);
    if (activeRange.value === "30days") date.setDate(date.getDate() - 29);
    return localDate(date);
  });
  const filteredRecords = computed(() => state.value.ledger.filter((item) => (activeCategory.value === "all" || item.category === activeCategory.value) && (!startDate.value || item.date >= startDate.value)));
  const visibleRecords = computed(() => filteredRecords.value.slice(0, visibleCount.value));
  const filteredTotal = computed(() => filteredRecords.value.reduce((sum, item) => sum + item.amount, 0));
  const hasMore = computed(() => visibleCount.value < filteredRecords.value.length);
  const cashValue = computed(() => (state.value.balance / rewardRules.coinsPerYuan).toFixed(2));
  const selectCategory = (item: { value: CategoryFilter }) => { activeCategory.value = item.value; visibleCount.value = 15; };
  const selectRange = (value: RangeFilter) => { activeRange.value = value; visibleCount.value = 15; };
  const rangeStyle = (value: RangeFilter) => activeRange.value === value ? { backgroundColor: "#ffc400", borderColor: "#ffc400", color: "#171717" } : { backgroundColor: "#1b1c25", borderColor: "rgba(255,255,255,.06)", color: "#a6a8b2" };
  const categoryName = (category: RewardCategory) => ({ signin: "签到", task: "任务", ad: "广告", share: "分享", withdraw: "提现" })[category];
  const showMore = () => { if (hasMore.value) visibleCount.value += 15; };
  onShow(async () => {
    state.value = getRewardState();
    if (!hasRemoteSession()) return;
    try {
      const [profile, result] = await Promise.all([appApi.me(), appApi.rewardLedgers()]);
      state.value.balance = Number(profile.coinBalance);
      state.value.ledger = result.list.map((item: any) => ({ id: item.id, title: item.title, amount: Number(item.amount), category: item.type === "SIGNIN" ? "signin" : item.type === "AD" ? "ad" : item.type === "SHARE" ? "share" : item.type === "WITHDRAW" ? "withdraw" : "task", createdAt: new Date(item.createdAt).toLocaleString(), date: item.createdAt.slice(0, 10) }));
    } catch (error) { uni.showToast({ title: error instanceof Error ? error.message : "收益加载失败", icon: "none" }); }
  });
  return { state, activeRange, categoryIndex, filteredRecords, visibleRecords, filteredTotal, hasMore, cashValue, selectCategory, selectRange, rangeStyle, categoryName, showMore };
}
