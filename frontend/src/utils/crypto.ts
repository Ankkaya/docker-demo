import JSEncrypt from 'jsencrypt'
import api from '@/api/request'

/**
 * 登录密码 RSA 加密工具
 *
 * 流程：
 *  1. 首次调用时拉取 /auth/public-key 获取后端 RSA 公钥并缓存（默认 10 分钟）
 *  2. 拼接 `${password}::${timestamp}` 后用公钥 PKCS1 加密为 base64
 *  3. 服务端解密后会校验 timestamp 在 5 分钟内，防止重放
 */

interface PublicKeyResponse {
  publicKey: string
  timestamp: number
}

interface CachedKey {
  publicKey: string
  /** 客户端本地过期时间戳 */
  expiresAt: number
}

const CACHE_TTL_MS = 10 * 60 * 1000
let cached: CachedKey | null = null
let pending: Promise<string> | null = null

async function fetchPublicKey(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt) {
    return cached.publicKey
  }
  if (!pending) {
    pending = api
      .get<PublicKeyResponse>('/auth/public-key')
      .then((res) => {
        cached = {
          publicKey: res.publicKey,
          expiresAt: Date.now() + CACHE_TTL_MS,
        }
        return res.publicKey
      })
      .finally(() => {
        pending = null
      })
  }
  return pending
}

/**
 * RSA 加密登录密码
 * @param plain 明文密码
 * @returns base64 密文（PKCS1 padding）
 */
export async function encryptPassword(plain: string): Promise<string> {
  const publicKey = await fetchPublicKey()
  const encrypt = new JSEncrypt()
  encrypt.setPublicKey(publicKey)
  const payload = `${plain}::${Date.now()}`
  const cipher = encrypt.encrypt(payload)
  if (!cipher) {
    throw new Error('密码加密失败，请刷新页面后重试')
  }
  return cipher
}

/** 测试用：清除本地缓存（例如服务端密钥轮换） */
export function clearPublicKeyCache(): void {
  cached = null
}
