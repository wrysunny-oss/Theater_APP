<!-- 统一异步页面状态，避免各页面重复实现加载、空数据和错误样式。 -->
<template>
  <view class="flex min-h-360rpx flex-col items-center justify-center px-40rpx text-center">
    <up-loading-icon v-if="status === 'loading'" mode="circle" color="#ffc400" size="28" />
    <up-icon v-else :name="status === 'error' ? 'error-circle' : 'file-text'" size="44" color="#696c77" />
    <text class="app-text-secondary mt-22rpx text-25rpx font-600">{{ title || defaultTitle }}</text>
    <text v-if="description" class="app-text-tertiary mt-10rpx text-22rpx leading-34rpx">{{ description }}</text>
    <up-button v-if="status === 'error'" class="mt-24rpx" text="重新加载" size="small" shape="circle" color="#ffc400" @click="$emit('retry')" />
  </view>
</template>
<script setup lang="ts">
import { computed } from "vue";
type StateType = "loading" | "empty" | "error";
const props = withDefaults(defineProps<{ status?: StateType; title?: string; description?: string }>(), { status: "empty", title: "", description: "" });
defineEmits<{ retry: [] }>();
const defaultTitle = computed(() => ({ loading: "正在加载", empty: "暂无数据", error: "加载失败" })[props.status]);
</script>
