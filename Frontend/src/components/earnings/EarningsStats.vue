<template>
  <view class="mt-22rpx grid grid-cols-2 gap-16rpx">
    <view class="rounded-20rpx bg-[#15161d] p-22rpx"><text class="text-22rpx text-[#a6a8b2]">筛选收入</text><text class="mt-12rpx block text-34rpx font-800">{{ total }}</text></view>
    <view class="rounded-20rpx bg-[#15161d] p-22rpx"><text class="text-22rpx text-[#a6a8b2]">收入笔数</text><text class="mt-12rpx block text-34rpx font-800">{{ count }}</text></view>
  </view>
</template>
<script setup lang="ts">
defineProps<{ total: number; count: number }>();
</script>
