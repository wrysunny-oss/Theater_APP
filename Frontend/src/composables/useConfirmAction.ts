interface ConfirmOptions {
  title: string;
  content: string;
  confirmColor?: string;
}

/** 统一危险或不可逆操作的二次确认。 */
export function useConfirmAction() {
  const confirmAction = (options: ConfirmOptions, action: () => void | Promise<void>) => uni.showModal({
    ...options,
    success: async ({ confirm }) => { if (confirm) await action(); },
  });
  return { confirmAction };
}
