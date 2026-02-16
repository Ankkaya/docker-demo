// 采购订单VO
export class PurchaseItemVo {
  id: number;
  skuId: number;
  skuCode: string;
  skuName: string;
  productName: string;
  specs: Record<string, string>;
  quantity: number;
  received: number;
  price: number;
  amount: number;

  static fromEntity(entity: any): PurchaseItemVo {
    const vo = new PurchaseItemVo();
    vo.id = entity.id;
    vo.skuId = entity.skuId;
    vo.skuCode = entity.sku?.skuCode || '';
    vo.skuName = entity.sku?.product?.name || '';
    vo.productName = entity.sku?.product?.name || '';
    vo.specs = (entity.sku?.specs as Record<string, string>) || {};
    vo.quantity = entity.quantity;
    vo.received = entity.received;
    vo.price = Number(entity.price);
    vo.amount = Number(entity.amount);
    return vo;
  }

  static fromEntities(entities: any[]): PurchaseItemVo[] {
    return entities.map((e) => this.fromEntity(e));
  }
}

export class PurchaseVo {
  id: number;
  orderNo: string;
  supplierId: number;
  supplierName: string;
  warehouseId: number;
  warehouseName: string;
  totalAmount: number;
  discount: number;
  payable: number;
  paid: number;
  status: string;
  orderDate: Date;
  deliveryDate?: Date;
  remark?: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: any): PurchaseVo {
    const vo = new PurchaseVo();
    vo.id = entity.id;
    vo.orderNo = entity.orderNo;
    vo.supplierId = entity.supplierId;
    vo.supplierName = entity.supplier?.name || '';
    vo.warehouseId = entity.warehouseId;
    vo.warehouseName = entity.warehouse?.name || '';
    vo.totalAmount = Number(entity.totalAmount);
    vo.discount = Number(entity.discount);
    vo.payable = Number(entity.payable);
    vo.paid = Number(entity.paid);
    vo.status = entity.status;
    vo.orderDate = entity.orderDate;
    vo.deliveryDate = entity.deliveryDate || undefined;
    vo.remark = entity.remark || undefined;
    vo.createdBy = entity.createdBy;
    vo.createdAt = entity.createdAt;
    vo.updatedAt = entity.updatedAt;
    return vo;
  }

  static fromEntities(entities: any[]): PurchaseVo[] {
    return entities.map((e) => this.fromEntity(e));
  }
}

export class PurchaseDetailVo extends PurchaseVo {
  items: PurchaseItemVo[];

  static fromEntity(entity: any): PurchaseDetailVo {
    const vo = new PurchaseDetailVo();
    Object.assign(vo, PurchaseVo.fromEntity(entity));
    vo.items = entity.items
      ? PurchaseItemVo.fromEntities(entity.items)
      : [];
    return vo;
  }
}
