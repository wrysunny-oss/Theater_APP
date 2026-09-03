<!-- 首页只有 MovieGrid 内部的 uView List 负责纵向滚动，避免嵌套滚动冲突。 -->
<template>
  <view class="h-screen overflow-hidden bg-[#090a0f] text-white">
    <!-- 独立于虚拟列表的固定层，避免虚拟节点回收后吸顶失效。 -->
    <view class="home-sticky fixed inset-x-0 top-0 z-40 px-28rpx pb-18rpx pt-28rpx">
      <HomeHeader />
      <SearchBar />
    </view>
    <MovieGrid
      :key="listKey"
      :movies="movies"
      :loading="loading"
      :finished="finished"
      :refreshing="refreshing"
      @select="openDrama"
      @load-more="loadMore"
      @refresh="refresh"
    >
      <template #header>
        <!-- 与固定头部等高，确保首屏内容不会被遮挡。 -->
        <view class="h-204rpx" />
        <view class="px-28rpx">
          <HomeBanner :banners="homeBanners" @select="openDrama" />
          <QuickActionGrid v-model="activeCategory" :actions="homeCategories" />
          <view class="mt-26rpx">
            <SectionTitle v-model="activeRank" :tabs="homeRankTabs" more-text="查看全部" />
          </view>
        </view>
      </template>
    </MovieGrid>
    <BottomNav current="home" />
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import HomeHeader from "../../components/home/HomeHeader.vue";
import SearchBar from "../../components/home/SearchBar.vue";
import HomeBanner from "../../components/home/HomeBanner.vue";
import QuickActionGrid from "../../components/home/QuickActionGrid.vue";
import SectionTitle from "../../components/home/SectionTitle.vue";
import MovieGrid from "../../components/home/MovieGrid.vue";
import BottomNav from "../../components/home/BottomNav.vue";
import { homeBanners, homeCategories, homeRankTabs } from "../../mock/home";
import { useHomeMovies } from "../../composables/useHomeMovies";

const activeCategory = ref("all");
const activeRank = ref("hot");
const { movies, loading, refreshing, finished, listKey, loadMore, refresh } = useHomeMovies(activeCategory, activeRank);

const openDrama = (id: number) => uni.navigateTo({ url: `/pages/player/player?id=${id}` });
</script>

<style scoped>
.home-sticky {
  background: linear-gradient(180deg, rgba(9, 10, 15, 1) 78%, rgba(9, 10, 15, 0.94));
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.035);
  backdrop-filter: blur(20rpx);
}
</style>
