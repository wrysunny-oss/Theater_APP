import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getUnreadCount } from "../services/notification";
import { getRewardState } from "../services/reward";
import { getLocalUser, logoutLocalUser } from "../services/user";

/** 个人中心聚合视图，集中刷新跨用户、奖励和通知三个服务的数据。 */
export function useUserDashboard() {
  const user = ref(getLocalUser());
  const rewards = ref(getRewardState());
  const unreadCount = ref(getUnreadCount());
  const avatarText = computed(() => user.value.nickname.slice(0, 1).toUpperCase());
  const maskedPhone = computed(() => user.value.phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2"));
  const completedTasks = computed(() => rewards.value.daily.claimed.length);
  const reload = () => { user.value = getLocalUser(); rewards.value = getRewardState(); unreadCount.value = getUnreadCount(); };
  const logout = () => uni.showModal({ title: "退出登录", content: "任务和金币数据会继续保留在当前设备。", success: ({ confirm }) => { if (confirm) user.value = logoutLocalUser(); } });
  onShow(reload);
  return { user, rewards, unreadCount, avatarText, maskedPhone, completedTasks, logout };
}
