import api from './request'
import type {
  ProductApi,
  SkuApi,
  InventoryApi,
  MallApi,
} from '@/types/api/index.ts'

// ==================== 商品管理 API ====================

// 获取商品列表
export const getProducts = (params?: ProductApi.QueryParams) => {
  return api.get<ProductApi.List>('/products', { params })
}

// 获取商品详情
export const getProduct = (id: number) => {
  return api.get<ProductApi.Detail>(`/products/${id}`)
}

// 创建商品（含SKU）
export const createProduct = (data: ProductApi.CreateParams) => {
  return api.post<ProductApi.Create>('/products', data)
}

// 更新商品
export const updateProduct = (id: number, data: ProductApi.UpdateParams) => {
  return api.patch<ProductApi.Update>(`/products/${id}`, data)
}

// 获取商品商城信息
export const getProductMallInfo = (id: number) => {
  return api.get<ProductApi.MallDetail>(`/products/${id}/mall-info`)
}

// 更新商品商城信息
export const updateProductMallInfo = (id: number, data: ProductApi.UpdateMallParams) => {
  return api.patch<ProductApi.MallUpdate>(`/products/${id}/mall-info`, data)
}

// 删除商品
export const deleteProduct = (id: number) => {
  return api.delete<ProductApi.Delete>(`/products/${id}`)
}

// 更新商品状态（上下架）
export const updateProductStatus = (id: number, data: ProductApi.UpdateStatusParams) => {
  return api.patch<ProductApi.UpdateStatus>(`/products/${id}/status`, data)
}

// 获取商品的SKU列表
export const getProductSkus = (productId: number) => {
  return api.get<ProductApi.GetSkus>(`/products/${productId}/skus`)
}

// ==================== SKU管理 API ====================

// 更新SKU
export const updateSku = (skuId: number, data: SkuApi.UpdateParams) => {
  return api.patch<SkuApi.Update>(`/skus/${skuId}`, data)
}

// 更新SKU价格
export const updateSkuPrice = (skuId: number, data: SkuApi.UpdatePriceParams) => {
  return api.patch<SkuApi.UpdatePrice>(`/skus/${skuId}/price`, data)
}

// ==================== 库存管理 API ====================

// 获取库存列表
export const getInventories = (params?: InventoryApi.QueryParams) => {
  return api.get<InventoryApi.List>('/inventories', { params })
}

// 获取库存详情
export const getInventory = (id: number) => {
  return api.get<InventoryApi.Detail>(`/inventories/${id}`)
}

// 获取SKU的库存明细
export const getInventoryBySkuId = (skuId: number) => {
  return api.get<InventoryApi.DetailBySku>(`/inventories/sku/${skuId}`)
}

// 更新库存
export const updateInventory = (id: number, data: InventoryApi.UpdateParams) => {
  return api.patch<InventoryApi.Update>(`/inventories/${id}`, data)
}

// 初始化库存
export const initializeInventory = (data: InventoryApi.InitializeParams) => {
  return api.post<InventoryApi.Initialize>('/inventories/initialize', data)
}

// 获取库存汇总统计
export const getInventoryStats = (warehouseId?: number) => {
  return api.get<InventoryApi.Stats>('/inventories/stats', { params: { warehouseId } })
}

// 获取库存预警列表
export const getInventoryWarnings = (params?: { warehouseId?: number; type?: 'low' | 'high'; page?: number; pageSize?: number }) => {
  return api.get<InventoryApi.Warnings>('/inventories/warnings', { params })
}

// ==================== 商城前台 API ====================

// 获取商城商品列表
export const getMallProducts = (params?: MallApi.QueryProductParams) => {
  return api.get<MallApi.ProductList>('/mall/products', { params })
}

// 获取商城商品详情
export const getMallProductDetail = (id: number) => {
  return api.get<MallApi.ProductDetail>(`/mall/products/${id}`)
}

// 获取商城分类列表
export const getMallCategories = () => {
  return api.get<MallApi.CategoryList>('/mall/categories')
}

// 获取商城品牌列表
export const getMallBrands = () => {
  return api.get<MallApi.BrandList>('/mall/brands')
}
