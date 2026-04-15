// ==================== 商品管理类型定义 ====================

// SKU状态
export type SkuStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

// 规格项
export interface SkuSpec {
  name: string;
  value: string;
}

// 规格模板项
export interface SpecTemplateItem {
  name: string;
  values: string[];
}

// SKU
export interface ProductSku {
  id: number;
  skuCode: string;
  productId: number;
  specs: SkuSpec[];
  costPrice: number;
  salePrice: number;
  marketPrice?: number;
  image?: string;
  mallInfo?: {
    salePrice?: number;
    marketPrice?: number;
    image?: string;
  } | null;
  barcode?: string;
  weight?: number;
  volume?: number;
  isDefault: boolean;
  sort: number;
  status: SkuStatus;
  createdAt: string;
  updatedAt: string;
  // 库存信息
  inventories?: Inventory[];
}

// 库存
export interface Inventory {
  id: number;
  skuId: number;
  warehouseId: number;
  warehouse?: {
    id: number;
    name: string;
    code: string;
  };
  quantity: number;
  locked: number;
  available: number;
  minStock: number;
  maxStock: number;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

// 商品SPU
export interface Product {
  id: number;
  name: string;
  spuCode: string;
  categoryId: number;
  category?: {
    id: number;
    name: string;
  };
  brandId?: number;
  brand?: {
    id: number;
    name: string;
  };
  description?: string;
  detail?: string;
  mainImage?: string;
  images: string[];
  mallInfo?: {
    name?: string;
    description?: string;
    detail?: string;
    mainImage?: string;
    images?: string[];
    isHot?: boolean;
    hotSort?: number;
    hotLabel?: string;
  } | null;
  unitId: number;
  unit?: {
    id: number;
    name: string;
  };
  specTemplate?: SpecTemplateItem[];
  isEnabled: boolean;
  mallEnabled: boolean;
  totalAvailable?: number;
  hasStock?: boolean;
  mallStatus?: 'PENDING_INFO' | 'READY' | 'LISTED' | 'NO_STOCK' | 'DISABLED';
  skus: ProductSku[];
  createdAt: string;
  updatedAt: string;
}

// 创建SKU的DTO
export interface CreateSkuDto {
  skuCode?: string;
  specs: SkuSpec[];
  costPrice: number;
  salePrice: number;
  marketPrice?: number;
  image?: string;
  barcode?: string;
  weight?: number;
  volume?: number;
  isDefault?: boolean;
  sort?: number;
}

// 初始库存DTO
export interface InitialInventoryDto {
  warehouseId: number;
  quantity: number;
  minStock?: number;
  maxStock?: number;
}

// 创建商品DTO
export interface CreateProductDto {
  name: string;
  spuCode?: string;
  categoryId: number;
  brandId?: number;
  description?: string;
  detail?: string;
  mainImage?: string;
  images?: string[];
  unitId: number;
  specTemplate?: SpecTemplateItem[];
  isEnabled?: boolean;
  mallEnabled?: boolean;
  skus: CreateSkuDto[];
  initialInventories?: InitialInventoryDto[];
}

// 更新商品DTO
export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface UpdateProductMallDto {
  name?: string;
  description?: string;
  detail?: string;
  mainImage?: string;
  images?: string[];
  mallEnabled?: boolean;
  isHot?: boolean;
  hotSort?: number;
  hotLabel?: string;
  skuMallInfos?: {
    skuId: number;
    salePrice?: number;
    marketPrice?: number;
    image?: string;
  }[];
}

// 更新商品启用状态DTO
export interface UpdateProductEnabledDto {
  isEnabled: boolean;
}

// 更新SKU的DTO
export interface UpdateSkuDto {
  costPrice?: number;
  salePrice?: number;
  marketPrice?: number;
  image?: string;
  barcode?: string;
  weight?: number;
  volume?: number;
  isDefault?: boolean;
  sort?: number;
  status?: SkuStatus;
}

// 更新库存DTO
export interface UpdateInventoryDto {
  quantity?: number;
  minStock?: number;
  maxStock?: number;
  location?: string;
}

// 查询商品参数
export interface QueryProductParams {
  keyword?: string;
  categoryId?: number;
  brandId?: number;
  isEnabled?: boolean;
  mallEnabled?: boolean;
  hasStock?: boolean;
  page?: number;
  pageSize?: number;
}

// 查询库存参数
export interface QueryInventoryParams {
  skuId?: number;
  warehouseId?: number;
  spuCode?: string;
  skuCode?: string;
  productName?: string;
  page?: number;
  pageSize?: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
