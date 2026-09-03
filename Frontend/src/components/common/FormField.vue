<template>
  <view class="mt-22rpx">
    <text class="mb-11rpx block text-23rpx text-[#b8bac4]">{{ label }}</text>
    <slot />
  </view>
</template>

<script setup lang="ts">
/** 弹窗表单项的统一标题与间距容器。 */
defineProps<{ label: string }>();
</script>
