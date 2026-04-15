// 退货明细VO
export class ReturnItemVo {
  id: number;
  skuId: number;
  skuCode: string;
  skuName: string;
  productName: string;
  specs: Record<string, string>;
  quantity: number;
  price: number;
  amount: number;

  static fromEntity(entity: any): ReturnItemVo {
    const vo = new ReturnItemVo();
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

  static fromEntities(entities: any[]): ReturnItemVo[] {
    return entities.map((e) => this.fromEntity(e));
  }
}

// 退货单VO
export class ReturnVo {
  id: number;
  returnNo: string;
  receiptId: number;
  receiptNo: string;
  supplierId: number;
  supplierName: string;
  warehouseId: number;
  warehouseName: string;
  totalAmount: number;
  status: string;
  remark?: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: any): ReturnVo {
    const vo = new ReturnVo();
    vo.id = entity.id;
    vo.returnNo = entity.returnNo;
    vo.receiptId = entity.receiptId;
    vo.receiptNo = entity.receipt?.receiptNo || '';
    vo.supplierId = entity.supplierId;
    vo.supplierName = entity.supplier?.name || '';
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

  static fromEntities(entities: any[]): ReturnVo[] {
    return entities.map((e) => this.fromEntity(e));
  }
}

// 退货单详情VO
export class ReturnDetailVo extends ReturnVo {
  items: ReturnItemVo[];

  static fromEntity(entity: any): ReturnDetailVo {
    const vo = new ReturnDetailVo();
    Object.assign(vo, ReturnVo.fromEntity(entity));
    vo.items = entity.items
      ? ReturnItemVo.fromEntities(entity.items)
      : [];
    return vo;
  }
}
