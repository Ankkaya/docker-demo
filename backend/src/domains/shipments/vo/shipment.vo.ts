// 发货明细VO
export class ShipmentItemVo {
  id: number;
  skuId: number;
  skuCode: string;
  skuName: string;
  productName: string;
  specs: Record<string, string>;
  warehouseId: number;
  warehouseName: string;
  quantity: number;

  static fromEntity(entity: any): ShipmentItemVo {
    const vo = new ShipmentItemVo();
    vo.id = entity.id;
    vo.skuId = entity.skuId;
    vo.skuCode = entity.sku?.skuCode || '';
    vo.skuName = entity.sku?.product?.name || '';
    vo.productName = entity.sku?.product?.name || '';
    vo.specs = (entity.sku?.specs as Record<string, string>) || {};
    vo.warehouseId = entity.warehouseId;
    vo.warehouseName = entity.warehouse?.name || '';
    vo.quantity = entity.quantity;
    return vo;
  }

  static fromEntities(entities: any[]): ShipmentItemVo[] {
    return entities.map((e) => this.fromEntity(e));
  }
}

// 发货单VO
export class ShipmentVo {
  id: number;
  shipmentNo: string;
  orderId: number;
  orderNo: string;
  warehouseId: number;
  warehouseName: string;
  logisticsCompany?: string;
  trackingNo?: string;
  status: string;
  remark?: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: any): ShipmentVo {
    const vo = new ShipmentVo();
    const itemWarehouseNames = Array.isArray(entity.items)
      ? Array.from(
          new Set(
            entity.items
              .map((item: any) => item.warehouse?.name)
              .filter(Boolean),
          ),
        )
      : [];

    vo.id = entity.id;
    vo.shipmentNo = entity.shipmentNo;
    vo.orderId = entity.orderId;
    vo.orderNo = entity.order?.orderNo || '';
    vo.warehouseId = entity.warehouseId;
    vo.warehouseName = itemWarehouseNames.length > 1
      ? '多仓发货'
      : itemWarehouseNames[0] || entity.warehouse?.name || '';
    vo.logisticsCompany = entity.logisticsCompany || undefined;
    vo.trackingNo = entity.trackingNo || undefined;
    vo.status = entity.status;
    vo.remark = entity.remark || undefined;
    vo.createdBy = entity.createdBy;
    vo.createdAt = entity.createdAt;
    vo.updatedAt = entity.updatedAt;
    return vo;
  }

  static fromEntities(entities: any[]): ShipmentVo[] {
    return entities.map((e) => this.fromEntity(e));
  }
}

// 发货单详情VO
export class ShipmentDetailVo extends ShipmentVo {
  items: ShipmentItemVo[];

  static fromEntity(entity: any): ShipmentDetailVo {
    const vo = new ShipmentDetailVo();
    Object.assign(vo, ShipmentVo.fromEntity(entity));
    vo.items = entity.items
      ? ShipmentItemVo.fromEntities(entity.items)
      : [];
    return vo;
  }
}
