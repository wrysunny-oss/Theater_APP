<!-- 通用页面头部：统一处理系统状态栏、返回操作、标题和右侧动作。 -->
<template>
  <view :class="sticky ? 'sticky top-0 z-30 bg-[#090a0f]' : ''">
    <up-status-bar />
    <view class="flex min-h-88rpx items-center px-28rpx">
      <view v-if="showBack" class="mr-18rpx flex h-60rpx w-54rpx items-center" @click="back"><up-icon name="arrow-left" size="22" color="#f5f5f7" /></view>
      <text class="min-w-0 flex-1 truncate text-36rpx font-800 text-[#f5f5f7]">{{ title }}</text>
      <view class="ml-18rpx"><slot name="right" /></view>
    </view>
  </view>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ title: string; showBack?: boolean; sticky?: boolean }>(), { showBack: true, sticky: false });
const emit = defineEmits<{ back: [] }>();
const back = () => { emit("back"); uni.navigateBack(); };
</script>
