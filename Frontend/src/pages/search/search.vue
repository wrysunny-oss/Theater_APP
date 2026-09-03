<template>
  <view class="app-page search-page">
    <view class="search-header"
      ><text class="back" @click="back">‹</text
      ><text class="header-title">搜索</text></view
    >
    <up-search
      v-model="keyword"
      placeholder="搜索剧情、演员、标签"
      :show-action="true"
      action-text="搜索"
      @search="search"
      @custom="search"
    />
    <view class="panel"
      ><text class="panel-title">热门搜索</text
      ><view class="tags"
        ><text v-for="tag in hot" :key="tag" class="tag" @click="pick(tag)">{{
          tag
        }}</text></view
      ></view
    >
    <view v-if="history.length" class="panel"
      ><view class="row"
        ><text class="panel-title">搜索历史</text
        ><text class="muted" @click="clear">清空</text></view
      ><view class="tags"
        ><text
          v-for="tag in history"
          :key="tag"
          class="tag"
          @click="pick(tag)"
          >{{ tag }}</text
        ></view
      ></view
    >
  </view>
</template>
<script setup lang="ts">
import { ref } from "vue";
// 搜索历史保留最近 8 个不重复关键词，结果列表后续由内容 API 提供。
const keyword = ref("");
const hot = ["都市恋爱", "古装", "悬疑", "逆袭"];
const history = ref<string[]>(uni.getStorageSync("search-history") || []);
const back = () => uni.navigateBack();
const search = () => {
  const value = keyword.value.trim();
  if (!value) return;
  history.value = [
    value,
    ...history.value.filter((item) => item !== value),
  ].slice(0, 8);
  uni.setStorageSync("search-history", history.value);
  uni.showToast({ title: "暂无更多结果", icon: "none" });
};
const pick = (value: string) => {
  keyword.value = value;
  search();
};
const clear = () => {
  history.value = [];
  uni.removeStorageSync("search-history");
};
</script>
<style scoped lang="scss">
@import "../../styles/page.scss";
.search-page {
  padding-top: 32rpx;
}
.search-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}
.back {
  width: 64rpx;
  font-size: 56rpx;
}
.header-title {
  font-size: 34rpx;
  font-weight: 700;
}
.panel {
  margin-top: 28rpx;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.tag {
  padding: 14rpx 22rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.08);
  color: var(--app-text-soft);
}
</style>
