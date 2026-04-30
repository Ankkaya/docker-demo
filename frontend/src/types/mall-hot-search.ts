export interface MallHotSearchKeyword {
  id: number;
  keyword: string;
  sort: number;
  isEnabled: boolean;
  searchCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMallHotSearchDto {
  keyword: string;
  sort?: number;
  isEnabled?: boolean;
}

export interface UpdateMallHotSearchDto extends Partial<CreateMallHotSearchDto> {}
