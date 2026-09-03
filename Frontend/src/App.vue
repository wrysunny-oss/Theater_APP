<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
onLaunch(() => {
  console.log("App Launch");
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style lang="scss">
/* 注意要写在第一行，同时给style标签加入lang="scss"属性 */
@import "uview-plus/index.scss";
@import "./styles/reset.scss";

:root {
  --app-bg: #0b0b0f;
  --app-surface: #16191e;
  --app-surface-2: #1d2127;
  --app-border: rgba(255, 255, 255, 0.1);
  --app-muted: #9295a1;
  --app-gold: #f5b800;
  --app-red: #ff5b5b;
  --app-green: #19b565;
  --app-blue: #1d9bf0;
  --app-text: #f5f5f5;
  --app-text-soft: #b8bac4;
  --app-text-disabled: #696c77;
  --app-shadow: rgba(0, 0, 0, 0.22);
}

page {
  background: var(--app-bg);
  color: var(--app-text);
  /* 覆盖uView Plus默认浅色Token，保证表单与弹层在暗色页面中可读。 */
  --up-main-color: #f5f5f7;
  --up-content-color: #b8bac4;
  --up-tips-color: #9295a1;
  --up-light-color: #696c77;
  --up-border-color: rgba(255, 255, 255, 0.1);
  --up-bg-color: #090a0f;
  --up-card-bg-color: #15161d;
}

.u-input,
.u-textarea {
  background-color: #1b1c25 !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}
</style>
