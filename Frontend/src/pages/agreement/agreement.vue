<template>
  <scroll-view scroll-y class="app-page-shell h-screen">
    <view class="px-30rpx pb-50rpx pt-34rpx">
      <AppPageHeader class="-mx-30rpx -mt-34rpx" :title="document.title" />
      <view class="mt-22rpx rounded-18rpx bg-[#15161d] px-20rpx py-16rpx"><text class="text-22rpx text-[#9295a1]">版本 {{ remoteDocument?.version || legalMeta.version }} · 更新日期 {{ legalMeta.updatedAt }}</text></view>
      <view class="mt-24rpx"><text class="block text-23rpx leading-40rpx text-[#c2c4cc]">欢迎使用{{ appConfig.name }}。请在使用服务前仔细阅读以下内容。</text><text v-if="remoteDocument" class="mt-24rpx block whitespace-pre-wrap text-23rpx leading-42rpx text-[#b8bac4]">{{ remoteDocument.content }}</text><view v-else v-for="section in document.sections" :key="section.title" class="mt-28rpx"><text class="block text-28rpx font-700">{{ section.title }}</text><text class="mt-12rpx block text-23rpx leading-42rpx text-[#b8bac4]">{{ section.content }}</text></view></view>
    </view>
  </scroll-view>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import AppPageHeader from "../../components/common/AppPageHeader.vue";
import { onLoad } from "@dcloudio/uni-app";
import appConfig from "../../config/app.json";
import { legalDocuments, legalMeta } from "../../config/legal";
import { appApi } from "../../services/api";
type LegalType = keyof typeof legalDocuments;
const type = ref<LegalType>("user");
const remoteDocument = ref<any>();
const document = computed(() => legalDocuments[type.value]);
onLoad(async (query) => {
  if (query?.type === "privacy") type.value = "privacy";
  try { remoteDocument.value = await appApi.document(type.value === "privacy" ? "PRIVACY_POLICY" : "USER_AGREEMENT"); } catch { /* 尚未发布时显示内置兜底文案。 */ }
});
</script>
