<template>
  <scroll-view scroll-y class="app-page-shell h-screen">
    <view class="px-28rpx pb-150rpx pt-36rpx">
      <view class="flex items-end justify-between"><view><text class="block text-40rpx font-800">福利中心</text><text class="mt-10rpx block text-23rpx text-[#a6a8b2]">做任务，天天领金币</text></view><view class="rounded-full bg-[#2f2605] px-18rpx py-10rpx"><text class="text-24rpx font-700 text-[#ffc400]">{{ remoteBalance }} 金币</text></view></view>

      <SignInCard :streak-days="streakDays" :signed="signed" :reward="signReward" :days="signDays" @sign="handleSign" />

      <view class="mb-18rpx mt-34rpx flex items-center justify-between"><text class="text-30rpx font-700">每日任务</text><text class="text-22rpx text-[#a6a8b2]">每日00:00重置</text></view>
      <TaskCard v-for="task in dailyTasks" :key="task.id" :task="task" :claimed="isClaimed(task.id)" @action="handleTask(task)" />

      <view class="mb-18rpx mt-34rpx"><text class="text-30rpx font-700">成就任务</text></view>
      <TaskCard :task="shareTask" :claimed="isClaimed(shareTask.id)" @action="handleTask(shareTask)" />
    </view>
    <BottomNav current="gift" />
  </scroll-view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import BottomNav from "../../components/home/BottomNav.vue";
import TaskCard from "../../components/tasks/TaskCard.vue";
import SignInCard from "../../components/tasks/SignInCard.vue";
import { advanceDailyProgress, claimDailyReward, getRewardState, type DailyProgressKey } from "../../services/reward";
import { appApi, hasRemoteSession } from "../../services/api";
import { ensureRiskAssessment } from "../../services/risk-assessment";
import { useRewardedAd } from "../../composables/useRewardedAd";
import { adConfig } from "../../config/ad";
import { getLocalUser } from "../../services/user";

interface TaskView { id: string; title: string; desc: string; icon: string; reward: number; progress: number; target: number; progressKey?: DailyProgressKey; step?: number }
const state = ref(getRewardState());
const remoteCenter = ref<any>(); const remoteBalance = ref("0");
// 该对象会在点击广告前写入当前后端用户 ID；GroMore 将它透传给服务端验奖回调。
const rewardedOptions = {
  placementId: adConfig.placements.rewardedTask.id,
  userId: "",
  rewardName: adConfig.placements.rewardedTask.rewardName,
  rewardAmount: adConfig.placements.rewardedTask.rewardAmount,
  extra: "rewarded-task",
};
const rewardedAd = useRewardedAd(rewardedOptions);
const reload = async () => {
  state.value = getRewardState();
  if (!hasRemoteSession()) return;
  try { const [center, me] = await Promise.all([appApi.rewardCenter(), appApi.me()]); remoteCenter.value = center; remoteBalance.value = me.coinBalance; }
  catch (error) { uni.showToast({ title: error instanceof Error ? error.message : "加载失败", icon: "none" }); }
};
onShow(reload);
const signed = computed(() => remoteCenter.value?.checkedInToday ?? state.value.daily.claimed.includes("signin"));
// 登录后以服务端签到记录为准；本地值仅用于尚未建立远程会话的兼容场景。
const streakDays = computed(() => Number(remoteCenter.value?.streak ?? state.value.streakDays));
const signReward = computed(() => Number(remoteCenter.value?.signInRules?.[(remoteCenter.value?.streak ?? 0) % 7]?.amount ?? 0));
const signDays = computed(() => (remoteCenter.value?.signInRules ?? []).map((rule: any, index: number) => ({ label: `第${index + 1}天`, reward: Number(rule.amount), active: index < (remoteCenter.value?.streak ?? 0) })));
const dailyTasks = computed<TaskView[]>(() => [
  { id: "watch", title: "观看短剧", desc: "累计观看10分钟", icon: "play-circle-fill", reward: 20, progress: state.value.daily.watchMinutes, target: 10, progressKey: "watchMinutes", step: 2 },
  { id: "ad", title: "观看激励广告", desc: `每日最多完成${Number(remoteCenter.value?.rewardedAdDailyLimit ?? adConfig.placements.rewardedTask.dailyLimit)}次`, icon: "volume-fill", reward: 30, progress: Number(remoteCenter.value?.rewardedAdCountToday ?? 0), target: Number(remoteCenter.value?.rewardedAdDailyLimit ?? adConfig.placements.rewardedTask.dailyLimit) },
  { id: "period", title: "黄金时段观剧", desc: "12:00-14:00或18:00-22:00", icon: "clock-fill", reward: 15, progress: state.value.daily.periodCount, target: 1, progressKey: "periodCount", step: 1 },
]);
const shareTask = computed<TaskView>(() => ({ id: "share", title: "分享幻乐剧场", desc: "分享应用给好友", icon: "share-fill", reward: 50, progress: state.value.daily.shareCount, target: 1, progressKey: "shareCount", step: 1 }));
const isClaimed = (id: string) => state.value.daily.claimed.includes(id);

const handleSign = async () => {
  if (!hasRemoteSession()) return void uni.navigateTo({ url: "/pages/auth/auth" });
  try { const result = await appApi.checkIn(); uni.showToast({ title: `获得${result.reward}金币`, icon: "none" }); await reload(); }
  catch (error) { uni.showToast({ title: error instanceof Error ? error.message : "签到失败", icon: "none" }); }
};
const handleTask = async (task: TaskView) => {
  if (isClaimed(task.id)) return;
  if (task.id === "ad" && task.progress >= task.target) {
    return void uni.showToast({ title: task.target === 0 ? "激励广告暂未开放" : "今日广告次数已达上限", icon: "none" });
  }
  if (task.progress >= task.target) {
    const result = claimDailyReward(task.id, task.title, task.reward);
    state.value = result.state;
    if (result.claimed) uni.showToast({ title: `奖励到账 +${task.reward}`, icon: "none" });
    return;
  }
  // 首页即剧场。观看类任务回到首页，真实进度将在播放器接入后自动上报。
  if (task.id === "watch" || task.id === "period") {
    uni.redirectTo({ url: "/pages/index/index" });
    return;
  }
  if (task.id === "ad") {
    try {
      await ensureRiskAssessment("reward");
      rewardedOptions.userId = getLocalUser().id;
      if (!rewardedOptions.userId) throw new Error("登录信息无效，请重新登录");
      uni.showLoading({ title: "广告加载中", mask: true });
      const result = await rewardedAd.show();
      uni.hideLoading();
      if (!result) throw new Error(rewardedAd.error.value?.message || "广告加载失败");
      if (!result.completed) return void uni.showToast({ title: "完整观看广告后才可获得奖励", icon: "none" });
      // 广告次数和金币均由 GroMore 服务端回调确认，客户端不再自行递增。
      await reload();
      uni.showToast({ title: "广告奖励已核验", icon: "none" });
      return;
    } catch (error) {
      uni.hideLoading();
      return void uni.showToast({ title: error instanceof Error ? error.message : "广告播放失败", icon: "none" });
    }
  }
  if (task.progressKey) state.value = advanceDailyProgress(task.progressKey, task.step || 1, task.target);
};

</script>
