import { ref, type Ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useConfirmAction } from "./useConfirmAction";

interface CollectionOptions<T> {
  load: () => Promise<T[]>;
  remove: (id: number) => Promise<T[]>;
  clear: () => Promise<T[]>;
  removedText: string;
  clearTitle: string;
  clearContent: string;
}

/** 统一收藏、历史等“加载 / 单项删除 / 确认清空”页面行为。 */
export function useContentCollection<T extends { id: number }>(options: CollectionOptions<T>) {
  const items = ref<T[]>([]) as Ref<T[]>;
  const { confirmAction } = useConfirmAction();
  const reload = async () => { items.value = await options.load(); };
  const remove = async (id: number) => {
    items.value = await options.remove(id);
    uni.showToast({ title: options.removedText, icon: "none" });
  };
  const confirmClear = () => confirmAction({ title: options.clearTitle, content: options.clearContent }, async () => { items.value = await options.clear(); });
  onShow(reload);
  return { items, reload, remove, confirmClear };
}
