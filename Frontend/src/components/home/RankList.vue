<!--
  榜单组件
  作用：展示排行榜横向滑动列表。
  说明：后续可替换为真实接口数据和图片资源。
-->
<template>
  <up-scroll-list :indicator="false" class="rank-list">
    <view class="rank-item" v-for="item in list" :key="item.id">
      <view class="rank-poster" :style="`background: ${item.gradient};`">
        <up-tag
          :text="`TOP ${item.rank}`"
          type="warning"
          size="mini"
          class="rank-badge"
        />
      </view>
      <view class="rank-info">
        <text class="rank-name">{{ item.title }}</text>
        <text class="rank-meta">{{ item.meta }}</text>
      </view>
    </view>
  </up-scroll-list>
</template>

<script setup lang="ts">
interface RankItem {
  id: number;
  rank: number;
  title: string;
  meta: string;
  gradient: string;
}

withDefaults(
  defineProps<{
    list?: RankItem[];
  }>(),
  {
    list: () => [],
  },
);
</script>

<style scoped>
.rank-list {
  margin-top: 8rpx;
}

:deep(.up-scroll-list) {
  overflow: hidden;
}

.rank-item {
  flex-shrink: 0;
  width: 230rpx;
  margin-right: 22rpx;
}

.rank-poster {
  height: 220rpx;
  border-radius: 24rpx;
  position: relative;
  box-shadow: 0 12rpx 22rpx rgba(33, 33, 33, 0.08);
}

.rank-badge {
  position: absolute;
  left: 16rpx;
  top: 16rpx;
}

.rank-info {
  display: flex;
  flex-direction: column;
  margin-top: 14rpx;
  gap: 8rpx;
}

.rank-name {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--app-text);
}

.rank-meta {
  font-size: 22rpx;
  color: var(--app-muted);
}
</style>
