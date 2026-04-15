import api from './request'
import type { BannerApi } from '@/types/api/basic-data.api'

export const getBanners = () => {
  return api.get<BannerApi.List>('/banners')
}

export const getBanner = (id: number) => {
  return api.get<BannerApi.Detail>(`/banners/${id}`)
}

export const createBanner = (data: BannerApi.CreateParams) => {
  return api.post<BannerApi.Create>('/banners', data)
}

export const updateBanner = (id: number, data: BannerApi.UpdateParams) => {
  return api.patch<BannerApi.Update>(`/banners/${id}`, data)
}

export const deleteBanner = (id: number) => {
  return api.delete<BannerApi.Delete>(`/banners/${id}`)
}
