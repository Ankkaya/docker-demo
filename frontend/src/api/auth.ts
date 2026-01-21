import api from './request'
import type { LoginDto, RegisterDto, AuthResponse, User } from '@/types'

// 登录
export const login = (data: LoginDto) => {
  return api.post<any, AuthResponse>('/auth/login', data)
}

// 注册
export const register = (data: RegisterDto) => {
  return api.post<any, AuthResponse>('/auth/register', data)
}

// 获取当前用户
export const getCurrentUser = () => {
  return api.get<any, User>('/auth/me')
}
