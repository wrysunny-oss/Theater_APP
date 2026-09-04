<template>
  <view class="overflow-hidden rounded-22rpx bg-[#15161d] px-22rpx">
    <view v-for="record in records" :key="record.id" class="flex items-center justify-between border-b border-white/10 py-22rpx">
      <view><view class="flex items-center gap-10rpx"><text class="text-26rpx">{{ record.title }}</text><up-tag :text="categoryName(record.category)" size="mini" plain type="warning" /></view><text class="mt-8rpx block text-20rpx text-[#9295a1]">{{ record.createdAt }}</text></view>
      <text
        class="text-28rpx font-700"
        :style="{ color: Number(record.amount) < 0 ? '#ff6677' : '#ffc400' }"
      >{{ formatAmount(record.amount) }}</text>
    </view>
    <up-loadmore :status="hasMore ? 'loadmore' : 'nomore'" loadmore-text="继续上滑加载" nomore-text="没有更多记录" color="#9295a1" />
  </view>
</template>
<script setup lang="ts">
import type { RewardCategory, RewardLedgerItem } from "../../services/reward";
withDefaults(defineProps<{ records?: RewardLedgerItem[]; hasMore?: boolean }>(), { records: () => [], hasMore: false });

/** 金币收入显示加号，支出沿用自身负号，避免出现 `+-100`。 */
const formatAmount = (amount: number) => amount > 0 ? `+${amount}` : `${amount}`;
const categoryName = (category: RewardCategory) => ({ signin: "签到", task: "任务", ad: "广告", share: "分享", withdraw: "提现" })[category];
</script>
