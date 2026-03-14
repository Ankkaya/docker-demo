import { InventoryLog, InventoryType } from '@prisma/client';

export class InventoryLogVo {
  id: number;
  type: InventoryType;
  typeName: string;
  skuId: number;
  skuCode: string;
  productName: string;
  specs: Record<string, string>;
  warehouseId: number;
  warehouseName: string;
  quantity: number;
  before: number;
  after: number;
  bizType?: string;
  bizNo?: string;
  remark?: string;
  createdAt: Date;

  static fromEntity(entity: InventoryLog & { 
    sku?: { 
      skuCode: string; 
      product: { name: string };
      specs: any;
    };
    warehouse?: { name: string };
  }): InventoryLogVo {
    const vo = new InventoryLogVo();
    vo.id = entity.id;
    vo.type = entity.type;
    vo.typeName = InventoryLogVo.getTypeName(entity.type);
    vo.skuId = entity.skuId;
    vo.skuCode = entity.sku?.skuCode || '';
    vo.productName = entity.sku?.product?.name || '';
    vo.specs = (entity.sku?.specs as Record<string, string>) || {};
    vo.warehouseId = entity.warehouseId;
    vo.warehouseName = entity.warehouse?.name || '';
    vo.quantity = entity.quantity;
    vo.before = entity.before;
    vo.after = entity.after;
    vo.bizType = entity.bizType || undefined;
    vo.bizNo = entity.bizNo || undefined;
    vo.remark = entity.remark || undefined;
    vo.createdAt = entity.createdAt;
    return vo;
  }

  static fromEntities(entities: (InventoryLog & { 
    sku?: { 
      skuCode: string; 
      product: { name: string };
      specs: any;
    };
    warehouse?: { name: string };
  })[]): InventoryLogVo[] {
    return entities.map(e => InventoryLogVo.fromEntity(e));
  }

  private static getTypeName(type: InventoryType): string {
    const typeNames: Record<InventoryType, string> = {
      'IN_PURCHASE': '采购入库',
      'IN_SALE_RETURN': '退货入库',
      'IN_TRANSFER': '调拨入库',
      'IN_ADJUST': '盘点入库',
      'OUT_SALE': '销售出库',
      'OUT_PURCHASE_RETURN': '采购退货',
      'OUT_TRANSFER': '调拨出库',
      'OUT_ADJUST': '盘点出库',
    };
    return typeNames[type] || type;
  }
}
