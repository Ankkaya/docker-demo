import { useUserStore } from '@/store/userStore'
import { handleAlovaResponse, handleAlovaError } from './core/handlers'
import type { Method } from 'alova'

async function uploadFile(
  path: string,
  filePath: string,
): Promise<{ objectKey: string; url: string }> {
  const userStore = useUserStore()
  const baseURL = import.meta.env.VITE_API_BASE_URL || ''

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${baseURL}${path}`,
      filePath,
      name: 'file',
      header: userStore.token
        ? { Authorization: `Bearer ${userStore.token}` }
        : {},
      success: async (response) => {
        try {
          const result = await handleAlovaResponse(response)
          resolve(result)
        }
        catch (error) {
          handleAlovaError(error, {} as Method)
          reject(error)
        }
      },
      fail: (error) => {
        handleAlovaError(error, {} as Method)
        reject(error)
      },
    })
  })
}

export async function uploadAvatar(filePath: string) {
  return uploadFile('/files/upload?path=avatars/mall-users', filePath)
}

export async function uploadReviewImage(filePath: string) {
  return uploadFile('/files/upload?path=reviews/mall', filePath)
}
