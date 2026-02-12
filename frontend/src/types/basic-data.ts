// ==================== 基础数据类型定义 ====================

// 计量单位
export interface Unit {
  id: number;
  name: string;
  code: string;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitDto {
  name: string;
  code: string;
  sort?: number;
}

export interface UpdateUnitDto extends Partial<CreateUnitDto> {}

// 商品分类
export interface Category {
  id: number;
  name: string;
  code: string;
  parentId?: number;
  level: number;
  sort: number;
  icon?: string;
  image?: string;
  isEnabled: boolean;
  parent?: Category;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  code: string;
  parentId?: number;
  level?: number;
  sort?: number;
  icon?: string;
  image?: string;
  isEnabled?: boolean;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

// 品牌
export interface Brand {
  id: number;
  name: string;
  logo?: string;
  description?: string;
  sort: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandDto {
  name: string;
  logo?: string;
  description?: string;
  sort?: number;
  isEnabled?: boolean;
}

export interface UpdateBrandDto extends Partial<CreateBrandDto> {}

// 仓库
export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address?: string;
  contact?: string;
  phone?: string;
  isDefault: boolean;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseDto {
  name: string;
  code: string;
  address?: string;
  contact?: string;
  phone?: string;
  isDefault?: boolean;
  isEnabled?: boolean;
}

export interface UpdateWarehouseDto extends Partial<CreateWarehouseDto> {}

// 供应商
export interface Supplier {
  id: number;
  name: string;
  code: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  bankName?: string;
  bankAccount?: string;
  taxNo?: string;
  creditLimit?: number;
  period: number;
  isEnabled: boolean;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  name: string;
  code: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  bankName?: string;
  bankAccount?: string;
  taxNo?: string;
  creditLimit?: number;
  period?: number;
  isEnabled?: boolean;
  remark?: string;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {}

// 客户类型
export type CustomerType = 'INDIVIDUAL' | 'COMPANY';

// 客户
export interface Customer {
  id: number;
  name: string;
  code: string;
  type: CustomerType;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
  period: number;
  isEnabled: boolean;
  remark?: string;
  userId?: number;
  user?: {
    id: number;
    username: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  name: string;
  code: string;
  type?: CustomerType;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
  period?: number;
  isEnabled?: boolean;
  remark?: string;
  userId?: number;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}
