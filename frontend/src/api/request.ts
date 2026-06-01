import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types/api'

// ==================== 自定义 Axios 实例类型 ====================
/**
 * 自定义 API 客户端接口
 * 
 * 后端返回标准格式: ApiResponse<T> = { code, message, data }
 * 响应拦截器会自动解包，返回 data 部分
 * 因此泛型参数 T 直接对应 data 的类型
 */
export interface ApiClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>
}

interface ApiErrorLike {
  response?: {
    status?: number
  }
  config?: Pick<AxiosRequestConfig, 'url'>
}

const isLoginRequest = (url?: string) => {
  return !!url && url.split('?')[0].endsWith('/auth/login')
}

export const shouldRedirectToLoginOnUnauthorized = (error: ApiErrorLike) => {
  return error.response?.status === 401 && !isLoginRequest(error.config?.url)
}

// ==================== 创建 Axios 实例 ====================
const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ==================== 请求拦截器 ====================
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ==================== 响应拦截器 ====================
instance.interceptors.response.use(
  (response): any => {
    const data = response.data as ApiResponse<unknown>

    // 标准格式 { code, message, data }，直接解包 data
    if (data && typeof data === 'object' && 'data' in data) {
      return data.data
    }

    // 非标准格式，直接返回原始数据（兼容旧接口）
    return data
  },
  (error) => {
    const { response } = error
    let errorMessage = '请求失败'
    
    // 处理HTTP错误
    if (response) {
      // 优先按 HTTP 状态码处理（部分 401 需要触发跳转）
      switch (response.status) {
        case 401:
          if (shouldRedirectToLoginOnUnauthorized(error)) {
            localStorage.removeItem('token')
            window.location.href = '/login'
            errorMessage = response.data?.message || '登录已过期'
          } else {
            errorMessage = response.data?.message || '用户名或密码错误'
          }
          break
        case 403:
          errorMessage = response.data?.message || '没有权限'
          break
        case 404:
          errorMessage = response.data?.message || '请求的资源不存在'
          break
        case 500:
          errorMessage = response.data?.message || '服务器错误'
          break
        default:
          errorMessage = response.data?.message || '请求失败'
      }
    } else {
      errorMessage = '网络连接异常'
    }
    
    return Promise.reject({ message: errorMessage, originalError: error })
  }
)

// ==================== 导出带类型的 API 客户端 ====================
const api = instance as unknown as ApiClient
export default api
