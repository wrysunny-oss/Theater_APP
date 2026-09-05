import { computed, reactive, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { changeLocalPassword, getLocalUser, updateLocalUser } from "../services/user";
import { appApi, hasRemoteSession } from "../services/api";

export type SecurityEditor = "password" | "phone" | "question" | "alipay";

/** 账户安全编辑器状态与字段校验，视图仅根据 activeEditor 渲染对应表单。 */
export function useAccountSecurity() {
  const user = ref(getLocalUser());
  const popupVisible = ref(false);
  const activeEditor = ref<SecurityEditor>("password");
  const payoutAccount = ref<{ accountMasked?: string; bound: boolean }>({ bound: false });
  const form = reactive({ oldPassword: "", newPassword: "", phone: "", code: "", question: "", answer: "", alipayName: "", alipayAccount: "" });
  const maskedPhone = computed(() => user.value.phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2"));
  const alipaySummary = computed(() => payoutAccount.value.bound ? `已绑定 · ${payoutAccount.value.accountMasked}` : "未绑定，点击填写支付宝信息");
  const loginItems = computed(() => [
    { key: "password" as const, title: "登录密码", subtitle: "定期修改密码可以提升账户安全", icon: "lock" },
    { key: "phone" as const, title: "绑定手机号", subtitle: maskedPhone.value || "未绑定", icon: "phone" },
    { key: "question" as const, title: "安全验证问题", subtitle: user.value.securityQuestion || "未设置", icon: "question-circle" },
  ]);
  const popupTitle = computed(() => ({ password: "修改登录密码", phone: "更换绑定手机号", question: "设置安全问题", alipay: "绑定支付宝账号" })[activeEditor.value]);
  const openEditor = (type: SecurityEditor) => {
    activeEditor.value = type;
    form.question = user.value.securityQuestion; form.answer = user.value.securityAnswer;
    // 服务端不回传完整敏感信息，换绑时必须重新填写姓名和账号。
    form.alipayName = ""; form.alipayAccount = "";
    popupVisible.value = true;
  };
  const closeEditor = () => { popupVisible.value = false; form.oldPassword = ""; form.newPassword = ""; form.phone = ""; form.code = ""; };
  const toast = (title: string) => uni.showToast({ title, icon: "none" });
  const save = async () => {
    if (activeEditor.value === "password") {
      if (form.newPassword.length < 6 || form.newPassword.length > 20) return toast("新密码需为6-20位");
      if (!changeLocalPassword(form.oldPassword, form.newPassword)) return toast("旧密码不正确");
    }
    if (activeEditor.value === "phone") {
      if (!/^1\d{10}$/.test(form.phone)) return toast("请输入正确的手机号");
      if (form.code !== "123456") return toast("请输入验证码123456");
      user.value = updateLocalUser({ phone: form.phone });
    }
    if (activeEditor.value === "question") {
      if (!form.question.trim() || !form.answer.trim()) return toast("请完整填写问题和答案");
      user.value = updateLocalUser({ securityQuestion: form.question.trim(), securityAnswer: form.answer.trim() });
    }
    if (activeEditor.value === "alipay") {
      if (!form.alipayName.trim()) return toast("请输入支付宝名称");
      if (form.alipayAccount.trim().length < 5) return toast("请输入正确的支付宝账号");
      if (!hasRemoteSession()) return void uni.navigateTo({ url: "/pages/auth/auth" });
      try {
        const saved = await appApi.bindPayoutAccount({ channel: "ALIPAY", realName: form.alipayName.trim(), account: form.alipayAccount.trim() });
        payoutAccount.value = saved;
      } catch (error) {
        return toast(error instanceof Error ? error.message : "收款账户保存失败");
      }
      // 不把完整支付宝姓名和账号写入设备本地存储，绑定状态以服务端脱敏数据为准。
      user.value = updateLocalUser({ alipayName: "", alipayAccount: "" });
    }
    closeEditor(); uni.showToast({ title: "保存成功", icon: "success" });
  };
  onShow(async () => {
    if (!hasRemoteSession()) return;
    try { payoutAccount.value = await appApi.payoutAccount(); } catch {}
  });
  return { user, payoutAccount, popupVisible, activeEditor, form, alipaySummary, loginItems, popupTitle, openEditor, closeEditor, save };
}
