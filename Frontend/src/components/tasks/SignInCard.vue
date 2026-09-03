<template>
  <view class="mt-28rpx rounded-24rpx bg-gradient-to-br from-[#3b3006] to-[#17160f] p-24rpx">
    <view class="flex items-center justify-between"><view><text class="block text-30rpx font-700">连续签到 {{ streakDays }} 天</text><text class="mt-8rpx block text-22rpx text-[#b9aa75]">连续签到奖励逐日递增，最高40金币</text></view><up-icon name="gift-fill" size="34" color="#ffc400" /></view>
    <view class="mt-24rpx grid grid-cols-7 gap-8rpx"><view v-for="day in days" :key="day.label" class="rounded-14rpx py-14rpx text-center" :style="day.active ? activeStyle : normalStyle"><text class="block text-20rpx">{{ day.label }}</text><text class="mt-8rpx block text-22rpx font-700">+{{ day.reward }}</text></view></view>
    <up-button class="mt-22rpx" shape="circle" :disabled="signed" :text="signed ? '今日已签到' : `签到领 ${reward} 金币`" color="#ffc400" @click="$emit('sign')" />
  </view>
</template>
<script setup lang="ts">
interface SignDay { label: string; reward: number; active: boolean }
withDefaults(defineProps<{ streakDays?: number; signed?: boolean; reward?: number; days?: SignDay[] }>(), { streakDays: 0, signed: false, reward: 10, days: () => [] });
defineEmits<{ sign: [] }>();
const activeStyle = { backgroundColor: "#ffc400", color: "#171717" };
const normalStyle = { backgroundColor: "rgba(255,255,255,.08)", color: "#a6a8b2" };
</script>
