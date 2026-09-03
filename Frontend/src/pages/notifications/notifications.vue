<template>
  <scroll-view scroll-y class="h-screen bg-[#090a0f] text-white">
    <view class="px-28rpx pb-40rpx pt-34rpx">
      <AppPageHeader class="-mx-28rpx -mt-34rpx" title="通知中心"><template #right><text v-if="unreadCount" class="text-23rpx text-[#ffc400]" @click.stop="readAll">全部已读</text></template></AppPageHeader>
      <view class="mt-28rpx flex gap-14rpx"><view v-for="tab in tabs" :key="tab.value" class="rounded-full px-22rpx py-12rpx text-23rpx" :style="tabStyle(tab.value)" @click="activeType = tab.value">{{ tab.label }}</view></view>
      <view v-if="filteredList.length" class="mt-24rpx overflow-hidden rounded-22rpx bg-[#15161d] px-22rpx">
        <view v-for="item in filteredList" :key="item.id" class="relative border-b border-white/10 py-24rpx" @click="read(item.id)">
          <view class="flex items-start gap-16rpx"><view class="mt-4rpx flex h-58rpx w-58rpx shrink-0 items-center justify-center rounded-16rpx bg-[#2d270d]"><up-icon :name="typeIcon(item.type)" size="23" color="#ffc400" /></view><view class="min-w-0 flex-1"><view class="flex items-center"><view v-if="!item.read" class="mr-10rpx h-10rpx w-10rpx rounded-full bg-[#ff4d67]" /><text class="text-27rpx font-700">{{ item.title }}</text></view><text class="mt-10rpx block text-22rpx leading-34rpx text-[#b8bac4]">{{ item.content }}</text><text class="mt-12rpx block text-20rpx text-[#7c7f8a]">{{ item.createdAt }}</text></view><up-icon name="trash" size="19" color="#7c7f8a" @click.stop="remove(item.id)" /></view>
        </view>
      </view>
      <PageState v-else status="empty" title="暂无通知" description="新的系统和奖励消息会显示在这里" />
    </view>
  </scroll-view>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import AppPageHeader from "../../components/common/AppPageHeader.vue";
import PageState from "../../components/common/PageState.vue";
import { getNotifications, markAllNotificationsRead, markNotificationRead, removeNotification, type LocalNotification } from "../../services/notification";
import { useConfirmAction } from "../../composables/useConfirmAction";
type FilterType = "all" | LocalNotification["type"];
const list = ref(getNotifications());
const activeType = ref<FilterType>("all");
const { confirmAction } = useConfirmAction();
const tabs: { label: string; value: FilterType }[] = [{ label: "全部", value: "all" }, { label: "系统", value: "system" }, { label: "奖励", value: "reward" }, { label: "活动", value: "activity" }];
const unreadCount = computed(() => list.value.filter((item) => !item.read).length);
const filteredList = computed(() => list.value.filter((item) => activeType.value === "all" || item.type === activeType.value));
const read = (id: number) => { list.value = markNotificationRead(id); };
const readAll = () => { list.value = markAllNotificationsRead(); };
const remove = (id: number) => confirmAction({ title: "删除通知", content: "删除后无法恢复，确定继续吗？" }, () => { list.value = removeNotification(id); });
const typeIcon = (type: LocalNotification["type"]) => ({ system: "bell", reward: "gift", activity: "star" })[type];
const tabStyle = (value: FilterType) => activeType.value === value ? { backgroundColor: "#ffc400", color: "#171717" } : { backgroundColor: "#1b1c25", color: "#a6a8b2" };
</script>
