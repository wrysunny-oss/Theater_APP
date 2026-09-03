<template>
  <view class="mt-30rpx rounded-22rpx bg-[#15161d] p-24rpx"><view class="mb-20rpx flex items-center gap-10rpx"><up-icon name="info-circle" size="21" color="#ffc400" /><text class="text-28rpx font-700">金币规则</text></view><view v-for="rule in rules" :key="rule.label" class="flex justify-between py-13rpx"><text class="text-23rpx text-[#a6a8b2]">{{ rule.label }}</text><text class="text-23rpx text-[#d7d8dc]">{{ rule.value }}</text></view></view>
</template>
<script setup lang="ts">
interface RuleItem { label: string; value: string }
withDefaults(defineProps<{ rules?: RuleItem[] }>(), { rules: () => [] });
</script>
