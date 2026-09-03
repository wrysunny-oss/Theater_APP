<template>
  <scroll-view scroll-y class="h-screen bg-[#090a0f] text-white"><AppPageHeader title="个人资料" /><view class="px-30rpx pb-50rpx pt-24rpx">
    <view class="flex flex-col items-center"><view class="flex h-132rpx w-132rpx items-center justify-center overflow-hidden rounded-full border-3rpx border-[#ffc400] bg-[#30280b]" @click="chooseAvatar"><up-image v-if="form.avatar" width="100%" height="100%" shape="circle" mode="aspectFill" :src="form.avatar" /><up-icon v-else name="camera-fill" size="34" color="#ffc400" /></view><text class="mt-14rpx text-22rpx text-[#ffc400]" @click="chooseAvatar">从相册选择或拍照</text></view>
    <view class="mt-32rpx"><text class="mb-10rpx block text-23rpx text-[#b8bac4]">昵称</text><up-input v-model="form.nickname" maxlength="16" placeholder="请输入昵称" color="#f5f5f7" border="surround" /></view>
    <view class="mt-22rpx"><text class="mb-12rpx block text-23rpx text-[#b8bac4]">性别</text><view class="flex gap-14rpx"><view v-for="item in genders" :key="item.value" class="rounded-full px-24rpx py-12rpx text-23rpx" :style="genderStyle(item.value)" @click="form.gender = item.value">{{ item.label }}</view></view></view>
    <view class="mt-22rpx"><text class="mb-10rpx block text-23rpx text-[#b8bac4]">生日</text><up-input v-model="form.birthday" placeholder="例如：1998-08-18" color="#f5f5f7" border="surround" /></view>
    <view class="mt-22rpx"><text class="mb-10rpx block text-23rpx text-[#b8bac4]">个人简介</text><up-textarea v-model="form.bio" maxlength="80" count placeholder="介绍一下自己" height="110" border="surround" /></view>
    <up-button class="mt-34rpx" text="保存资料" shape="circle" color="#ffc400" @click="save" />
  </view></scroll-view>
</template>
<script setup lang="ts">
import { reactive } from "vue";
import AppPageHeader from "../../components/common/AppPageHeader.vue";
import { getLocalUser, updateLocalUser, type LocalUser } from "../../services/user";
const user = getLocalUser(); const form = reactive({ nickname: user.nickname, avatar: user.avatar, gender: user.gender, birthday: user.birthday, bio: user.bio });
const genders: { label: string; value: LocalUser["gender"] }[] = [{ label: "保密", value: "unknown" }, { label: "男", value: "male" }, { label: "女", value: "female" }];
const genderStyle = (value: LocalUser["gender"]) => form.gender === value ? { backgroundColor: "#ffc400", color: "#171717" } : { backgroundColor: "#24252d", color: "#9295a1" };
const chooseAvatar = () => uni.chooseImage({ count: 1, sourceType: ["album", "camera"], sizeType: ["compressed"], success: ({ tempFilePaths }) => { form.avatar = tempFilePaths[0] || ""; } });
const save = () => { if (!form.nickname.trim()) return void uni.showToast({ title: "昵称不能为空", icon: "none" }); updateLocalUser({ ...form, nickname: form.nickname.trim() }); uni.showToast({ title: "保存成功", icon: "success" }); setTimeout(() => uni.navigateBack(), 400); };
</script>
