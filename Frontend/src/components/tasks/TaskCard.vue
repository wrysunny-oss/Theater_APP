<!-- 任务展示组件无持久化逻辑，仅根据输入状态展示并派发操作事件。 -->
<template>
  <view class="mb-18rpx rounded-22rpx border border-white/10 bg-[#14151c] p-22rpx">
    <view class="flex items-center gap-18rpx">
      <view class="flex h-70rpx w-70rpx items-center justify-center rounded-18rpx bg-[#2d270d]"><up-icon :name="task.icon" size="26" color="#ffc400" /></view>
      <view class="min-w-0 flex-1"><text class="block text-27rpx font-700">{{ task.title }}</text><text class="mt-7rpx block text-22rpx text-[#a6a8b2]">{{ task.desc }}</text></view>
      <view class="rounded-full px-20rpx py-12rpx text-22rpx font-700" :style="actionStyle" @click="$emit('action')">{{ actionText }}</view>
    </view>
    <view class="mt-18rpx"><view class="mb-8rpx flex justify-between"><text class="text-20rpx text-[#9295a1]">{{ task.progress }}/{{ task.target }}</text><text class="text-20rpx text-[#9295a1]">奖励 {{ task.reward }} 金币</text></view><up-line-progress :percentage="percentage" active-color="#ffc400" inactive-color="#292a32" height="4" :show-text="false" /></view>
  </view>
</template>
<script setup lang="ts">
import { computed } from "vue";
interface TaskView { id: string; title: string; desc: string; icon: string; reward: number; progress: number; target: number }
const props = defineProps<{ task: TaskView; claimed: boolean }>();
defineEmits<{ action: [] }>();
const percentage = computed(() => Math.min(100, props.task.progress / props.task.target * 100));
const actionText = computed(() => props.claimed ? "已领取" : props.task.progress >= props.task.target ? `领取 +${props.task.reward}` : props.task.id === "share" ? "去分享" : "去完成");
const actionStyle = computed(() => props.claimed ? { backgroundColor: "#24252d", color: "#9295a1" } : { backgroundColor: "#ffc400", color: "#171717" });
</script>
