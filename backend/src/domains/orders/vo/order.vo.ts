// 订单明细VO
export class OrderItemVo {
  id: number;
  skuId: number;
  skuCode: string;
  skuName: string;
  productName: string;
  specs: Record<string, string>;
  quantity: number;
  shipped: number;
  price: number;
  amount: number;

  static fromEntity(entity: any): OrderItemVo {
    const vo = new OrderItemVo();
    vo.id = entity.id;
    vo.skuId = entity.skuId;
    vo.skuCode = entity.sku?.skuCode || '';
    vo.skuName = entity.sku?.product?.name || '';
    vo.productName = entity.sku?.product?.name || '';
    vo.specs = (entity.sku?.specs as Record<string, string>) || {};
    vo.quantity = entity.quantity;
    vo.shipped = entity.shipped;
    vo.price = Number(entity.price);
    vo.amount = Number(entity.amount);
    return vo;
  }

  static fromEntities(entities: any[]): OrderItemVo[] {
    return entities.map((e) => this.fromEntity(e));
  }
}

// 订单VO
export class OrderVo {
  id: number;
  orderNo: string;
  type: string;
  customerId: number;
  addressId?: number;
  customerName: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  totalAmount: number;
  discount: number;
  freight: number;
  payable: number;
  paid: number;
  status: string;
  payStatus: string;
  shipStatus: string;
  orderDate: Date;
  expireAt?: Date;
  payDate?: Date;
  shipDate?: Date;
  receiveDate?: Date;
  remark?: string;
  createdBy?: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: any): OrderVo {
    const vo = new OrderVo();
    vo.id = entity.id;
    vo.orderNo = entity.orderNo;
    vo.type = entity.type;
    vo.customerId = entity.customerId;
    vo.addressId = entity.addressId || undefined;
    vo.customerName = entity.customer?.name || '';
    vo.receiverName = entity.receiverName || undefined;
    vo.receiverPhone = entity.receiverPhone || undefined;
    vo.receiverAddress = entity.receiverAddress || undefined;
    vo.totalAmount = Number(entity.totalAmount);
    vo.discount = Number(entity.discount);
    vo.freight = Number(entity.freight);
    vo.payable = Number(entity.payable);
    vo.paid = Number(entity.paid);
    vo.status = entity.status;
    vo.payStatus = entity.payStatus;
    vo.shipStatus = entity.shipStatus;
    vo.orderDate = entity.orderDate;
    vo.expireAt = entity.expireAt || undefined;
    vo.payDate = entity.payDate || undefined;
    vo.shipDate = entity.shipDate || undefined;
    vo.receiveDate = entity.receiveDate || undefined;
    vo.remark = entity.remark || undefined;
    vo.createdBy = entity.createdBy || undefined;
    vo.createdAt = entity.createdAt;
    vo.updatedAt = entity.updatedAt;
    return vo;
  }

  static fromEntities(entities: any[]): OrderVo[] {
    return entities.map((e) => this.fromEntity(e));
  }
}

// 订单详情VO
export class OrderDetailVo extends OrderVo {
  items: OrderItemVo[];

  static fromEntity(entity: any): OrderDetailVo {
    const vo = new OrderDetailVo();
    Object.assign(vo, OrderVo.fromEntity(entity));
    vo.items = entity.items
      ? OrderItemVo.fromEntities(entity.items)
      : [];
    return vo;
  }
}
