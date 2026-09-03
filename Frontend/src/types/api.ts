/**
 * 后端接口数据契约草案。
 * 页面组件应优先依赖这些稳定类型，不直接感知 HTTP、数据库或本地存储结构。
 */
export interface ApiResponse<T> { code: number; message: string; data: T; requestId?: string }
export interface PageRequest { page: number; pageSize: number }
export interface PageResult<T> { list: T[]; page: number; pageSize: number; total: number; hasMore: boolean }

export interface UserProfileDto {
  id: string;
  phone: string;
  nickname: string;
  avatarUrl: string;
  gender?: "unknown" | "male" | "female";
  birthday?: string;
  bio?: string;
}
export interface UpdateProfileRequest { nickname: string; avatarUrl?: string; gender?: UserProfileDto["gender"]; birthday?: string; bio?: string }
export interface SmsCodeRequest { phone: string; scene: "login" | "register" }
export interface LoginRequest { phone: string; code: string }
export interface PasswordLoginRequest { phone: string; password: string }
export interface RegisterRequest extends LoginRequest { nickname: string; agreementVersion: string }
export interface ResetPasswordRequest { phone: string; code: string; newPassword: string }
export interface ChangePasswordRequest { oldPassword: string; newPassword: string }
export interface BindPhoneRequest { phone: string; code: string }
export interface SecurityQuestionRequest { question: string; answer: string }
export interface BindAlipayRequest { realName: string; account: string }
export interface AuthTokenDto { accessToken: string; refreshToken: string; expiresIn: number; user: UserProfileDto }

export type TaskStatus = "pending" | "claimable" | "claimed";
export interface TaskDto {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardCoins: number;
  progress: number;
  target: number;
  status: TaskStatus;
}
export interface SignInDto { signedToday: boolean; streakDays: number; todayReward: number; rewards: number[] }

export type LedgerCategory = "signin" | "task" | "ad" | "share" | "withdraw";
export interface RewardAccountDto { coinBalance: number; cashAmount: number; coinsPerYuan: number }
export interface RewardLedgerDto { id: string; title: string; amount: number; category: LedgerCategory; createdAt: string }
export interface RewardLedgerQuery extends PageRequest { category?: LedgerCategory; startDate?: string; endDate?: string }

export interface NotificationDto { id: number; title: string; content: string; type: "system" | "reward" | "activity"; createdAt: string; read: boolean }
export interface FeedbackCreateRequest { type: string; content: string; contact?: string; imageUrls?: string[] }
