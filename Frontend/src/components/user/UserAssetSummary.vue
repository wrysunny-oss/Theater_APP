<template>
  <view class="mt-22rpx grid grid-cols-3 overflow-hidden rounded-22rpx bg-[#15161d] py-24rpx">
    <view class="text-center" @click="$emit('earnings')"><text class="block text-32rpx font-800 text-[#ffc400]">{{ coins }}</text><text class="mt-9rpx block text-22rpx text-[#a6a8b2]">金币</text></view>
    <view class="border-x border-white/10 text-center" @click="$emit('tasks')"><text class="block text-32rpx font-800">{{ streakDays }}</text><text class="mt-9rpx block text-22rpx text-[#a6a8b2]">连续签到</text></view>
    <view class="text-center" @click="$emit('tasks')"><text class="block text-32rpx font-800">{{ completedTasks }}/{{ totalTasks }}</text><text class="mt-9rpx block text-22rpx text-[#a6a8b2]">今日任务</text></view>
  </view>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ coins?: number; streakDays?: number; completedTasks?: number; totalTasks?: number }>(), { coins: 0, streakDays: 0, completedTasks: 0, totalTasks: 5 });
defineEmits<{ earnings: []; tasks: [] }>();
</script>
