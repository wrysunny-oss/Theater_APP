<template>
  <scroll-view scroll-y class="app-page-shell h-screen">
    <view class="px-28rpx pb-44rpx pt-34rpx">
      <AppPageHeader class="-mx-28rpx -mt-34rpx" title="设置" />
      <view class="mt-28rpx overflow-hidden rounded-22rpx bg-[#15161d] px-22rpx">
        <view class="flex items-center justify-between border-b border-white/10 py-24rpx"><text class="text-26rpx">应用名称</text><text class="text-23rpx text-[#a6a8b2]">{{ appConfig.name }}</text></view>
        <view class="flex items-center justify-between border-b border-white/10 py-24rpx"><text class="text-26rpx">当前版本</text><text class="text-23rpx text-[#a6a8b2]">v{{ appConfig.versionName }}</text></view>
        <view class="flex items-center justify-between py-24rpx" @click="clearCache"><text class="text-26rpx">清理搜索缓存</text><view class="flex items-center"><text class="mr-10rpx text-23rpx text-[#a6a8b2]">{{ cacheText }}</text><up-icon name="arrow-right" size="15" color="#666874" /></view></view>
      </view>
      <view class="mt-24rpx overflow-hidden rounded-22rpx bg-[#15161d] px-22rpx">
        <view class="flex items-center justify-between border-b border-white/10 py-24rpx" @click="openSecurity"><text class="text-26rpx">绑定收款账户</text><up-icon name="arrow-right" size="15" color="#666874" /></view>
        <view v-for="item in links" :key="item.title" class="flex items-center justify-between border-b border-white/10 py-24rpx" @click="openLink(item)"><text class="text-26rpx">{{ item.title }}</text><up-icon name="arrow-right" size="15" color="#666874" /></view>
      </view>
      <view class="mt-24rpx rounded-22rpx border border-[#4a2727] bg-[#1c1417] p-22rpx"><text class="block text-27rpx font-700 text-[#ff7888]">开发与演示</text><text class="my-14rpx block text-22rpx leading-34rpx text-[#9b777d]">重置任务进度、金币流水和通知数据，不会退出当前本地账号。</text><up-button text="重置演示数据" shape="circle" color="#382027" @click="resetDemo" /></view>
    </view>
  </scroll-view>
</template>
<script setup lang="ts">
import { ref } from "vue";
import AppPageHeader from "../../components/common/AppPageHeader.vue";
import appConfig from "../../config/app.json";
import { resetRewardState } from "../../services/reward";
import { resetNotifications } from "../../services/notification";
import { useConfirmAction } from "../../composables/useConfirmAction";
const cacheText = ref(uni.getStorageSync("search-history") ? "有缓存" : "0 KB");
const { confirmAction } = useConfirmAction();
const links = [
  { title: "隐私设置", message: "隐私设置待完善" },
  { title: "用户协议", url: "/pages/agreement/agreement?type=user" },
  { title: "隐私政策", url: "/pages/agreement/agreement?type=privacy" },
  { title: "关于幻乐剧场", message: "关于页面待完善" },
];
const openLink = (item: typeof links[number]) => item.url ? uni.navigateTo({ url: item.url }) : uni.showToast({ title: item.message || "页面待完善", icon: "none" });
const openSecurity = () => uni.navigateTo({ url: "/pages/security/security?editor=alipay" });
const clearCache = () => { uni.removeStorageSync("search-history"); cacheText.value = "0 KB"; uni.showToast({ title: "缓存已清理", icon: "success" }); };
const resetDemo = () => confirmAction({ title: "重置演示数据", content: "任务、金币和通知将恢复初始状态，此操作无法撤销。", confirmColor: "#ff4d67" }, () => { resetRewardState(); resetNotifications(); uni.showToast({ title: "演示数据已重置", icon: "success" }); });
</script>
