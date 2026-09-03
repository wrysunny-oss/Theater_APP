<template>
  <view
    class="pointer-events-none absolute inset-x-0 top-0 z-10 h-260rpx bg-gradient-to-b from-black/70 to-transparent"
  />
  <view
    class="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-560rpx bg-gradient-to-t from-black/90 via-black/40 to-transparent"
  />

  <view class="absolute inset-x-0 top-0 z-20">
    <up-status-bar />
    <view class="flex h-88rpx items-center px-26rpx">
      <view
        class="flex h-62rpx w-62rpx items-center justify-center rounded-full bg-black/35"
        @click="$emit('back')"
        ><up-icon name="arrow-left" size="23" color="#ffffff"
      /></view>
      <text class="ml-18rpx flex-1 truncate text-27rpx font-700"
        >第 {{ episode }} 集</text
      >
      <view
        class="rounded-full bg-black/35 px-18rpx py-10rpx"
        @click="$emit('episodes')"
        ><text class="text-21rpx">选集</text></view
      >
    </view>
  </view>

  <view
    v-if="!playing"
    class="pointer-events-none absolute inset-0 z-15 flex items-center justify-center"
  >
    <view
      class="flex h-116rpx w-116rpx items-center justify-center rounded-full bg-black/40 backdrop-blur"
      ><up-icon name="play-right-fill" size="42" color="#ffffff"
    /></view>
  </view>

  <view
    class="absolute bottom-250rpx right-24rpx z-20 flex flex-col items-center gap-30rpx"
  >
    <view class="flex flex-col items-center" @click="$emit('favorite')">
      <view
        class="flex h-82rpx w-82rpx items-center justify-center rounded-full bg-black/40"
        ><up-icon
          :name="favorite ? 'star-fill' : 'star'"
          size="31"
          :color="favorite ? '#ffc400' : '#ffffff'"
      /></view>
      <text class="mt-7rpx text-20rpx">{{ favorite ? "已收藏" : "收藏" }}</text>
    </view>
    <view class="flex flex-col items-center" @click="$emit('episodes')">
      <view
        class="flex h-82rpx w-82rpx items-center justify-center rounded-full bg-black/40"
        ><up-icon name="list-dot" size="30" color="#ffffff"
      /></view>
      <text class="mt-7rpx text-20rpx">{{ episodeCount }}集</text>
    </view>
  </view>

  <view
    class="w-full absolute bottom-0 left-0 right-112rpx z-20 px-28rpx pb-[calc(env(safe-area-inset-bottom)+34rpx)]"
  >
    <text class="block text-31rpx font-800 leading-42rpx">{{ title }}</text>
    <text
      class="mt-12rpx line-clamp-2 block text-22rpx leading-34rpx text-white/75"
      >{{ description }}</text
    >
    <view class="mt-18rpx flex items-center"
      ><text class="text-21rpx text-[#ffc400]">第 {{ episode }} 集</text
      ><text class="ml-12rpx text-20rpx text-white/55"
        >上下滑动切换剧集</text
      ></view
    >
    <view class="mt-14rpx">
      <slider
        class="m-0"
        :value="displayProgress"
        :min="0"
        :max="100"
        :step="0.1"
        active-color="#ffc400"
        background-color="rgba(255,255,255,0.28)"
        block-color="#ffffff"
        :block-size="14"
        :show-value="false"
        @changing="handleChanging"
        @change="handleChange"
      />
      <view
        class="-mt-4rpx flex items-center justify-between text-18rpx text-white/55"
        ><text>{{ formatTime(displaySeconds) }}</text
        ><text>{{ formatTime(duration) }}</text></view
      >
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    episode?: number;
    episodeCount?: number;
    favorite?: boolean;
    playing?: boolean;
    currentTime?: number;
    duration?: number;
  }>(),
  {
    title: "",
    description: "",
    episode: 1,
    episodeCount: 0,
    favorite: false,
    playing: false,
    currentTime: 0,
    duration: 0,
  },
);
const emit = defineEmits<{
  back: [];
  episodes: [];
  favorite: [];
  seek: [seconds: number];
}>();
const dragging = ref(false);
const dragProgress = ref(0);
const progress = computed(() =>
  props.duration
    ? Math.min(100, (props.currentTime / props.duration) * 100)
    : 0,
);
const displayProgress = computed(() =>
  dragging.value ? dragProgress.value : progress.value,
);
const displaySeconds = computed(() =>
  dragging.value
    ? (props.duration * dragProgress.value) / 100
    : props.currentTime,
);
const eventValue = (event: Event) =>
  Number((event as unknown as { detail?: { value?: number } }).detail?.value) ||
  0;
const handleChanging = (event: Event) => {
  dragging.value = true;
  dragProgress.value = eventValue(event);
};
const handleChange = (event: Event) => {
  dragProgress.value = eventValue(event);
  emit("seek", (props.duration * dragProgress.value) / 100);
  dragging.value = false;
};
const formatTime = (seconds: number) => {
  const value = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(value / 60)
    .toString()
    .padStart(2, "0")}:${(value % 60).toString().padStart(2, "0")}`;
};
</script>
