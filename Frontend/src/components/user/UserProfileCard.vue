<template>
  <view class="mt-28rpx flex items-center gap-20rpx rounded-26rpx bg-[#15161d] p-24rpx">
    <view class="flex h-94rpx w-94rpx shrink-0 items-center justify-center overflow-hidden rounded-full border-3rpx border-[#ffc400] bg-[#30280b]">
      <up-image v-if="avatar" width="100%" height="100%" shape="circle" mode="aspectFill" :src="avatar" />
      <text v-else class="text-34rpx font-800 text-[#ffc400]">{{ avatarText }}</text>
    </view>
    <view class="min-w-0 flex-1"><text class="block truncate text-30rpx font-700">{{ nickname }}</text><text class="mt-10rpx block text-22rpx text-[#a6a8b2]">{{ subtitle }}</text></view>
    <up-button :text="loggedIn ? '编辑' : '登录'" size="small" shape="circle" color="#ffc400" @click="$emit('edit')" />
  </view>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ loggedIn?: boolean; nickname?: string; subtitle?: string; avatar?: string; avatarText?: string }>(), { loggedIn: false, nickname: "游客用户", subtitle: "登录后保存个人资料", avatar: "", avatarText: "游" });
defineEmits<{ edit: [] }>();
</script>
