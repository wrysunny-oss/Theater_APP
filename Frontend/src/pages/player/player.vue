<template>
  <view class="relative h-screen overflow-hidden bg-black text-white">
    <view v-if="loading" class="absolute inset-0 z-30 flex items-center justify-center bg-black"><up-loading-icon color="#ffc400" text="视频加载中" text-color="#b8bac4" /></view>
    <view v-else-if="!drama" class="absolute inset-0 z-30 bg-[#090a0f]"><PageState status="error" title="短剧加载失败" description="内容可能已下架，请返回后重试" @retry="load" /></view>

    <template v-else>
      <!-- 页面只编排播放器状态；展示型区域由 player 业务组件负责。 -->
      <swiper class="absolute inset-0 h-full w-full" vertical :current="currentIndex" :duration="280" @change="handleEpisodeSwipe">
        <swiper-item v-for="episode in drama.episodes" :key="episode.number">
          <view class="relative h-full w-full bg-black" @click="togglePlayback">
            <video
              :id="videoId(episode.number)"
              :key="`${episode.number}-${reloadKey}`"
              class="h-full w-full"
              :src="Math.abs(episode.number - currentEpisode.number) <= 1 ? episode.videoUrl : ''"
              :poster="drama.image"
              :autoplay="episode.number === currentEpisode.number"
              :controls="false"
              :show-center-play-btn="false"
              :enable-progress-gesture="false"
              object-fit="cover"
              @play="episode.number === currentEpisode.number && (playing = true)"
              @pause="episode.number === currentEpisode.number && (playing = false)"
              @timeupdate="episode.number === currentEpisode.number && handleTimeUpdate($event)"
              @loadedmetadata="episode.number === currentEpisode.number && handleLoadedMetadata($event)"
              @ended="episode.number === currentEpisode.number && playNext()"
              @error="episode.number === currentEpisode.number && handleVideoError()"
            />
          </view>
        </swiper-item>
      </swiper>

      <PlayerOverlay
        :title="drama.title"
        :description="drama.description"
        :episode="currentEpisode.number"
        :episode-count="drama.episodes.length"
        :favorite="favorite"
        :playing="playing"
        :current-time="watchedSeconds"
        :duration="durationSeconds"
        :network-online="networkOnline"
        :video-error="videoError"
        @back="back"
        @episodes="episodePopup = true"
        @favorite="toggleFavorite"
        @seek="seek"
        @retry="retryVideo"
      />
      <EpisodePicker :show="episodePopup" :episodes="drama.episodes" :current="currentEpisode.number" @close="episodePopup = false" @select="selectEpisode" />
    </template>
  </view>
</template>

<script setup lang="ts">
import PageState from "../../components/common/PageState.vue";
import EpisodePicker from "../../components/player/EpisodePicker.vue";
import PlayerOverlay from "../../components/player/PlayerOverlay.vue";
import { useDramaPlayer } from "../../composables/useDramaPlayer";

const back = () => uni.navigateBack();
const { drama, currentIndex, currentEpisode, loading, favorite, episodePopup, playing, watchedSeconds, durationSeconds, networkOnline, videoError, reloadKey, videoId, load, selectEpisode, playNext, handleEpisodeSwipe, togglePlayback, toggleFavorite, seek, retryVideo, handleTimeUpdate, handleLoadedMetadata, handleVideoError } = useDramaPlayer();
</script>
