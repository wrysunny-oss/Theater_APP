<template>
  <scroll-view scroll-x :show-scrollbar="false" class="mt-24rpx whitespace-nowrap">
    <view class="inline-flex gap-14rpx pb-4rpx">
      <view
        v-for="item in actions"
        :key="item.key"
        class="min-w-76rpx rounded-full border px-22rpx py-14rpx text-center text-23rpx"
        :style="itemStyle(item.key)"
        @click="$emit('update:modelValue', item.key)"
      >{{ item.name }}</view>
    </view>
  </scroll-view>
</template>
<script setup lang="ts">
interface ActionItem { key: string; name: string }
const props = withDefaults(defineProps<{ actions?: ActionItem[]; modelValue?: string }>(), { actions: () => [], modelValue: "all" });
defineEmits<{ "update:modelValue": [value: string] }>();

// 运行时状态使用内联样式，避免跨端构建时动态 UnoCSS 类被按需扫描器忽略。
const itemStyle = (key: string) => props.modelValue === key
  ? { backgroundColor: "#ffc400", borderColor: "#ffc400", color: "#171717", fontWeight: "700" }
  : { backgroundColor: "#1b1c25", borderColor: "rgba(255,255,255,.06)", color: "#9294a0", fontWeight: "400" };
</script>
