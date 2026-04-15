/*
 * @Author: weisheng
 * @Date: 2025-04-17 15:58:11
 * @LastEditTime: 2025-06-15 21:47:22
 * @LastEditors: weisheng
 * @Description: Alova response and error handlers
 * @FilePath: /wot-starter/src/api/core/handlers.ts
 */
import type { Method } from 'alova'
import { useUserStore } from '@/store/userStore'

// Custom error class for API errors
export class ApiError extends Error {
  code: number
  data?: any
  handled: boolean

  constructor(message: string, code: number, data?: any, handled = false) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.data = data
    this.handled = handled
  }
}

// Define a type for the expected API response structure
interface ApiResponse {
  code: number
  message?: string
  msg?: string
  data?: any
  success?: boolean
  total?: number
  more?: boolean
}

// Handle successful responses
export async function handleAlovaResponse(
  response: UniApp.RequestSuccessCallbackResult | UniApp.UploadFileSuccessCallbackResult | UniApp.DownloadSuccessData,
) {
  const globalToast = useGlobalToast()
  const userStore = useUserStore()
  // Extract status code and data from UniApp response
  const { statusCode, data } = response as UniNamespace.RequestSuccessCallbackResult
  const json = data as ApiResponse
  const message = json?.message || json?.msg || '请求异常'
  const businessCode = Number(json?.code)

  // 处理401/403错误（如果不是在handleAlovaResponse中处理的）
  if ((statusCode === 401 || statusCode === 403)) {
    userStore.logout()
    userStore.openAuthPopup()
    globalToast.error({ msg: '登录已过期，请重新登录！', duration: 500 })

    throw new ApiError('登录已过期，请重新登录！', statusCode, data, true)
  }

  // Handle HTTP error status codes
  if (statusCode >= 400) {
    globalToast.error(message)
    throw new ApiError(message, statusCode, data, true)
  }

  // Log response in development
  if (import.meta.env.MODE === 'development') {
    console.log('[Alova Response]', json)
  }

  if (businessCode && businessCode !== 200) {
    if (businessCode === 401) {
      userStore.logout()
      userStore.openAuthPopup()
      globalToast.warning({ msg: message || '登录已过期，请重新登录！', duration: 500 })
    }
    else {
      globalToast.warning(message || '请求异常')
    }

    throw new ApiError(message || '请求异常', businessCode, json?.data, true)
  }

  // Return unwrapped data for successful responses
  return json?.data
}

// Handle request errors
export function handleAlovaError(error: any, method: Method) {
  const globalToast = useGlobalToast()
  const userStore = useUserStore()
  // Log error in development
  if (import.meta.env.MODE === 'development') {
    console.error('[Alova Error]', error, method)
  }

  // 处理401/403错误（如果不是在handleAlovaResponse中处理的）
  if (error instanceof ApiError && (error.code === 401 || error.code === 403)) {
    userStore.logout()
    userStore.openAuthPopup()
    if (!error.handled) {
      globalToast.error({ msg: '登录已过期，请重新登录！', duration: 500 })
      error.handled = true
    }
    throw error
  }

  if (error instanceof ApiError && error.handled) {
    throw error
  }

  // Handle different types of errors
  if (error.name === 'NetworkError') {
    globalToast.error('请求异常')
  }
  else if (error.name === 'TimeoutError') {
    globalToast.error('请求异常')
  }
  else if (error instanceof ApiError) {
    if (error.code >= 400) {
      globalToast.error(error.message || '请求异常')
    }
    else {
      globalToast.warning(error.message || '请求异常')
    }
    error.handled = true
  }
  else {
    globalToast.error('请求异常')
  }

  throw error
}
