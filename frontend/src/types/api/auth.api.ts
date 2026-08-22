// ==================== 认证 API 类型 ====================
import type { User } from '@/types';

/**
 * 登录请求参数
 */
export interface LoginParams {
  username: string;
  password: string;
}

/**
 * 认证响应数据
 */
export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * 认证 API 命名空间
 */
export namespace AuthApi {
  /** 登录 */
  export type Login = AuthResponse;
  /** 获取当前用户 */
  export type GetCurrentUser = User;
}
