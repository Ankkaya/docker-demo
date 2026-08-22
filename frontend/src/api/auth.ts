import api from './request'
import type { AuthApi, LoginParams } from '@/types/api/index.ts'

// 登录
export const login = (data: LoginParams) => {
  return api.post<AuthApi.Login>('/auth/login', data)
}

// 获取当前用户
export const getCurrentUser = () => {
  return api.get<AuthApi.GetCurrentUser>('/auth/me')
}
