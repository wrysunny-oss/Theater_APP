<template>
  <view class="mb-22rpx flex items-center justify-between">
    <view class="flex items-center gap-10rpx">
      <text
        v-for="tab in tabs"
        :key="tab.value"
        class="rounded-12rpx px-18rpx py-13rpx text-25rpx"
        :style="tabStyle(tab.value)"
        @click="$emit('update:modelValue', tab.value)"
      >{{ tab.label }}</text>
    </view>
    <view class="flex items-center" @click="showAll"><text class="text-22rpx text-[#a6a8b2]">{{ moreText }}</text><up-icon name="arrow-right" size="12" color="#a6a8b2" /></view>
  </view>
</template>
<script setup lang="ts">
interface TabItem { label: string; value: string }
const props = withDefaults(defineProps<{ tabs?: TabItem[]; modelValue?: string; moreText?: string }>(), { tabs: () => [], modelValue: "", moreText: "查看全部" });
defineEmits<{ "update:modelValue": [value: string] }>();
const tabStyle = (value: string) => props.modelValue === value
  ? { backgroundColor: "#3a2d00", color: "#ffc400", fontWeight: "700" }
  : { backgroundColor: "transparent", color: "#a6a8b2", fontWeight: "400" };
const showAll = () => uni.showToast({ title: "完整榜单开发中", icon: "none" });
</script>
