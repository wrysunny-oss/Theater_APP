<template>
  <scroll-view scroll-y class="h-screen bg-[#090a0f] text-white">
    <view class="px-28rpx pb-150rpx pt-36rpx">
      <view class="flex items-end justify-between"><view><text class="block text-40rpx font-800">福利中心</text><text class="mt-10rpx block text-23rpx text-[#a6a8b2]">做任务，天天领金币</text></view><view class="rounded-full bg-[#2f2605] px-18rpx py-10rpx"><text class="text-24rpx font-700 text-[#ffc400]">{{ state.balance }} 金币</text></view></view>

      <SignInCard :streak-days="state.streakDays" :signed="signed" :reward="signReward" :days="signDays" @sign="handleSign" />

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
import { advanceDailyProgress, claimDailyReward, getRewardState, signIn, type DailyProgressKey } from "../../services/reward";

interface TaskView { id: string; title: string; desc: string; icon: string; reward: number; progress: number; target: number; progressKey?: DailyProgressKey; step?: number }
const state = ref(getRewardState());
const reload = () => { state.value = getRewardState(); };
onShow(reload);
const signed = computed(() => state.value.daily.claimed.includes("signin"));
const signReward = computed(() => Math.min(10 + state.value.streakDays * 5, 40));
const signDays = computed(() => Array.from({ length: 7 }, (_, index) => ({ label: `第${index + 1}天`, reward: Math.min(10 + index * 5, 40), active: index < state.value.streakDays })));
const dailyTasks = computed<TaskView[]>(() => [
  { id: "watch", title: "观看短剧", desc: "累计观看10分钟", icon: "play-circle-fill", reward: 20, progress: state.value.daily.watchMinutes, target: 10, progressKey: "watchMinutes", step: 2 },
  { id: "ad", title: "观看激励广告", desc: "每日最多完成5次", icon: "volume-fill", reward: 30, progress: state.value.daily.adCount, target: 5, progressKey: "adCount", step: 1 },
  { id: "period", title: "黄金时段观剧", desc: "12:00-14:00或18:00-22:00", icon: "clock-fill", reward: 15, progress: state.value.daily.periodCount, target: 1, progressKey: "periodCount", step: 1 },
]);
const shareTask = computed<TaskView>(() => ({ id: "share", title: "分享幻乐剧场", desc: "分享应用给好友", icon: "share-fill", reward: 50, progress: state.value.daily.shareCount, target: 1, progressKey: "shareCount", step: 1 }));
const isClaimed = (id: string) => state.value.daily.claimed.includes(id);

const handleSign = () => { const result = signIn(); state.value = result.state; if (result.amount) uni.showToast({ title: `获得${result.amount}金币`, icon: "none" }); };
const handleTask = (task: TaskView) => {
  if (isClaimed(task.id)) return;
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
  if (task.progressKey) state.value = advanceDailyProgress(task.progressKey, task.step || 1, task.target);
};

</script>
