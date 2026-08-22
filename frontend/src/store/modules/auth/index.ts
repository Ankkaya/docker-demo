import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Menu } from '@/types'
import { login as loginApi } from '@/api/auth'
import { getCurrentUser, getUserMenus } from '@/api/user'
import router from '@/router'
import { encryptPassword } from '@/utils/crypto'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref<User | null>(null)
  const menus = ref<Menu[]>([])
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value)

  // 登录（密码使用 RSA 公钥加密后传输）
  const login = async (username: string, password: string) => {
    loading.value = true
    try {
      const cipher = await encryptPassword(password)
      const res = await loginApi({ username, password: cipher })
      token.value = res.token
      user.value = res.user
      localStorage.setItem('token', res.token)
      await fetchMenus()
      return true
    } catch (error) {
      return false
    } finally {
      loading.value = false
    }
  }

  // 获取当前用户信息
  const fetchUser = async () => {
    if (!token.value) return
    try {
      const res = await getCurrentUser()
      user.value = res
    } catch (error) {
      logout()
    }
  }

  // 获取当前用户菜单
  const fetchMenus = async () => {
    if (!user.value) return
    try {
      const res = await getUserMenus(user.value.id)
      menus.value = res
    } catch (error) {
      console.error('获取菜单失败')
    }
  }

  // 登出
  const logout = () => {
    token.value = ''
    user.value = null
    menus.value = []
    localStorage.removeItem('token')
    router.push('/login')
  }

  // 初始化
  const init = async () => {
    if (token.value) {
      await fetchUser()
      await fetchMenus()
    }
  }

  return {
    token,
    user,
    menus,
    loading,
    isLoggedIn,
    login,
    fetchUser,
    fetchMenus,
    logout,
    init
  }
})
