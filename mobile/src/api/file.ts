import { useUserStore } from '@/store/userStore'

export async function uploadAvatar(filePath: string) {
  const userStore = useUserStore()

  return new Promise<{ objectKey: string, url: string }>((resolve, reject) => {
    uni.uploadFile({
      url: `${import.meta.env.VITE_API_BASE_URL}/files/upload?path=avatars/mall-users`,
      filePath,
      name: 'file',
      header: userStore.token
        ? {
            Authorization: `Bearer ${userStore.token}`,
          }
        : {},
      success: (response) => {
        try {
          const payload = JSON.parse(response.data as string)
          if (payload?.code !== 200 || !payload?.data) {
            reject(new Error(payload?.message || '头像上传失败'))
            return
          }

          resolve(payload.data)
        }
        catch (error) {
          reject(error)
        }
      },
      fail: reject,
    })
  })
}
