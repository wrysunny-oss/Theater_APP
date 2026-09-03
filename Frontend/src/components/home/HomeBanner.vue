<template>
  <view class="mt-24rpx overflow-hidden rounded-24rpx">
    <up-swiper :list="banners" key-name="image" height="160" autoplay circular :indicator="false" bg-color="transparent" @click="selectBanner">
      <template #default="slot">
        <view class="relative h-full w-full overflow-hidden rounded-24rpx">
          <up-image width="100%" height="100%" mode="aspectFill" :src="slot.item.image" /><view class="banner-mask absolute inset-0" />
          <view class="absolute bottom-22rpx left-20rpx right-20rpx z-2"><view class="mb-10rpx flex items-center gap-10rpx"><up-tag :text="slot.item.tag" type="error" size="mini" /><text class="text-22rpx text-[#d7d7da]">{{ slot.item.eyebrow }}</text></view><text class="block text-28rpx font-700 text-white">{{ slot.item.title }}</text></view>
          <view class="absolute right-18rpx top-18rpx z-2 flex items-center rounded-full bg-black/65 px-16rpx py-8rpx"><up-icon name="play-right-fill" size="13" color="#ffc400" /><text class="ml-6rpx text-22rpx text-white">立即观看</text></view>
        </view>
      </template>
    </up-swiper>
  </view>
</template>
<script setup lang="ts">
interface BannerItem { id: number; tag: string; eyebrow: string; title: string; image: string }
const props = withDefaults(defineProps<{ banners?: BannerItem[] }>(), { banners: () => [] });
const emit = defineEmits<{ select: [id: number] }>();
// uView swiper 的点击事件返回当前索引，再由组件转换成业务 id。
const selectBanner = (index: number) => { const item = props.banners[index]; if (item) emit("select", item.id); };
</script>
<style scoped>
.banner-mask { background: linear-gradient(180deg, transparent 35%, rgba(0,0,0,.88)); }
:deep(.up-swiper),
:deep(.up-swiper__wrapper),
:deep(.up-swiper__wrapper__item),
:deep(.u-image),
:deep(.u-image__image) { background-color: transparent !important; }
</style>
