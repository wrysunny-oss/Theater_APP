<!--
  底部导航组件
  作用：切换首页、福利、收益、我的四个主入口。
  说明：视觉主体使用 uView Plus，定位与尺寸交给 UnoCSS。
-->
<template>
  <up-tabbar
    :value="current"
    :fixed="true"
    :placeholder="false"
    :safe-area-inset-bottom="true"
    active-color="#ffc400"
    inactive-color="#9295a1"
    background-color="#0d0e14"
    border-color="rgba(255,255,255,0.05)"
    animation-type="scale"
    :icon-scale="1.08"
    class="fixed inset-x-0 bottom-0 z-50"
    @change="changeTab"
  >
    <up-tabbar-item name="home" icon="home" text="首页" />
    <up-tabbar-item name="gift" icon="star" text="福利" />
    <up-tabbar-item name="earn" icon="heart" text="收益" />
    <up-tabbar-item name="mine" icon="account" text="我的" />
  </up-tabbar>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ current?: string }>(), { current: "home" });

const routes: Record<string, string> = {
  home: "/pages/index/index",
  gift: "/pages/tasks/tasks",
  earn: "/pages/earnings/earnings",
  mine: "/pages/user/user",
};

// 自定义底栏使用 redirectTo，切换主入口时不会持续堆积页面栈。
const changeTab = (name: string | number) => {
  const url = routes[String(name)];
  if (url) uni.redirectTo({ url });
};
</script>

<style scoped>
:deep(.up-tabbar) {
  height: 116rpx;
  padding: 12rpx 8rpx 20rpx;
  backdrop-filter: blur(20rpx);
}

:deep(.up-tabbar__item) {
  font-size: 20rpx;
}

:deep(.u-tabbar__content) {
  background: rgba(13, 14, 20, 0.98) !important;
  box-shadow: 0 -8rpx 30rpx rgba(0, 0, 0, 0.28);
}

</style>
