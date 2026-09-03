<template>
  <view class="flex py-22rpx" @click="$emit('play', item)">
    <view class="app-control h-164rpx w-116rpx shrink-0 overflow-hidden rounded-14rpx"><up-image width="100%" height="100%" mode="aspectFill" :src="item.image" /></view>
    <view class="ml-18rpx flex min-w-0 flex-1 flex-col">
      <view class="flex items-start"><text class="line-clamp-2 flex-1 text-27rpx font-700 leading-38rpx">{{ item.title }}</text><up-icon class="ml-12rpx" name="trash" size="18" color="#7c7f8a" @click.stop="$emit('remove', item.id)" /></view>
      <text class="app-text-secondary mt-10rpx block text-22rpx">看到第 {{ item.episode }} 集 · {{ positionText }}</text>
      <view class="mt-auto">
        <up-line-progress :percentage="progress" height="4" active-color="#ffc400" inactive-color="#30313a" :show-text="false" />
        <view class="mt-10rpx flex items-center justify-between"><text class="text-20rpx text-[#7c7f8a]">{{ item.watchedAt }}</text><text class="text-21rpx text-[#ffc400]">继续观看</text></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { WatchHistoryItem } from "../../types/library";
const props = defineProps<{ item: WatchHistoryItem }>();
defineEmits<{ play: [item: WatchHistoryItem]; remove: [id: number] }>();
const progress = computed(() => Math.min(100, Math.round(props.item.episode / props.item.totalEpisodes * 100)));
const positionText = computed(() => {
  const seconds = props.item.positionSeconds || 0;
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
});
</script>
