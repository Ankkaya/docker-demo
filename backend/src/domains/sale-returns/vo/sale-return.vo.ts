// 退货明细VO
export class SaleReturnItemVo {
  id: number;
  skuId: number;
  skuCode: string;
  skuName: string;
  productName: string;
  specs: Record<string, string>;
  quantity: number;
  price: number;
  amount: number;

  static fromEntity(entity: any): SaleReturnItemVo {
    const vo = new SaleReturnItemVo();
    vo.id = entity.id;
    vo.skuId = entity.skuId;
    vo.skuCode = entity.sku?.skuCode || '';
    vo.skuName = entity.sku?.product?.name || '';
    vo.productName = entity.sku?.product?.name || '';
    vo.specs = (entity.sku?.specs as Record<string, string>) || {};
    vo.quantity = entity.quantity;
    vo.price = Number(entity.price);
    vo.amount = Number(entity.amount);
    return vo;
  }

  static fromEntities(entities: any[]): SaleReturnItemVo[] {
    return entities.map((e) => this.fromEntity(e));
  }
}

// 销售退货单VO
export class SaleReturnVo {
  id: number;
  returnNo: string;
  shipmentId: number;
  shipmentNo: string;
  customerId: number;
  customerName: string;
  warehouseId: number;
  warehouseName: string;
  totalAmount: number;
  status: string;
  remark?: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: any): SaleReturnVo {
    const vo = new SaleReturnVo();
    vo.id = entity.id;
    vo.returnNo = entity.returnNo;
    vo.shipmentId = entity.shipmentId;
    vo.shipmentNo = entity.shipment?.shipmentNo || '';
    vo.customerId = entity.customerId;
    vo.customerName = entity.customer?.name || '';
    vo.warehouseId = entity.warehouseId;
    vo.warehouseName = entity.warehouse?.name || '';
    vo.totalAmount = Number(entity.totalAmount);
    vo.status = entity.status;
    vo.remark = entity.remark || undefined;
    vo.createdBy = entity.createdBy;
    vo.createdAt = entity.createdAt;
    vo.updatedAt = entity.updatedAt;
    return vo;
  }

  static fromEntities(entities: any[]): SaleReturnVo[] {
    return entities.map((e) => this.fromEntity(e));
  }
}

// 销售退货单详情VO
export class SaleReturnDetailVo extends SaleReturnVo {
  items: SaleReturnItemVo[];

  static fromEntity(entity: any): SaleReturnDetailVo {
    const vo = new SaleReturnDetailVo();
    Object.assign(vo, SaleReturnVo.fromEntity(entity));
    vo.items = entity.items
      ? SaleReturnItemVo.fromEntities(entity.items)
      : [];
    return vo;
  }
}
