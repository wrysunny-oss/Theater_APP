<template>
  <scroll-view scroll-y class="app-page-shell h-screen">
    <AppPageHeader title="金币提现" />
    <view class="px-28rpx pb-60rpx pt-24rpx">
      <view class="rounded-22rpx bg-[#15161d] p-24rpx">
        <text class="text-28rpx font-700">申请提现</text>
        <text class="mt-10rpx block text-22rpx text-[#9295a1]">可用 {{ balance }} 金币，{{ config.coinsPerCent }} 金币兑换 0.01 元</text>
        <view class="mt-20rpx"><up-input v-model="form.coins" type="number" placeholder="提现金币" /></view>
        <view class="mt-16rpx flex items-center justify-between rounded-16rpx bg-[#202129] px-20rpx py-18rpx" @click="goBindAccount">
          <view><text class="block text-24rpx">收款账户</text><text class="mt-6rpx block text-21rpx text-[#9295a1]">{{ payoutAccount.bound ? `${channelText[payoutAccount.channel || 'ALIPAY']} · ${payoutAccount.accountMasked}` : '尚未绑定，点击前往设置' }}</text></view>
          <up-icon name="arrow-right" size="16" color="#7c7f8a" />
        </view>
        <up-button class="mt-22rpx" color="#ffc400" shape="circle" :loading="submitting" text="提交提现申请" @click="submit" />
      </view>
      <view class="mt-24rpx rounded-22rpx bg-[#15161d] p-24rpx">
        <text class="text-28rpx font-700">提现记录</text>
        <view v-for="item in records" :key="item.id" class="border-b border-white/10 py-18rpx">
          <view class="flex justify-between"><text>{{ item.coins }} 金币</text><text class="text-[#ffc400]">{{ statusText[item.status] || item.status }}</text></view>
          <text class="mt-8rpx block text-21rpx text-[#9295a1]">到账 ¥{{ (item.actualCents / 100).toFixed(2) }} · {{ item.accountMasked }}</text>
        </view>
        <text v-if="!records.length" class="mt-18rpx block text-22rpx text-[#9295a1]">暂无提现记录</text>
      </view>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import AppPageHeader from "../../components/common/AppPageHeader.vue";
import { appApi, hasRemoteSession } from "../../services/api";
import { ensureRiskAssessment } from "../../services/risk-assessment";

const config = ref<any>({ coinsPerCent: 100, minCoins: "10000", maxCoins: "1000000" });
const balance = ref("0"); const records = ref<any[]>([]); const submitting = ref(false);
const payoutAccount = ref<{ accountMasked?: string; bound: boolean; channel?: "ALIPAY" | "BANK" | "WECHAT" }>({ bound: false });
const form = reactive({ coins: "" });
const channelText = { ALIPAY: "支付宝", WECHAT: "微信", BANK: "银行卡" };
const statusText: Record<string, string> = { PENDING: "待审核", PAYING: "打款中", COMPLETED: "已完成", REJECTED: "已拒绝", FAILED: "打款失败" };
async function load() {
  if (!hasRemoteSession()) return void uni.redirectTo({ url: "/pages/auth/auth" });
  try { const [rule, mine, me, account] = await Promise.all([appApi.withdrawalConfig(), appApi.withdrawals(), appApi.me(), appApi.payoutAccount()]); config.value = rule; records.value = mine.list; balance.value = me.coinBalance; payoutAccount.value = account; }
  catch (error) { uni.showToast({ title: error instanceof Error ? error.message : "加载失败", icon: "none" }); }
}
async function submit() {
  if (!form.coins) return void uni.showToast({ title: "请输入提现金币", icon: "none" });
  if (!payoutAccount.value.bound) return void uni.showModal({ title: "尚未绑定收款账户", content: "请先前往设置绑定支付宝账户，再提交提现申请。", confirmText: "去绑定", success: ({ confirm }) => { if (confirm) goBindAccount(); } });
  submitting.value = true;
  try {
    await ensureRiskAssessment("withdrawal");
    await appApi.createWithdrawal({ requestId: crypto.randomUUID(), coins: form.coins });
    uni.showToast({ title: "提现申请已提交", icon: "success" }); form.coins = ""; await load();
  } catch (error) { uni.showToast({ title: error instanceof Error ? error.message : "提交失败", icon: "none" }); }
  finally { submitting.value = false; }
}
const goBindAccount = () => uni.navigateTo({ url: "/pages/security/security?editor=alipay" });
onShow(load);
</script>
