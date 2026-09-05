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

  // 按钮级权限：超级管理员由后端角色编码兜底，其余角色从已分配菜单中的按钮权限判断
  const hasPermission = (permission: string) => {
    if (user.value?.roles?.some(role => role.code === 'admin')) return true

    const visit = (items: Menu[]): boolean => items.some(item =>
      item.permission === permission || (item.children ? visit(item.children) : false))
    return visit(menus.value)
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
    hasPermission,
    logout,
    init
  }
})
