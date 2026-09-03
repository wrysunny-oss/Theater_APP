<template>
  <view class="min-w-0" @click="$emit('open', item)">
    <view class="app-surface-raised relative h-410rpx overflow-hidden rounded-20rpx">
      <up-image width="100%" height="100%" mode="aspectFill" :src="item.image" />
      <view class="poster-mask absolute inset-x-0 bottom-0 h-150rpx" />
      <view class="absolute bottom-14rpx left-14rpx right-14rpx"><text class="line-clamp-2 block text-25rpx font-700 leading-34rpx">{{ item.title }}</text><text class="mt-5rpx block text-20rpx text-[#bbbcc3]">{{ item.meta }}</text></view>
      <view class="absolute right-12rpx top-12rpx flex h-54rpx w-54rpx items-center justify-center rounded-full bg-black/65" @click.stop="$emit('remove', item.id)"><up-icon name="star-fill" size="20" color="#ffc400" /></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { FavoriteItem } from "../../types/library";
defineProps<{ item: FavoriteItem }>();
defineEmits<{ open: [item: FavoriteItem]; remove: [id: number] }>();
</script>

<style scoped>
.poster-mask { background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.94)); }
</style>
