<template>
  <scroll-view scroll-y class="app-page-shell h-screen">
    <AppPageHeader title="邀请好友" />
    <view class="px-30rpx pb-60rpx pt-20rpx">
      <view class="overflow-hidden rounded-32rpx bg-gradient-to-br from-[#ffe26b] via-[#ffc400] to-[#f29b00] p-34rpx text-[#17140a] shadow-[0_18rpx_48rpx_rgba(255,196,0,0.18)]">
        <view class="flex items-center justify-between">
          <view>
            <text class="block text-42rpx font-900">邀请好友 一起追剧</text>
            <text class="mt-10rpx block text-23rpx opacity-70">好友扫码或填写邀请码即可加入</text>
          </view>
          <up-icon name="gift-fill" size="48" color="#17140a" />
        </view>

        <view class="mt-34rpx rounded-28rpx bg-white p-30rpx text-center shadow-sm">
          <text class="block text-22rpx text-[#77736a]">我的邀请码</text>
          <text class="mt-8rpx block text-52rpx font-900 tracking-[8rpx] text-[#17140a]">{{ inviteCode }}</text>
          <view class="mx-auto mt-18rpx h-1rpx w-100rpx bg-[#ece8dc]" />
          <view class="mt-24rpx flex justify-center">
            <view class="rounded-20rpx bg-white p-14rpx shadow-[0_5rpx_22rpx_rgba(0,0,0,0.12)]">
              <up-qrcode cid="invite-qrcode" :val="inviteLink" :size="210" :quiet-zone="3" background="#ffffff" foreground="#101114" pdground="#ffc400" />
            </view>
          </view>
          <text class="mt-20rpx block text-22rpx text-[#77736a]">扫一扫二维码，加入幻乐剧场</text>
        </view>
      </view>

      <view class="mt-28rpx rounded-24rpx bg-[#15161d] px-24rpx">
        <view class="flex items-center border-b border-white/10 py-24rpx" @click="editInviteCode">
          <view class="flex h-58rpx w-58rpx items-center justify-center rounded-16rpx bg-[#292817]"><up-icon name="edit-pen" size="23" color="#ffc400" /></view>
          <view class="ml-18rpx flex-1"><text class="block text-26rpx font-600">修改邀请码</text><text class="mt-7rpx block text-21rpx text-[#9295a1]">6-12 位字母或数字</text></view>
          <up-icon name="arrow-right" size="15" color="#7c7f8a" />
        </view>
        <view class="flex items-center border-b border-white/10 py-24rpx" @click="copy(inviteCode, '邀请码已复制')">
          <view class="flex h-58rpx w-58rpx items-center justify-center rounded-16rpx bg-[#292817]"><up-icon name="coupon" size="23" color="#ffc400" /></view>
          <view class="ml-18rpx flex-1"><text class="block text-26rpx font-600">复制邀请码</text><text class="mt-7rpx block text-21rpx text-[#9295a1]">{{ inviteCode }}</text></view>
          <up-icon name="arrow-right" size="15" color="#7c7f8a" />
        </view>
        <view class="flex items-center py-24rpx" @click="copy(inviteLink, '邀请链接已复制')">
          <view class="flex h-58rpx w-58rpx items-center justify-center rounded-16rpx bg-[#292817]"><up-icon name="share" size="23" color="#ffc400" /></view>
          <view class="ml-18rpx min-w-0 flex-1"><text class="block text-26rpx font-600">复制邀请链接</text><text class="mt-7rpx block truncate text-21rpx text-[#9295a1]">{{ inviteLink }}</text></view>
          <up-icon name="arrow-right" size="15" color="#7c7f8a" />
        </view>
      </view>

      <!-- #ifdef MP-WEIXIN -->
      <button class="mt-28rpx flex h-88rpx items-center justify-center rounded-full border-0 bg-[#ffc400] text-28rpx font-700 text-[#17140a] after:border-0" open-type="share">
        <up-icon class="mr-12rpx" name="weixin-fill" size="22" color="#17140a" />微信分享给好友
      </button>
      <!-- #endif -->

      <view class="mt-30rpx rounded-22rpx bg-[#12131a] p-24rpx">
        <text class="block text-26rpx font-700 text-[#f2f2f4]">邀请说明</text>
        <text class="mt-15rpx block text-22rpx leading-38rpx text-[#9295a1]">1. 好友可扫描二维码或复制邀请码加入。\n2. 邀请关系与奖励将在接入后端接口后正式生效。\n3. 请勿通过非正常方式批量注册账号。</text>
      </view>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShareAppMessage, onShow } from "@dcloudio/uni-app";
import AppPageHeader from "../../components/common/AppPageHeader.vue";
import appConfig from "../../config/app.json";
import { getLocalUser } from "../../services/user";
import { appApi, hasRemoteSession } from "../../services/api";

const user = getLocalUser();

const serverInviteCode = ref("");
const inviteCode = computed(() => serverInviteCode.value || (user.phone ? `HL${user.phone.slice(-6)}` : "HL888888"));
const inviteLink = computed(() => `https://hly.example.com/invite?code=${inviteCode.value}`);

const copy = (data: string, title: string) => {
  uni.setClipboardData({ data, success: () => uni.showToast({ title, icon: "success" }) });
};

/** 弹出可编辑输入框并由后端校验格式及唯一性。 */
const editInviteCode = () => {
  if (!hasRemoteSession()) return uni.showToast({ title: "请先登录", icon: "none" });
  uni.showModal({
    title: "修改邀请码",
    content: inviteCode.value,
    editable: true,
    placeholderText: "请输入 6-12 位字母或数字",
    success: async ({ confirm, content }) => {
      if (!confirm) return;
      const code = (content || "").trim().toUpperCase();
      if (!/^[A-Z0-9]{6,12}$/.test(code)) return uni.showToast({ title: "请输入 6-12 位字母或数字", icon: "none" });
      try {
        serverInviteCode.value = (await appApi.updateInviteCode(code)).inviteCode;
        uni.showToast({ title: "修改成功", icon: "success" });
      } catch (error) {
        uni.showToast({ title: error instanceof Error ? error.message : "修改失败", icon: "none" });
      }
    },
  });
};
onShow(async () => { if (hasRemoteSession()) try { serverInviteCode.value = (await appApi.rewardCenter()).inviteCode; } catch {} });

onShareAppMessage(() => ({
  title: `我在${appConfig.name}发现了好多精彩短剧，快来一起看！`,
  path: `/pages/index/index?inviteCode=${inviteCode.value}`,
}));
</script>
