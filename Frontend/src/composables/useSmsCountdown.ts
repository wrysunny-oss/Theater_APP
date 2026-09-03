import { computed, onUnmounted, ref } from "vue";

/** 短信验证码倒计时；发送行为由页面传入，便于后续替换真实接口。 */
export function useSmsCountdown(seconds = 60) {
  const countdown = ref(0);
  let timer: ReturnType<typeof setInterval> | undefined;
  const codeText = computed(() => countdown.value ? `${countdown.value}s后重发` : "获取验证码");
  const codeStyle = computed(() => ({ color: countdown.value ? "#696c77" : "#ffc400" }));
  const start = () => {
    if (countdown.value) return false;
    countdown.value = seconds;
    timer = setInterval(() => { countdown.value--; if (!countdown.value && timer) clearInterval(timer); }, 1000);
    return true;
  };
  onUnmounted(() => { if (timer) clearInterval(timer); });
  return { countdown, codeText, codeStyle, start };
}
