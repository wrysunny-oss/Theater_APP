<template>
  <view @click="openSearch"><up-search v-model="keyword" disabled placeholder="搜索剧名、演员、标签..." shape="square" bg-color="#1b1c25" color="#f5f5f5" placeholder-color="#7f818d" search-icon-color="#8d8f9c" :show-action="false" height="44" /></view>
</template>
<script setup lang="ts">
import { ref } from "vue";
const keyword = ref("");
const openSearch = () => uni.navigateTo({ url: "/pages/search/search" });
</script>
<style scoped>:deep(.up-search__content) { border: 1rpx solid rgba(255,255,255,.08); }</style>
