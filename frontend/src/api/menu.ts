import api from './request'
import type { CreateMenuDto, UpdateMenuDto, Menu } from '@/types'

// 获取菜单列表
// format: 'tree' | 'flat' - tree: 树形结构(默认), flat: 扁平列表
export const getMenus = (format?: 'tree' | 'flat') => {
  return api.get<any, Menu[]>('/menus', { params: { format } })
}

// 获取菜单列表（扁平）- 兼容旧方法，建议使用 getMenus('flat')
export const getMenusFlat = () => {
  return api.get<any, Menu[]>('/menus', { params: { format: 'flat' } })
}

// 获取单个菜单
export const getMenu = (id: number) => {
  return api.get<any, Menu>(`/menus/${id}`)
}

// 创建菜单
export const createMenu = (data: CreateMenuDto) => {
  return api.post<any, Menu>('/menus', data)
}

// 更新菜单
export const updateMenu = (id: number, data: UpdateMenuDto) => {
  return api.patch<any, Menu>(`/menus/${id}`, data)
}

// 删除菜单
export const deleteMenu = (id: number) => {
  return api.delete(`/menus/${id}`)
}

// 根据角色获取菜单 - 已迁移到 roles.ts，保留别名以兼容旧代码
export const getMenusByRole = (roleId: number, format?: 'tree' | 'flat') => {
  return api.get<any, Menu[]>(`/roles/${roleId}/menus`, { params: { format } })
}

// 根据用户获取菜单 - 已迁移到 users.ts，保留别名以兼容旧代码
export const getMenusByUser = (userId: number, format?: 'tree' | 'flat') => {
  return api.get<any, Menu[]>(`/users/${userId}/menus`, { params: { format } })
}
