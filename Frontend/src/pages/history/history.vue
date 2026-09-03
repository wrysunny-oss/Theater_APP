<template>
  <scroll-view scroll-y class="h-screen bg-[#090a0f] text-white">
    <AppPageHeader title="观看历史" sticky>
      <template #right><text v-if="items.length" class="text-23rpx text-[#ffc400]" @click.stop="confirmClear">清空</text></template>
    </AppPageHeader>
    <view class="px-28rpx pb-50rpx pt-18rpx">
      <view v-if="items.length">
        <text class="mb-16rpx block text-22rpx text-[#9295a1]">共 {{ items.length }} 条观看记录</text>
        <view class="overflow-hidden rounded-24rpx bg-[#15161d] px-20rpx">
          <HistoryListItem v-for="(item, index) in items" :key="item.id" :item="item" :class="index < items.length - 1 ? 'border-b border-white/10' : ''" @play="play" @remove="remove" />
        </view>
      </view>
      <PageState v-else status="empty" title="暂无观看记录" description="看过的短剧会显示在这里" />
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import AppPageHeader from "../../components/common/AppPageHeader.vue";
import PageState from "../../components/common/PageState.vue";
import HistoryListItem from "../../components/library/HistoryListItem.vue";
import { useContentCollection } from "../../composables/useContentCollection";
import { clearWatchHistory, fetchWatchHistory, removeWatchHistory } from "../../services/library";
import type { WatchHistoryItem } from "../../types/library";

const { items, remove, confirmClear } = useContentCollection<WatchHistoryItem>({
  load: fetchWatchHistory, remove: removeWatchHistory, clear: clearWatchHistory,
  removedText: "已删除", clearTitle: "清空观看历史", clearContent: "确定清空全部观看记录吗？",
});
const play = (item: WatchHistoryItem) => uni.navigateTo({ url: `/pages/player/player?id=${item.id}&episode=${item.episode}&time=${item.positionSeconds || 0}` });
</script>
