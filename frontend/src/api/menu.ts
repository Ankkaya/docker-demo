import api from './request'
import type { CreateMenuDto, UpdateMenuDto, Menu } from '@/types'

// 获取菜单列表（树形）
export const getMenus = () => {
  return api.get<any, Menu[]>('/menus')
}

// 获取菜单列表（扁平）
export const getMenusFlat = () => {
  return api.get<any, Menu[]>('/menus/flat')
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

// 根据角色获取菜单
export const getMenusByRole = (roleId: number) => {
  return api.get<any, Menu[]>(`/menus/role/${roleId}`)
}

// 根据用户获取菜单
export const getMenusByUser = (userId: number) => {
  return api.get<any, Menu[]>(`/menus/user/${userId}`)
}
