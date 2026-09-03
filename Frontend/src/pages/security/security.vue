<template>
  <scroll-view scroll-y class="app-page-shell h-screen">
    <AppPageHeader title="账户安全" />
    <view class="px-30rpx pb-50rpx pt-20rpx">
      <text class="mb-14rpx block text-22rpx text-[#9295a1]">登录与验证</text>
      <view class="overflow-hidden rounded-22rpx bg-[#15161d] px-22rpx">
        <view v-for="(item, index) in loginItems" :key="item.key" class="flex items-center py-24rpx" :class="index < loginItems.length - 1 ? 'border-b border-white/10' : ''" @click="openEditor(item.key)">
          <view class="flex h-58rpx w-58rpx items-center justify-center rounded-16rpx bg-[#292817]"><up-icon :name="item.icon" size="23" color="#ffc400" /></view>
          <view class="ml-18rpx min-w-0 flex-1"><text class="block text-26rpx font-600">{{ item.title }}</text><text class="mt-8rpx block truncate text-22rpx text-[#9295a1]">{{ item.subtitle }}</text></view>
          <up-icon name="arrow-right" size="15" color="#7c7f8a" />
        </view>
      </view>

      <text class="mb-14rpx mt-30rpx block text-22rpx text-[#9295a1]">收款账户</text>
      <view class="overflow-hidden rounded-22rpx bg-[#15161d] px-22rpx">
        <view class="flex items-center py-24rpx" @click="openEditor('alipay')">
          <view class="flex h-58rpx w-58rpx items-center justify-center rounded-16rpx bg-[#14263b]"><up-icon name="rmb-circle" size="23" color="#4aa3ff" /></view>
          <view class="ml-18rpx min-w-0 flex-1"><text class="block text-26rpx font-600">支付宝账号</text><text class="mt-8rpx block truncate text-22rpx text-[#9295a1]">{{ alipaySummary }}</text></view>
          <up-tag v-if="user.alipayAccount" text="已绑定" type="success" size="mini" plain />
          <up-icon class="ml-12rpx" name="arrow-right" size="15" color="#7c7f8a" />
        </view>
      </view>
      <view class="mt-22rpx rounded-18rpx bg-[#12131a] p-20rpx"><text class="text-21rpx leading-34rpx text-[#9295a1]">支付宝账号用于后续收益提现。正式版本需由服务端完成账号校验与实名验证。</text></view>
    </view>

    <up-popup :show="popupVisible" mode="bottom" :round="24" bg-color="#17181f" :closeable="true" @close="closeEditor">
      <view class="px-30rpx pb-50rpx pt-40rpx text-white">
        <text class="block text-32rpx font-800">{{ popupTitle }}</text>
        <template v-if="activeEditor === 'password'">
          <FormField label="旧密码"><up-input v-model="form.oldPassword" type="password" placeholder="请输入旧密码" color="#f5f5f7" border="surround" /></FormField>
          <FormField label="新密码"><up-input v-model="form.newPassword" type="password" placeholder="请输入6-20位新密码" color="#f5f5f7" border="surround" /></FormField>
        </template>
        <template v-else-if="activeEditor === 'phone'">
          <FormField label="新手机号"><up-input v-model="form.phone" type="number" maxlength="11" placeholder="请输入新手机号" color="#f5f5f7" border="surround" /></FormField>
          <FormField label="短信验证码"><up-input v-model="form.code" type="number" maxlength="6" placeholder="演示验证码：123456" color="#f5f5f7" border="surround" /></FormField>
        </template>
        <template v-else-if="activeEditor === 'question'">
          <FormField label="安全问题"><up-input v-model="form.question" placeholder="例如：我的出生城市？" color="#f5f5f7" border="surround" /></FormField>
          <FormField label="问题答案"><up-input v-model="form.answer" placeholder="请输入答案" color="#f5f5f7" border="surround" /></FormField>
        </template>
        <template v-else>
          <FormField label="支付宝名称"><up-input v-model="form.alipayName" maxlength="30" placeholder="请输入支付宝实名认证姓名" color="#f5f5f7" border="surround" /></FormField>
          <FormField label="支付宝账号"><up-input v-model="form.alipayAccount" maxlength="50" placeholder="请输入手机号或邮箱账号" color="#f5f5f7" border="surround" /></FormField>
          <text class="mt-14rpx block text-21rpx leading-32rpx text-[#9295a1]">请确认姓名与支付宝实名认证信息一致，避免提现失败。</text>
        </template>
        <up-button class="mt-30rpx" text="确认保存" shape="circle" color="#ffc400" @click="save" />
      </view>
    </up-popup>
  </scroll-view>
</template>

<script setup lang="ts">
import AppPageHeader from "../../components/common/AppPageHeader.vue";
import FormField from "../../components/common/FormField.vue";
import { useAccountSecurity } from "../../composables/useAccountSecurity";
const { user, popupVisible, activeEditor, form, alipaySummary, loginItems, popupTitle, openEditor, closeEditor, save } = useAccountSecurity();
</script>
