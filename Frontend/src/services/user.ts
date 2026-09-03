/** 本地账户适配器。页面不直接读写存储，未来可整体替换为账户API。 */
export interface LocalUser {
  loggedIn: boolean;
  id: string;
  phone: string;
  nickname: string;
  avatar: string;
  gender: "unknown" | "male" | "female";
  birthday: string;
  bio: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
  alipayName: string;
  alipayAccount: string;
}

const ACCOUNT_KEY = "hly_account_v2";
const SESSION_KEY = "hly_session_v1";
const emptyAccount = (): LocalUser => ({ loggedIn: false, id: "", phone: "", nickname: "游客用户", avatar: "", gender: "unknown", birthday: "", bio: "", password: "123456", securityQuestion: "", securityAnswer: "", alipayName: "", alipayAccount: "" });
const saveAccount = (user: LocalUser) => { const stored = { ...user, loggedIn: false }; uni.setStorageSync(ACCOUNT_KEY, stored); };

export const getLocalUser = (): LocalUser => {
  const account = uni.getStorageSync(ACCOUNT_KEY) as LocalUser | "";
  if (!account || typeof account !== "object") return emptyAccount();
  return { ...emptyAccount(), ...account, loggedIn: Boolean(uni.getStorageSync(SESSION_KEY)) };
};
export const loginLocalUser = (phone: string, nickname?: string): LocalUser => {
  const existing = uni.getStorageSync(ACCOUNT_KEY) as LocalUser | "";
  const user = existing && existing.phone === phone ? { ...emptyAccount(), ...existing } : { ...emptyAccount(), id: `local-${phone}`, phone, nickname: nickname?.trim() || `用户${phone.slice(-4)}` };
  saveAccount(user); uni.setStorageSync(SESSION_KEY, true);
  return { ...user, loggedIn: true };
};
export const passwordLoginLocalUser = (phone: string, password: string) => {
  const account = uni.getStorageSync(ACCOUNT_KEY) as LocalUser | "";
  if (!account || account.phone !== phone || account.password !== password) return null;
  uni.setStorageSync(SESSION_KEY, true);
  return { ...account, loggedIn: true };
};
export const updateLocalUser = (profile: Partial<Omit<LocalUser, "id" | "loggedIn">>): LocalUser => {
  const current = getLocalUser(); const user = { ...current, ...profile };
  saveAccount(user); return user;
};
export const resetLocalPassword = (phone: string, password: string) => {
  const account = uni.getStorageSync(ACCOUNT_KEY) as LocalUser | "";
  if (!account || account.phone !== phone) return false;
  saveAccount({ ...account, password }); return true;
};
export const changeLocalPassword = (oldPassword: string, newPassword: string) => {
  const user = getLocalUser(); if (user.password !== oldPassword) return false;
  updateLocalUser({ password: newPassword }); return true;
};
export const logoutLocalUser = () => { uni.removeStorageSync(SESSION_KEY); return emptyAccount(); };
