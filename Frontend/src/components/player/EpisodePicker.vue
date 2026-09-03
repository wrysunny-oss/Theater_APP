<template>
  <up-popup :show="show" mode="bottom" :round="24" bg-color="var(--app-surface)" :closeable="true" @close="$emit('close')">
    <view class="px-28rpx pb-[calc(env(safe-area-inset-bottom)+34rpx)] pt-38rpx text-white">
      <view class="flex items-end"><text class="block text-31rpx font-800">选择剧集</text><text class="app-text-tertiary ml-12rpx text-21rpx">共 {{ episodes.length }} 集</text></view>
      <scroll-view scroll-y class="mt-24rpx max-h-620rpx">
        <view class="grid grid-cols-5 gap-14rpx">
          <view v-for="episode in episodes" :key="episode.number" class="flex h-72rpx items-center justify-center rounded-14rpx text-24rpx font-600" :class="episode.number === current ? 'bg-[var(--app-brand)] text-[var(--app-brand-contrast)]' : 'app-control app-text-secondary'" @click="$emit('select', episode.number)">{{ episode.number }}</view>
        </view>
      </scroll-view>
    </view>
  </up-popup>
</template>

<script setup lang="ts">
import type { DramaEpisode } from "../../types/library";
withDefaults(defineProps<{ show?: boolean; episodes?: DramaEpisode[]; current?: number }>(), { show: false, episodes: () => [], current: 1 });
defineEmits<{ close: []; select: [number: number] }>();
</script>
