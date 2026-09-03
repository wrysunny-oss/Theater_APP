/** 本地反馈仓库：用于无后端阶段验证提交、列表和状态展示。 */
export interface FeedbackItem {
  id: number;
  type: string;
  content: string;
  contact: string;
  status: "pending" | "resolved";
  createdAt: string;
}

const STORAGE_KEY = "hly_feedback_v1";
export const getFeedbackList = (): FeedbackItem[] => {
  const saved = uni.getStorageSync(STORAGE_KEY);
  return Array.isArray(saved) ? saved : [];
};
export const submitFeedback = (data: Pick<FeedbackItem, "type" | "content" | "contact">) => {
  const list = getFeedbackList();
  const item: FeedbackItem = { ...data, id: Date.now(), status: "pending", createdAt: new Date().toLocaleString() };
  const next = [item, ...list].slice(0, 30);
  uni.setStorageSync(STORAGE_KEY, next);
  return next;
};
