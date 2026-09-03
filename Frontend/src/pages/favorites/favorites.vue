<template>
  <scroll-view scroll-y class="app-page-shell h-screen">
    <AppPageHeader title="我的收藏" sticky>
      <template #right><text v-if="items.length" class="text-23rpx text-[#ffc400]" @click.stop="confirmClear">清空</text></template>
    </AppPageHeader>
    <view class="px-28rpx pb-50rpx pt-18rpx">
      <view v-if="items.length">
        <text class="mb-16rpx block text-22rpx text-[#9295a1]">已收藏 {{ items.length }} 部短剧</text>
        <view class="grid grid-cols-2 gap-x-18rpx gap-y-24rpx">
          <FavoriteDramaCard v-for="item in items" :key="item.id" :item="item" @open="open" @remove="remove" />
        </view>
      </view>
      <PageState v-else status="empty" title="暂无收藏" description="收藏喜欢的短剧后，可以在这里快速找到" />
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import AppPageHeader from "../../components/common/AppPageHeader.vue";
import PageState from "../../components/common/PageState.vue";
import FavoriteDramaCard from "../../components/library/FavoriteDramaCard.vue";
import { useContentCollection } from "../../composables/useContentCollection";
import { clearFavorites, fetchFavorites, removeFavorite } from "../../services/library";
import type { FavoriteItem } from "../../types/library";

const { items, remove, confirmClear } = useContentCollection<FavoriteItem>({
  load: fetchFavorites, remove: removeFavorite, clear: clearFavorites,
  removedText: "已取消收藏", clearTitle: "清空收藏", clearContent: "确定取消全部收藏吗？",
});
const open = (item: FavoriteItem) => uni.navigateTo({ url: `/pages/player/player?id=${item.id}` });
</script>
