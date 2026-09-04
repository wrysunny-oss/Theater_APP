<template>
  <scroll-view scroll-y class="app-page-shell h-screen"><AppPageHeader :title="mode === 'reset' ? '重置密码' : '登录注册'" /><view class="px-38rpx pb-50rpx pt-32rpx">
    <view class="text-center"><view class="mx-auto flex h-112rpx w-112rpx items-center justify-center rounded-30rpx bg-[#ffc400]"><text class="text-48rpx font-900 text-[#171717]">幻</text></view><text class="mt-22rpx block text-38rpx font-800">{{ mode === 'reset' ? '找回账号密码' : `欢迎来到${appConfig.name}` }}</text><text class="mt-12rpx block text-23rpx text-[#9295a1]">{{ mode === 'reset' ? '验证手机号后设置新密码' : '登录后使用完整的任务和收益功能' }}</text></view>
    <view v-if="mode !== 'reset'" class="mt-38rpx"><up-tabs :list="authTabs" :current="modeIndex" line-color="#ffc400" active-style="color:#f5f5f7;font-size:30rpx;font-weight:700" inactive-style="color:#9295a1;font-size:27rpx" @click="changeMode" /></view>
    <view v-if="false" />
    <view class="mt-28rpx"><text class="mb-12rpx block text-23rpx text-[#b8bac4]">手机号</text><up-input v-model="form.phone" type="number" maxlength="11" placeholder="请输入11位手机号" prefix-icon="phone" color="#f5f5f7" border="surround" /></view>
    <view v-if="mode === 'login' || mode === 'register'" class="mt-22rpx"><text class="mb-12rpx block text-23rpx text-[#b8bac4]">密码</text><up-input v-model="form.password" type="password" placeholder="请输入至少8位密码" prefix-icon="lock" color="#f5f5f7" border="surround" /></view>
    <view v-if="mode === 'register'" class="mt-22rpx"><text class="mb-12rpx block text-23rpx text-[#b8bac4]">昵称</text><up-input v-model="form.nickname" maxlength="16" placeholder="请输入昵称" prefix-icon="account" color="#f5f5f7" border="surround" /></view>
    <view v-if="mode === 'register'" class="mt-22rpx"><text class="mb-12rpx block text-23rpx text-[#b8bac4]">邀请码（必填）</text><up-input v-model="form.inviteCode" maxlength="12" placeholder="请输入 6-12 位邀请码" prefix-icon="coupon" color="#f5f5f7" border="surround" /></view>
    <view v-if="mode === 'reset'" class="mt-22rpx"><text class="mb-12rpx block text-23rpx text-[#b8bac4]">新密码</text><up-input v-model="form.password" type="password" placeholder="请输入6-20位新密码" prefix-icon="lock" color="#f5f5f7" border="surround" /></view>
    <view v-if="mode !== 'reset'" class="mt-24rpx flex items-start gap-12rpx"><up-checkbox-group v-model="agreement"><up-checkbox name="accepted" shape="circle" active-color="#ffc400" /></up-checkbox-group><text class="text-22rpx leading-34rpx text-[#9295a1]">我已阅读并同意 <text class="text-[#ffc400]" @click="openAgreement('user')">《用户协议》</text> 和 <text class="text-[#ffc400]" @click="openAgreement('privacy')">《隐私政策》</text></text></view>
    <text v-if="mode === 'login' && loginMethod === 'password'" class="mt-20rpx block text-right text-22rpx text-[#ffc400]" @click="mode = 'reset'">忘记密码？</text>
    <up-button class="mt-32rpx" :text="buttonText" shape="circle" color="#ffc400" :loading="submitting" :disabled="submitting" @click="submit" />
    <text v-if="mode === 'reset'" class="mt-22rpx block text-center text-23rpx text-[#ffc400]" @click="mode = 'login'">返回登录</text><text class="mt-20rpx block text-center text-22rpx text-[#696c77]">演示验证码为123456，默认密码为123456</text>
  </view></scroll-view>
</template>
<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import AppPageHeader from "../../components/common/AppPageHeader.vue";
import appConfig from "../../config/app.json";
import { saveRemoteUser } from "../../services/user";
import { appApi, saveTokens } from "../../services/api";
type AuthMode = "login" | "register" | "reset"; type LoginMethod = "code" | "password";
const mode = ref<AuthMode>("login"); const loginMethod = ref<LoginMethod>("code"); const agreement = ref<string[]>([]);
const form = reactive({ phone: "", code: "", nickname: "", password: "", inviteCode: "" }); const submitting = ref(false);
const authTabs = [{ name: "手机号登录", value: "login" }, { name: "新用户注册", value: "register" }]; const loginMethods: { label: string; value: LoginMethod }[] = [{ label: "验证码登录", value: "code" }, { label: "密码登录", value: "password" }];
const modeIndex = computed(() => mode.value === "register" ? 1 : 0);
const buttonText = computed(() => submitting.value ? "处理中..." : mode.value === "register" ? "注册并登录" : mode.value === "reset" ? "确认重置" : "登录");
const methodStyle = (value: LoginMethod) => loginMethod.value === value ? { backgroundColor: "#ffc400", color: "#171717" } : { backgroundColor: "#24252d", color: "#9295a1" };
const changeMode = (item: { value: AuthMode }) => { mode.value = item.value; form.code = ""; form.password = ""; };
const submit = async () => {
  if (!/^1\d{10}$/.test(form.phone)) return void uni.showToast({ title: "请输入正确的手机号", icon: "none" });
  if (form.password.length < 8) return void uni.showToast({ title: "密码至少8位", icon: "none" });
  if (mode.value === "register" && !form.nickname.trim()) return void uni.showToast({ title: "请输入昵称", icon: "none" });
  if (mode.value === "register" && !/^[A-Za-z0-9]{6,12}$/.test(form.inviteCode.trim())) return void uni.showToast({ title: "请输入有效邀请码", icon: "none" });
  if (!agreement.value.includes("accepted")) return void uni.showToast({ title: "请先同意相关协议", icon: "none" });
  submitting.value = true;
  try {
    const result = mode.value === "register"
      ? await appApi.register({ phone: form.phone, password: form.password, nickname: form.nickname.trim(), inviteCode: form.inviteCode.trim().toUpperCase() })
      : await appApi.login(form.phone, form.password);
    saveTokens(result); saveRemoteUser(result.user); finish(mode.value === "register" ? "注册成功" : "登录成功");
  } catch (error) { submitting.value = false; uni.showToast({ title: error instanceof Error ? error.message : "请求失败", icon: "none" }); }
};
const finish = (title: string) => { submitting.value = true; setTimeout(() => { submitting.value = false; uni.showToast({ title, icon: "success" }); setTimeout(() => uni.reLaunch({ url: "/pages/index/index" }), 400); }, 400); };
const openAgreement = (type: "user" | "privacy") => uni.navigateTo({ url: `/pages/agreement/agreement?type=${type}` });
onLoad((options) => { if (typeof options?.inviteCode === "string") { form.inviteCode = options.inviteCode.toUpperCase(); mode.value = "register"; } });
</script>
