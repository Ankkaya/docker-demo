import api from './request'
import type { AuthApi, LoginParams, RegisterParams } from '@/types/api/index.ts'

// 登录
export const login = (data: LoginParams) => {
  return api.post<AuthApi.Login>('/auth/login', data)
}

// 注册
export const register = (data: RegisterParams) => {
  return api.post<AuthApi.Register>('/auth/register', data)
}

// 获取当前用户
export const getCurrentUser = () => {
  return api.get<AuthApi.GetCurrentUser>('/auth/me')
}
