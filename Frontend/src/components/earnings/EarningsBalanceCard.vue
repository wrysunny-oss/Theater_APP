<template>
  <view
    class="mt-28rpx rounded-26rpx bg-gradient-to-br from-[#3b3006] to-[#17160f] p-28rpx"
    ><text class="text-23rpx text-[#b9aa75]">可用金币</text
    ><text class="my-18rpx block text-64rpx font-800 text-[#ffc400]">{{
      balance
    }}</text
    ><view class="flex items-center justify-between"
      ><text class="text-22rpx text-[#a6a8b2]">约 ¥{{ cashValue }}</text>
      <view>
        <up-button
          text="提现"
          size="small"
          shape="circle"
          color="#ffc400"
          @click="$emit('withdraw')"
        />
      </view> </view
  ></view>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ balance?: number; cashValue?: string }>(), {
  balance: 0,
  cashValue: "0.00",
});
defineEmits<{ withdraw: [] }>();
</script>
