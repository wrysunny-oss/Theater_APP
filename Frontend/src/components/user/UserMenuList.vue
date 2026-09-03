<template>
  <view class="mt-24rpx overflow-hidden rounded-22rpx bg-[#15161d] px-22rpx">
    <view v-for="item in items" :key="item.title" class="flex items-center border-b border-white/10 py-24rpx" @click="$emit('select', item)"><view class="flex h-58rpx w-58rpx items-center justify-center rounded-16rpx bg-[#24251f]"><up-icon :name="item.icon" size="23" color="#ffc400" /></view><text class="ml-18rpx flex-1 text-26rpx">{{ item.title }}</text><up-badge v-if="item.badge" :value="item.badge" type="error" /><up-icon name="arrow-right" size="15" color="#7c7f8a" /></view>
  </view>
</template>
<script setup lang="ts">
export interface UserMenuItem { title: string; icon: string; route?: string; message?: string; badge?: number }
withDefaults(defineProps<{ items?: UserMenuItem[] }>(), { items: () => [] });
defineEmits<{ select: [item: UserMenuItem] }>();
</script>
