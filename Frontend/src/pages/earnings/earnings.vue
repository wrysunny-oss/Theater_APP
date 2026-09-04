<template>
  <scroll-view
    scroll-y
    class="app-page-shell h-screen"
    @scrolltolower="showMore"
  >
    <view class="px-28rpx pb-150rpx pt-38rpx">
      <text class="block text-40rpx font-800">我的收益</text>
      <EarningsBalanceCard
        :balance="state.balance"
        :cash-value="cashValue"
        @withdraw="coming"
      />
      <EarningsStats :total="filteredTotal" :count="filteredRecords.length" />
      <view class="mt-30rpx"
        ><up-tabs
          :list="categoryTabs"
          :current="categoryIndex"
          line-color="#ffc400"
          active-style="color:#ffc400;font-weight:700"
          inactive-style="color:#9295a1"
          @click="selectCategory"
      /></view>
      <view class="mt-18rpx flex gap-12rpx"
        ><view
          v-for="range in ranges"
          :key="range.value"
          class="rounded-full border px-20rpx py-11rpx text-22rpx"
          :style="rangeStyle(range.value)"
          @click="selectRange(range.value)"
          >{{ range.label }}</view
        ></view
      >
      <view class="mb-18rpx mt-30rpx flex items-center justify-between"
        ><text class="text-30rpx font-700">金币明细</text
        ><text class="text-22rpx text-[#9295a1]">最近100条</text></view
      >
      <EarningsLedgerList
        v-if="visibleRecords.length"
        :records="visibleRecords"
        :has-more="hasMore"
      />
      <PageState
        v-else
        status="empty"
        title="暂无金币记录"
        description="完成任务并领取奖励后，明细会显示在这里"
      />
      <RewardRulesCard :rules="ruleItems" />
    </view>
    <BottomNav current="earn" />
  </scroll-view>
</template>

<script setup lang="ts">
import BottomNav from "../../components/home/BottomNav.vue";
import EarningsBalanceCard from "../../components/earnings/EarningsBalanceCard.vue";
import RewardRulesCard from "../../components/earnings/RewardRulesCard.vue";
import EarningsStats from "../../components/earnings/EarningsStats.vue";
import EarningsLedgerList from "../../components/earnings/EarningsLedgerList.vue";
import PageState from "../../components/common/PageState.vue";
import { rewardRules } from "../../config/reward";
import {
  categoryTabs,
  ranges,
  useEarningsLedger,
  type CategoryFilter,
  type RangeFilter,
} from "../../composables/useEarningsLedger";

const {
  state,
  activeRange,
  categoryIndex,
  filteredRecords,
  visibleRecords,
  filteredTotal,
  hasMore,
  cashValue,
  selectCategory,
  selectRange,
  rangeStyle,
  showMore,
} = useEarningsLedger();
const ruleItems = [
  { label: "兑换比例", value: `${rewardRules.coinsPerYuan}金币 = 1元` },
  { label: "最低提现", value: `${rewardRules.minimumWithdrawYuan}元` },
  { label: "每日提现", value: `${rewardRules.dailyWithdrawLimit}次` },
  { label: "有效期", value: rewardRules.validityText },
];

const coming = () => uni.navigateTo({ url: "/pages/withdrawal/withdrawal" });
</script>
