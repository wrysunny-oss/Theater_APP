<template>
  <view class="mb-24rpx flex items-center justify-between pt-8rpx">
    <view class="flex items-center gap-14rpx"><text class="text-40rpx font-800 tracking-2rpx text-[#ffc400]">剧场</text><up-tag text="精选" type="warning" plain size="mini" shape="circle" /></view>
    <view class="flex items-center gap-24rpx">
      <view class="relative" @click="showNotice"><up-icon name="bell" size="25" color="#f4f4f5" /><view class="absolute right--2rpx top--2rpx h-10rpx w-10rpx rounded-full bg-[#ff4768]" /></view>
      <view class="h-58rpx w-58rpx overflow-hidden rounded-full border-3rpx border-[#ffc400] bg-[#292b34]"><up-image width="100%" height="100%" shape="circle" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80" /></view>
    </view>
  </view>
</template>
<script setup lang="ts">
const showNotice = () => uni.showToast({ title: "暂无新通知", icon: "none" });
</script>
