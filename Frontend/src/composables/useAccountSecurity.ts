import { computed, reactive, ref } from "vue";
import { changeLocalPassword, getLocalUser, updateLocalUser } from "../services/user";

export type SecurityEditor = "password" | "phone" | "question" | "alipay";

/** 账户安全编辑器状态与字段校验，视图仅根据 activeEditor 渲染对应表单。 */
export function useAccountSecurity() {
  const user = ref(getLocalUser());
  const popupVisible = ref(false);
  const activeEditor = ref<SecurityEditor>("password");
  const form = reactive({ oldPassword: "", newPassword: "", phone: "", code: "", question: "", answer: "", alipayName: "", alipayAccount: "" });
  const maskedPhone = computed(() => user.value.phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2"));
  const maskedAlipay = computed(() => {
    const value = user.value.alipayAccount;
    if (!value) return "";
    if (value.includes("@")) { const [name, domain] = value.split("@"); return `${name.slice(0, 2)}***@${domain}`; }
    return value.replace(/^(\d{3})\d+(\d{3})$/, "$1****$2");
  });
  const alipaySummary = computed(() => user.value.alipayAccount ? `${user.value.alipayName} · ${maskedAlipay.value}` : "未绑定，点击填写支付宝信息");
  const loginItems = computed(() => [
    { key: "password" as const, title: "登录密码", subtitle: "定期修改密码可以提升账户安全", icon: "lock" },
    { key: "phone" as const, title: "绑定手机号", subtitle: maskedPhone.value || "未绑定", icon: "phone" },
    { key: "question" as const, title: "安全验证问题", subtitle: user.value.securityQuestion || "未设置", icon: "question-circle" },
  ]);
  const popupTitle = computed(() => ({ password: "修改登录密码", phone: "更换绑定手机号", question: "设置安全问题", alipay: "绑定支付宝账号" })[activeEditor.value]);
  const openEditor = (type: SecurityEditor) => {
    activeEditor.value = type;
    form.question = user.value.securityQuestion; form.answer = user.value.securityAnswer;
    form.alipayName = user.value.alipayName; form.alipayAccount = user.value.alipayAccount;
    popupVisible.value = true;
  };
  const closeEditor = () => { popupVisible.value = false; form.oldPassword = ""; form.newPassword = ""; form.phone = ""; form.code = ""; };
  const toast = (title: string) => uni.showToast({ title, icon: "none" });
  const save = () => {
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
      user.value = updateLocalUser({ alipayName: form.alipayName.trim(), alipayAccount: form.alipayAccount.trim() });
    }
    closeEditor(); uni.showToast({ title: "保存成功", icon: "success" });
  };
  return { user, popupVisible, activeEditor, form, alipaySummary, loginItems, popupTitle, openEditor, closeEditor, save };
}
