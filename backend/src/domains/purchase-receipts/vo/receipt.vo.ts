// 入库单VO
export class ReceiptItemVo {
  id: number;
  skuId: number;
  skuCode: string;
  barcode?: string;
  skuName: string;
  productName: string;
  specs: Record<string, string>;
  quantity: number;
  price: number;
  salePrice: number;

  private static normalizeSpecs(specs: unknown): Record<string, string> {
    if (Array.isArray(specs)) {
      return specs.reduce<Record<string, string>>((acc, item) => {
        if (item && typeof item === 'object') {
          const entry = item as { name?: unknown; value?: unknown };
          if (typeof entry.name === 'string' && entry.name) {
            acc[entry.name] = entry.value == null ? '' : String(entry.value);
          }
        }
        return acc;
      }, {});
    }

    if (specs && typeof specs === 'object') {
      return Object.entries(specs as Record<string, unknown>).reduce<Record<string, string>>(
        (acc, [key, value]) => {
          acc[key] = value == null ? '' : String(value);
          return acc;
        },
        {},
      );
    }

    return {};
  }

  static fromEntity(entity: any): ReceiptItemVo {
    const vo = new ReceiptItemVo();
    vo.id = entity.id;
    vo.skuId = entity.skuId;
    vo.skuCode = entity.sku?.skuCode || '';
    vo.barcode = entity.sku?.barcode || undefined;
    vo.skuName = entity.sku?.product?.name || '';
    vo.productName = entity.sku?.product?.name || '';
    vo.specs = this.normalizeSpecs(entity.sku?.specs);
    vo.quantity = entity.quantity;
    vo.price = Number(entity.price);
    vo.salePrice = Number(entity.sku?.salePrice || 0);
    return vo;
  }

  static fromEntities(entities: any[]): ReceiptItemVo[] {
    return entities.map((e) => this.fromEntity(e));
  }
}

export class ReceiptVo {
  id: number;
  receiptNo: string;
  purchaseId: number;
  purchaseNo: string;
  supplierName: string;
  warehouseId: number;
  warehouseName: string;
  totalAmount: number;
  status: string;
  remark?: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: any): ReceiptVo {
    const vo = new ReceiptVo();
    vo.id = entity.id;
    vo.receiptNo = entity.receiptNo;
    vo.purchaseId = entity.purchaseId;
    vo.purchaseNo = entity.purchase?.orderNo || '';
    vo.supplierName = entity.purchase?.supplier?.name || '';
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

  static fromEntities(entities: any[]): ReceiptVo[] {
    return entities.map((e) => this.fromEntity(e));
  }
}

export class ReceiptDetailVo extends ReceiptVo {
  items: ReceiptItemVo[];

  static fromEntity(entity: any): ReceiptDetailVo {
    const vo = new ReceiptDetailVo();
    Object.assign(vo, ReceiptVo.fromEntity(entity));
    vo.items = entity.items
      ? ReceiptItemVo.fromEntities(entity.items)
      : [];
    return vo;
  }
}
