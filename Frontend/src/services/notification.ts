/** 本地通知仓库：模拟服务端消息列表及已读状态。 */
export interface LocalNotification {
  id: number;
  title: string;
  content: string;
  type: "system" | "reward" | "activity";
  createdAt: string;
  read: boolean;
}

const STORAGE_KEY = "hly_notifications_v1";
const seeds = (): LocalNotification[] => [
  { id: 1, title: "欢迎来到幻乐剧场", content: "精彩短剧、每日福利和金币任务等你体验。", type: "system", createdAt: "刚刚", read: false },
  { id: 2, title: "每日签到提醒", content: "连续签到可以获得递增金币奖励，别忘了领取。", type: "reward", createdAt: "今天 09:00", read: false },
  { id: 3, title: "热门短剧更新", content: "热门榜单已更新，更多精彩内容正在热播。", type: "activity", createdAt: "昨天 18:30", read: true },
];

export const getNotifications = (): LocalNotification[] => {
  const saved = uni.getStorageSync(STORAGE_KEY) as LocalNotification[] | "";
  if (Array.isArray(saved)) return saved;
  const list = seeds();
  uni.setStorageSync(STORAGE_KEY, list);
  return list;
};
const save = (list: LocalNotification[]) => uni.setStorageSync(STORAGE_KEY, list);
export const getUnreadCount = () => getNotifications().filter((item) => !item.read).length;
export const markNotificationRead = (id: number) => { const list = getNotifications().map((item) => item.id === id ? { ...item, read: true } : item); save(list); return list; };
export const markAllNotificationsRead = () => { const list = getNotifications().map((item) => ({ ...item, read: true })); save(list); return list; };
export const removeNotification = (id: number) => { const list = getNotifications().filter((item) => item.id !== id); save(list); return list; };
export const resetNotifications = () => { const list = seeds(); save(list); return list; };
