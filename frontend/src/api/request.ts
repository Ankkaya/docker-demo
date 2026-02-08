import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
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

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const data = response.data;
    
    // 检查是否是标准格式
    if (data && typeof data === 'object' && 'code' in data && 'message' in data && 'data' in data) {
      // 如果是标准格式，检查业务状态码
      if (data.code >= 200 && data.code < 300) {
        return data.data;
      } else {
        // 业务错误，返回包含错误信息的对象
        return Promise.reject({ message: data.message || '请求失败', data });
      }
    }
    
    // 如果不是标准格式，直接返回数据（兼容旧接口）
    return data;
  },
  (error) => {
    const { response } = error;
    let errorMessage = '请求失败';
    
    // 处理HTTP错误
    if (response) {
      // 检查是否是标准错误格式
      if (response.data && typeof response.data === 'object' && 'message' in response.data) {
        errorMessage = response.data.message;
      } else {
        // 处理HTTP状态码错误
        switch (response.status) {
          case 401:
            localStorage.removeItem('token');
            window.location.href = '/login';
            errorMessage = '登录已过期';
            break;
          case 403:
            errorMessage = '没有权限';
            break;
          case 404:
            errorMessage = '请求的资源不存在';
            break;
          case 500:
            errorMessage = '服务器错误';
            break;
          default:
            errorMessage = response.data?.message || '请求失败';
        }
      }
    } else {
      errorMessage = '网络连接异常';
    }
    
    return Promise.reject({ message: errorMessage, originalError: error });
  }
)

export default api
