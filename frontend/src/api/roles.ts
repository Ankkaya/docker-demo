import api from './request'
import type { Role, Menu } from '@/types'

// 获取角色列表
export const getRoles = () => {
  return api.get<any, Role[]>('/roles')
}

// 获取单个角色
export const getRole = (id: number) => {
  return api.get<any, Role>(`/roles/${id}`)
}

// 创建角色
export const createRole = (data: { name: string; code: string; description?: string; menuIds?: number[] }) => {
  return api.post<any, Role>('/roles', data)
}

// 更新角色
export const updateRole = (id: number, data: { name?: string; code?: string; description?: string; menuIds?: number[] }) => {
  return api.patch<any, Role>(`/roles/${id}`, data)
}

// 删除角色
export const deleteRole = (id: number) => {
  return api.delete(`/roles/${id}`)
}

// 获取角色菜单
export const getRoleMenus = (roleId: number, format?: 'tree' | 'flat') => {
  return api.get<any, Menu[]>(`/roles/${roleId}/menus`, { params: { format } })
}

// 为角色分配菜单
export const assignRoleMenus = (roleId: number, menuIds: number[]) => {
  return api.patch(`/roles/${roleId}/menus`, { menuIds })
}
