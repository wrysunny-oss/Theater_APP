<!-- 三列虚拟列表：Header与剧集行共用一个uView滚动容器。 -->
<template>
  <up-list
    height="100vh"
    :lower-threshold="120"
    :pre-load-screen="1"
    :show-scrollbar="false"
    :refresher-enabled="true"
    :refresher-triggered="refreshing"
    refresher-background="#090a0f"
    @scrolltolower="$emit('load-more')"
    @refresherrefresh="$emit('refresh')"
  >
    <up-list-item anchor="home-header"><slot name="header" /></up-list-item>
    <up-list-item v-for="(row, rowIndex) in rows" :key="row[0]?.id || rowIndex" :anchor="`movie-row-${rowIndex}`">
      <view class="grid grid-cols-3 gap-x-12rpx px-28rpx pb-22rpx">
        <view v-for="movie in row" :key="movie.id" class="min-w-0" @click="$emit('select', movie.sourceId)">
          <view class="relative h-248rpx overflow-hidden rounded-18rpx bg-[#1b1c25]">
            <up-image width="100%" height="100%" mode="aspectFill" :src="movie.image">
              <template #error><view class="flex h-full items-center justify-center"><up-icon name="photo" size="28" color="#555762" /></view></template>
            </up-image>
            <view v-if="movie.badge" class="absolute left-8rpx top-8rpx z-2"><up-tag :text="movie.badge" :type="movie.badgeType || 'info'" size="mini" /></view>
            <view class="card-mask absolute inset-x-0 bottom-0 h-110rpx" />
            <view class="absolute bottom-10rpx left-10rpx right-8rpx z-2"><text class="title-clamp block text-22rpx font-700 leading-30rpx text-white">{{ movie.title }}</text><text class="mt-3rpx block text-20rpx text-[#bbbcc3]">{{ movie.meta }}</text></view>
          </view>
        </view>
      </view>
    </up-list-item>
    <up-list-item anchor="load-state">
      <view class="pb-130rpx pt-4rpx">
        <up-loadmore :status="loading ? 'loading' : finished ? 'nomore' : 'loadmore'" loadmore-text="继续上滑加载" nomore-text="没有更多短剧了" color="#9295a1" />
      </view>
    </up-list-item>
  </up-list>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { HomeMovie } from "../../types/content";

const props = withDefaults(defineProps<{ movies?: HomeMovie[]; loading?: boolean; finished?: boolean; refreshing?: boolean }>(), {
  movies: () => [], loading: false, finished: false, refreshing: false,
});
defineEmits<{ select: [id: number]; "load-more": []; refresh: [] }>();

// 固定三张一行，保证虚拟项尺寸稳定，便于 uView 回收屏幕外节点。
const rows = computed(() => {
  const result: HomeMovie[][] = [];
  for (let index = 0; index < props.movies.length; index += 3) result.push(props.movies.slice(index, index + 3));
  return result;
});
</script>

<style scoped>
.card-mask { background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.92)); }
.title-clamp { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
</style>
