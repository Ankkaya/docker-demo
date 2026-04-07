import { alovaInstance } from './index'

export interface MallWechatLoginPayload {
  code: string
  phoneCode?: string
  nickname?: string
  avatarUrl?: string
}

export interface MallProfilePayload {
  nickname?: string
  avatarUrl?: string
}

export function mallWechatLogin(data: MallWechatLoginPayload) {
  return alovaInstance.Post('/mall/auth/wechat-login', data)
}

export function updateMallProfile(data: MallProfilePayload) {
  return alovaInstance.Patch('/mall/auth/me', data)
}
