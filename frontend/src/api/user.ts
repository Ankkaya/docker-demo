import api from './request'
import type { CreateUserDto, User, PageData } from '@/types'

// 获取用户列表
export const getUsers = async (params?: { page?: number; pageSize?: number }) => {
  const res = await api.get<any>('/users', { params })
  const data = res?.data ?? res
  if (data && Array.isArray(data.items)) {
    return data as PageData<User>
  }
  if (Array.isArray(data)) {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? data.length
    return { items: data, total: data.length, page, pageSize } as PageData<User>
  }
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10
  return { items: [], total: 0, page, pageSize } as PageData<User>
}

// 获取单个用户
export const getUser = (id: number) => {
  return api.get<any, User>(`/users/${id}`)
}

// 创建用户
export const createUser = (data: CreateUserDto) => {
  return api.post<any, User>('/users', data)
}

// 获取用户角色
export const getUserRoles = (userId: number) => {
  return api.get(`/users/${userId}/roles`)
}

// 分配用户角色
export const assignUserRoles = (userId: number, roleIds: number[]) => {
  return api.patch(`/users/${userId}/roles`, { roleIds })
}

// 删除用户
export const deleteUser = (id: number) => {
  return api.delete(`/users/${id}`)
}
