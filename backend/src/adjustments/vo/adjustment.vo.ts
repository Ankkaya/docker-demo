import { Adjustment, AdjustmentStatus, AdjustmentItem } from '@prisma/client';

export class AdjustmentItemVo {
  id: number;
  skuId: number;
  bookQty: number;
  actualQty: number;
  diffQty: number;
  skuCode: string;
  productName: string;
  specs: Record<string, string>;

  static fromEntity(entity: AdjustmentItem & { sku?: { skuCode: string; product: { name: string }; specs: any } }): AdjustmentItemVo {
    const vo = new AdjustmentItemVo();
    vo.id = entity.id;
    vo.skuId = entity.skuId;
    vo.bookQty = entity.bookQty;
    vo.actualQty = entity.actualQty;
    vo.diffQty = entity.diffQty;
    vo.skuCode = entity.sku?.skuCode || '';
    vo.productName = entity.sku?.product?.name || '';
    vo.specs = (entity.sku?.specs as Record<string, string>) || {};
    return vo;
  }

  static fromEntities(entities: (AdjustmentItem & { sku?: { skuCode: string; product: { name: string }; specs: any } })[]): AdjustmentItemVo[] {
    return entities.map(e => AdjustmentItemVo.fromEntity(e));
  }
}

export class AdjustmentVo {
  id: number;
  adjustNo: string;
  warehouseId: number;
  warehouseName: string;
  status: AdjustmentStatus;
  remark?: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  items: AdjustmentItemVo[];

  static fromEntity(entity: Adjustment & { 
    warehouse: { name: string };
    items: (AdjustmentItem & { sku?: { skuCode: string; product: { name: string }; specs: any } })[];
  }): AdjustmentVo {
    const vo = new AdjustmentVo();
    vo.id = entity.id;
    vo.adjustNo = entity.adjustNo;
    vo.warehouseId = entity.warehouseId;
    vo.warehouseName = entity.warehouse.name;
    vo.status = entity.status;
    vo.remark = entity.remark || undefined;
    vo.createdBy = entity.createdBy;
    vo.createdAt = entity.createdAt;
    vo.updatedAt = entity.updatedAt;
    vo.items = AdjustmentItemVo.fromEntities(entity.items);
    return vo;
  }

  static fromEntities(entities: (Adjustment & { 
    warehouse: { name: string };
    items: (AdjustmentItem & { sku?: { skuCode: string; product: { name: string }; specs: any } })[];
  })[]): AdjustmentVo[] {
    return entities.map(e => AdjustmentVo.fromEntity(e));
  }
}
