<template>
  <scroll-view scroll-y class="app-page-shell h-screen">
    <view class="px-28rpx pb-150rpx pt-38rpx">
      <text class="block text-40rpx font-800">我的</text>

      <UserProfileCard :logged-in="user.loggedIn" :nickname="user.nickname" :subtitle="user.loggedIn ? maskedPhone : '登录后保存个人资料'" :avatar="user.avatar" :avatar-text="avatarText" @edit="openEditor" />
      <UserAssetSummary :coins="rewards.balance" :streak-days="rewards.streakDays" :completed-tasks="completedTasks" @earnings="go('/pages/earnings/earnings')" @tasks="go('/pages/tasks/tasks')" />
      <UserMenuList :items="menu" @select="handleMenu" />

      <up-button v-if="user.loggedIn" class="mt-28rpx" text="退出登录" shape="circle" color="#24252d" @click="logout" />
    </view>
    <BottomNav current="mine" />
  </scroll-view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BottomNav from "../../components/home/BottomNav.vue";
import UserProfileCard from "../../components/user/UserProfileCard.vue";
import UserAssetSummary from "../../components/user/UserAssetSummary.vue";
import UserMenuList, { type UserMenuItem } from "../../components/user/UserMenuList.vue";
import { useUserDashboard } from "../../composables/useUserDashboard";

const { user, rewards, unreadCount, avatarText, maskedPhone, completedTasks, logout } = useUserDashboard();
const menu = computed<UserMenuItem[]>(() => [
  { title: "福利任务", icon: "gift", route: "/pages/tasks/tasks" },
  { title: "我的收益", icon: "red-packet", route: "/pages/earnings/earnings" },
  { title: "邀请好友", icon: "share", route: "/pages/share/share" },
  { title: "观看历史", icon: "clock", route: "/pages/history/history" },
  { title: "我的收藏", icon: "star", route: "/pages/favorites/favorites" },
  { title: "通知消息", icon: "bell", route: "/pages/notifications/notifications", badge: unreadCount.value },
  { title: "帮助与反馈", icon: "question-circle", route: "/pages/help/help" },
  { title: "账户安全", icon: "lock", route: "/pages/security/security" },
  { title: "设置", icon: "setting", route: "/pages/settings/settings" },
]);

const go = (url: string) => uni.redirectTo({ url });
const handleMenu = (item: UserMenuItem) => {
  if (!item.route) return uni.showToast({ title: item.message || "功能开发中", icon: "none" });
  if (item.route.includes("/tasks/") || item.route.includes("/earnings/")) return go(item.route);
  uni.navigateTo({ url: item.route });
};
const openEditor = () => {
  if (!user.value.loggedIn) {
    uni.navigateTo({ url: "/pages/auth/auth" });
    return;
  }
  uni.navigateTo({ url: "/pages/profile/profile" });
};
</script>
