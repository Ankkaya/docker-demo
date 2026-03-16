import { defineStore } from 'pinia'

export interface UserProfile {
  nickname: string
  avatarUrl: string
}

export interface LoginUser {
  id: number
  username?: string
  name?: string | null
}

export interface PendingRoute {
  name?: string
  path?: string
  query?: Record<string, any>
  isTabbar?: boolean
}

const createEmptyProfile = (): UserProfile => ({
  nickname: '',
  avatarUrl: '',
})

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    isLoggedIn: false,
    user: null as LoginUser | null,
    profile: createEmptyProfile() as UserProfile,
    authPopupVisible: false,
    authStep: 'prompt' as 'prompt' | 'profile',
    pendingRoute: null as PendingRoute | null,
    draftProfile: createEmptyProfile() as UserProfile,
  }),
  getters: {
    displayName: state => state.profile.nickname || '微信用户',
    displayAvatar: state => state.profile.avatarUrl || '',
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

      this.authStep = 'prompt'
      this.draftProfile = {
        nickname: this.profile.nickname || '',
        avatarUrl: this.profile.avatarUrl || '',
      }
      this.authPopupVisible = true
    },
    closeAuthPopup() {
      this.authPopupVisible = false
    },
    applyWechatProfile(profile?: Partial<UserProfile> | null) {
      this.draftProfile = {
        nickname: profile?.nickname || this.profile.nickname || '',
        avatarUrl: profile?.avatarUrl || this.profile.avatarUrl || '',
      }
      this.authStep = 'profile'
    },
    updateDraftProfile(payload: Partial<UserProfile>) {
      this.draftProfile = {
        ...this.draftProfile,
        ...payload,
      }
    },
    completeLogin() {
      const nickname = this.draftProfile.nickname.trim() || '微信用户'
      this.profile = {
        nickname,
        avatarUrl: this.draftProfile.avatarUrl || '',
      }
      this.isLoggedIn = true
      this.authPopupVisible = false
      this.authStep = 'prompt'
    },
    setSession(payload: {
      token: string
      user: LoginUser
      nickname?: string
      avatarUrl?: string
      keepPopupOpen?: boolean
    }) {
      this.token = payload.token
      this.user = payload.user
      this.profile = {
        nickname: payload.nickname?.trim() || payload.user.name || this.profile.nickname || '微信用户',
        avatarUrl: payload.avatarUrl || this.profile.avatarUrl || '',
      }
      this.draftProfile = {
        ...this.profile,
      }
      this.isLoggedIn = true
      if (!payload.keepPopupOpen) {
        this.authPopupVisible = false
        this.authStep = 'prompt'
      }
    },
    consumePendingRoute() {
      const route = this.pendingRoute
      this.pendingRoute = null
      return route
    },
    logout() {
      this.token = ''
      this.isLoggedIn = false
      this.user = null
      this.profile = createEmptyProfile()
      this.draftProfile = createEmptyProfile()
      this.pendingRoute = null
      this.authPopupVisible = false
      this.authStep = 'prompt'
    },
  },
})
