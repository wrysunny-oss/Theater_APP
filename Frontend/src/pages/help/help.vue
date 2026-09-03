<template>
  <scroll-view scroll-y class="app-page-shell h-screen">
    <view class="px-28rpx pb-48rpx pt-34rpx">
      <AppPageHeader class="-mx-28rpx -mt-34rpx" title="帮助与反馈" />
      <view class="mt-28rpx rounded-22rpx bg-[#15161d] p-22rpx"><view class="mb-18rpx flex items-center gap-10rpx"><up-icon name="question-circle" size="23" color="#ffc400" /><text class="text-29rpx font-700">常见问题</text></view><up-collapse :border="false"><up-collapse-item v-for="faq in faqs" :key="faq.title" :cell-custom-style="collapseCellStyle"><template #title><text class="text-25rpx font-600 text-[#f5f5f7]">{{ faq.title }}</text></template><template #right-icon><up-icon name="arrow-down" size="16" color="#a6a8b2" /></template><text class="block pb-18rpx text-22rpx leading-36rpx text-[#b8bac4]">{{ faq.content }}</text></up-collapse-item></up-collapse></view>

      <view class="mt-24rpx rounded-22rpx bg-[#15161d] p-22rpx"><text class="text-29rpx font-700">提交反馈</text><text class="mt-9rpx block text-22rpx text-[#9295a1]">你的建议会帮助我们持续改善体验</text>
        <view class="mt-22rpx flex flex-wrap gap-12rpx"><view v-for="type in feedbackTypes" :key="type" class="rounded-full px-20rpx py-11rpx text-22rpx" :style="typeStyle(type)" @click="form.type = type">{{ type }}</view></view>
        <view class="mt-20rpx"><up-textarea v-model="form.content" placeholder="请详细描述遇到的问题或建议（至少5个字）" maxlength="300" count height="120" border="surround" /></view>
        <view class="mt-18rpx"><up-input v-model="form.contact" placeholder="手机号或邮箱（选填）" border="surround" color="#ffffff" /></view>
        <up-button class="mt-22rpx" text="提交反馈" shape="circle" color="#ffc400" @click="submit" />
      </view>

      <view v-if="records.length" class="mt-24rpx rounded-22rpx bg-[#15161d] p-22rpx"><text class="text-29rpx font-700">我的反馈</text><view v-for="item in records" :key="item.id" class="border-b border-white/10 py-20rpx"><view class="flex justify-between"><text class="text-24rpx font-700">{{ item.type }}</text><up-tag :text="item.status === 'pending' ? '待处理' : '已处理'" :type="item.status === 'pending' ? 'warning' : 'success'" size="mini" plain /></view><text class="mt-10rpx block text-22rpx leading-34rpx text-[#b8bac4]">{{ item.content }}</text><text class="mt-8rpx block text-20rpx text-[#7c7f8a]">{{ item.createdAt }}</text></view></view>
    </view>
  </scroll-view>
</template>
<script setup lang="ts">
import { reactive, ref } from "vue";
import AppPageHeader from "../../components/common/AppPageHeader.vue";
import { getFeedbackList, submitFeedback } from "../../services/feedback";
const faqs = [
  { title: "如何获得金币？", content: "进入福利中心完成签到、观看、广告或分享任务，达到条件后点击领取即可获得金币。" },
  { title: "为什么任务进度每天会重置？", content: "日常任务按自然日统计，每天00:00自动重置；连续签到天数不会随日常进度一起清空。" },
  { title: "金币可以提现吗？", content: "当前版本为纯前端演示，提现功能尚未开放，不涉及真实资金结算。" },
  { title: "如何修改昵称和头像？", content: "进入“我的”，点击个人资料卡右侧的编辑按钮即可修改。" },
];
const feedbackTypes = ["功能建议", "使用问题", "内容问题", "其他"];
const form = reactive({ type: "功能建议", content: "", contact: "" });
const records = ref(getFeedbackList());
const collapseCellStyle = { backgroundColor: "transparent", color: "#f5f5f7" };
const typeStyle = (type: string) => form.type === type ? { backgroundColor: "#ffc400", color: "#171717" } : { backgroundColor: "#24252d", color: "#a6a8b2" };
const submit = () => {
  const content = form.content.trim();
  if (content.length < 5) return void uni.showToast({ title: "反馈内容至少5个字", icon: "none" });
  records.value = submitFeedback({ type: form.type, content, contact: form.contact.trim() });
  form.content = ""; form.contact = "";
  uni.showToast({ title: "提交成功", icon: "success" });
};
</script>
