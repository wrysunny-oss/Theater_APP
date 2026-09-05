/** App 与 Express 后端唯一通信入口，统一处理令牌、刷新、错误提示和设备请求头。 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:3000/api/v1";
const ACCESS_KEY = "hly_access_token_v1";
const REFRESH_KEY = "hly_refresh_token_v1";
const DEVICE_KEY = "hly_device_id_v1";

export interface ApiEnvelope<T> { code: number; data: T; message: string; requestId?: string }
export interface AuthUser { avatarUrl?: null | string; id: string; nickname: string; phone: string }
export interface AuthResult { accessToken: string; refreshToken: string; user: AuthUser }

let refreshing: null | Promise<string> = null;
export function deviceId() {
  let id = uni.getStorageSync(DEVICE_KEY) as string;
  if (!id) { id = `app-${Date.now()}-${Math.random().toString(36).slice(2)}`; uni.setStorageSync(DEVICE_KEY, id); }
  return id;
}
export const hasRemoteSession = () => Boolean(uni.getStorageSync(ACCESS_KEY));
export function saveTokens(result: AuthResult) {
  uni.setStorageSync(ACCESS_KEY, result.accessToken); uni.setStorageSync(REFRESH_KEY, result.refreshToken);
}
export function clearTokens() { uni.removeStorageSync(ACCESS_KEY); uni.removeStorageSync(REFRESH_KEY); }

function rawRequest<T>(path: string, method: UniApp.RequestOptions["method"], data?: unknown, token?: string) {
  return new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => uni.request({
    url: `${API_BASE_URL}${path}`, method, data: data as UniApp.RequestOptions["data"],
    header: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "X-Device-Id": deviceId(), "X-Platform": "uni-app", "X-App-Version": "1.0.0" },
    success: resolve, fail: reject,
  }));
}

async function refreshAccessToken() {
  if (!refreshing) refreshing = (async () => {
    const refreshToken = uni.getStorageSync(REFRESH_KEY) as string;
    if (!refreshToken) throw new Error("登录已失效");
    const response = await rawRequest<AuthResult>("/auth/refresh", "POST", { refreshToken });
    const body = response.data as ApiEnvelope<AuthResult>;
    if (response.statusCode !== 200 || body.code !== 0) throw new Error(body.message || "登录已失效");
    saveTokens(body.data); return body.data.accessToken;
  })().finally(() => { refreshing = null; });
  return refreshing;
}

/** 401 时仅轮换一次 refresh token，并让并发失败请求共享同一个刷新 Promise。 */
export async function apiRequest<T>(path: string, options: { auth?: boolean; data?: unknown; method?: UniApp.RequestOptions["method"]; retry?: boolean } = {}) {
  const auth = options.auth ?? true;
  const response = await rawRequest<T>(path, options.method ?? "GET", options.data, auth ? uni.getStorageSync(ACCESS_KEY) as string : undefined);
  if (response.statusCode === 401 && auth && options.retry !== false) {
    try { const token = await refreshAccessToken(); const retried = await rawRequest<T>(path, options.method ?? "GET", options.data, token); return unwrap<T>(retried); }
    catch (error) { clearTokens(); uni.navigateTo({ url: "/pages/auth/auth" }); throw error; }
  }
  return unwrap<T>(response);
}

/** 将后端返回的相对资源地址转换成 App 可直接访问的完整地址。 */
export function resolveAssetUrl(path?: null | string) {
  if (!path || /^(data:|https?:|blob:)/i.test(path)) return path || "";
  return `${API_BASE_URL.replace(/\/api\/v1\/?$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

/** 使用 multipart/form-data 上传头像，并复用当前登录令牌。 */
async function uploadAvatar(filePath: string) {
  return new Promise<{ avatarUrl: string }>((resolve, reject) => uni.uploadFile({
    url: `${API_BASE_URL}/auth/avatar`,
    filePath,
    name: "file",
    header: { Authorization: `Bearer ${uni.getStorageSync(ACCESS_KEY) as string}`, "X-Device-Id": deviceId(), "X-Platform": "uni-app", "X-App-Version": "1.0.0" },
    success: (response) => {
      try {
        const body = JSON.parse(response.data) as ApiEnvelope<{ avatarUrl: string }>;
        if (response.statusCode < 200 || response.statusCode >= 300 || body.code !== 0) return reject(new Error(body.message || "头像上传失败"));
        resolve({ avatarUrl: resolveAssetUrl(body.data.avatarUrl) });
      } catch (error) { reject(error); }
    },
    fail: reject,
  }));
}
function unwrap<T>(response: UniApp.RequestSuccessCallbackResult) {
  const body = response.data as ApiEnvelope<T>;
  if (response.statusCode < 200 || response.statusCode >= 300 || body.code !== 0) throw new Error(body.message || `请求失败（${response.statusCode}）`);
  return body.data;
}

export const appApi = {
  login: (phone: string, password: string) => apiRequest<AuthResult>("/auth/login", { auth: false, method: "POST", data: { phone, password } }),
  register: (data: { inviteCode: string; nickname: string; password: string; phone: string }) => apiRequest<AuthResult>("/auth/register", { auth: false, method: "POST", data }),
  me: () => apiRequest<any>("/auth/me"),
  updateProfile: (data: { bio?: string; birthday?: string; gender?: "female" | "male" | "unknown"; nickname: string }) => apiRequest<any>("/auth/me", { method: "PUT", data }),
  uploadAvatar,
  logout: () => apiRequest<null>("/auth/logout", { auth: false, method: "POST", data: { refreshToken: uni.getStorageSync(REFRESH_KEY) } }).finally(clearTokens),
  changePassword: (oldPassword: string, newPassword: string) => apiRequest<null>("/auth/password", { method: "PUT", data: { oldPassword, newPassword } }),
  rewardCenter: () => apiRequest<any>("/rewards/center"),
  rewardLedgers: () => apiRequest<any>("/rewards/ledgers?page=1&pageSize=100"),
  checkIn: () => apiRequest<any>("/rewards/check-ins", { method: "POST" }),
  bindInvite: (inviteCode: string) => apiRequest<any>("/rewards/invite/bind", { method: "POST", data: { inviteCode } }),
  updateInviteCode: (inviteCode: string) => apiRequest<{ inviteCode: string }>("/rewards/invite-code", { method: "PUT", data: { inviteCode } }),
  withdrawalConfig: () => apiRequest<any>("/withdrawals/config"),
  payoutAccount: () => apiRequest<{ accountMasked?: string; bound: boolean; channel?: "ALIPAY" | "BANK" | "WECHAT" }>("/withdrawals/payout-account"),
  bindPayoutAccount: (data: { account: string; channel: "ALIPAY" | "BANK" | "WECHAT"; realName: string }) => apiRequest<{ accountMasked: string; bound: true; channel: string }>("/withdrawals/payout-account", { method: "PUT", data }),
  createWithdrawal: (data: { coins: string; requestId: string }) => apiRequest<any>("/withdrawals", { method: "POST", data }),
  withdrawals: () => apiRequest<any>("/withdrawals/mine?page=1&pageSize=100"),
  submitFeedback: (data: { contact?: string; content: string; imageUrls?: string[]; type: string }) => apiRequest<any>("/safety/feedback", { method: "POST", data }),
  feedbackMine: () => apiRequest<any[]>("/safety/feedback/mine"),
  /** 原生检测模块完成十项检测后统一上报；评分和封号决定始终由服务端执行。 */
  submitDeviceRiskAssessment: (data: {
    challengeId:string;deviceId: string; simStatus:'PASS'|'RISK'|'UNKNOWN'; wechatStatus:'PASS'|'RISK'|'UNKNOWN'; douyinStatus:'PASS'|'RISK'|'UNKNOWN'; alipayStatus:'PASS'|'RISK'|'UNKNOWN';
    emulatorStatus:'PASS'|'RISK'|'UNKNOWN'; cloudDeviceStatus:'PASS'|'RISK'|'UNKNOWN'; scriptStatus:'PASS'|'RISK'|'UNKNOWN'; networkStatus:'PASS'|'RISK'|'UNKNOWN'; ipStatus:'PASS'|'RISK'|'UNKNOWN';
    location?: { latitude:number; longitude:number; referenceLatitude:number; referenceLongitude:number; maxDistanceMeters?:number };
    evidence?: Record<string, unknown>;
  }) => apiRequest<{autoBanned:boolean;score:number}>("/safety/device-risk-assessments", { method:"POST", data }),
  riskAssessmentStatus: (context:"login"|"reward"|"withdrawal") => apiRequest<{context:string;expiresAt:null|string;fresh:boolean;required:boolean}>(`/safety/device-risk-status?context=${context}`),
  createRiskChallenge:(context:"login"|"reward"|"withdrawal")=>apiRequest<{id:string;context:string;nonce:string;expiresAt:string}>("/safety/device-risk-challenges",{method:"POST",data:{context}}),
  bootstrap: () => apiRequest<any>("/operations/bootstrap", { auth: false }),
  document: (code: string) => apiRequest<any>(`/operations/documents/${encodeURIComponent(code)}`, { auth: false }),
};

export { API_BASE_URL };
