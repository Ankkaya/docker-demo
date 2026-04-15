import { defineStore } from 'pinia'
import { authEnvConfig } from '@/config/auth'

export interface UserProfile {
  nickname: string
  avatarUrl: string
}

export interface LoginUser {
  id: number
  username?: string
  name?: string | null
  avatarUrl?: string | null
  email?: string | null
  phone?: string | null
  customer?: {
    id: number
    name: string
    phone?: string | null
    address?: string | null
    balanceAccountId?: number | null
    availableBalance?: string | null
  } | null
}

export interface PendingRoute {
  name?: string
  path?: string
  query?: Record<string, any>
  isTabbar?: boolean
}

function createEmptyProfile(): UserProfile {
  return {
    nickname: '',
    avatarUrl: '',
  }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    refreshToken: '',
    isLoggedIn: false,
    user: null as LoginUser | null,
    profile: createEmptyProfile() as UserProfile,
    authPopupVisible: false,
    pendingRoute: null as PendingRoute | null,
  }),
  getters: {
    displayName: state => state.user?.name || state.user?.username || state.profile.nickname || '未登录用户',
    displayAvatar: state => state.user?.avatarUrl || state.profile.avatarUrl || authEnvConfig.defaultAvatarUrl || '',
  },
  actions: {
    openAuthPopup(target?: PendingRoute | null) {
      if (target) {
        this.pendingRoute = {
          name: target.name,
          path: target.path,
          query: target.query ? { ...target.query } : undefined,
          isTabbar: Boolean(target.isTabbar),
        }
      }

      this.authPopupVisible = true
    },
    closeAuthPopup() {
      this.authPopupVisible = false
    },
    setSession(payload: {
      token: string
      refreshToken: string
    }) {
      this.token = payload.token
      this.refreshToken = payload.refreshToken
    },
    setCurrentUser(user: LoginUser) {
      this.user = user
      this.profile = {
        nickname: user.name || user.username || '',
        avatarUrl: user.avatarUrl || authEnvConfig.defaultAvatarUrl || '',
      }
      this.isLoggedIn = true
      this.authPopupVisible = false
    },
    consumePendingRoute() {
      const route = this.pendingRoute
      this.pendingRoute = null
      return route
    },
    logout() {
      this.token = ''
      this.refreshToken = ''
      this.isLoggedIn = false
      this.user = null
      this.profile = createEmptyProfile()
      this.pendingRoute = null
      this.authPopupVisible = false
    },
  },
})
