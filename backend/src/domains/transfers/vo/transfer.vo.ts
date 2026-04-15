import { Transfer, TransferStatus, TransferItem } from '@prisma/client';

export class TransferItemVo {
  id: number;
  skuId: number;
  quantity: number;
  skuCode: string;
  productName: string;
  specs: Record<string, string>;

  static fromEntity(entity: TransferItem & { sku?: { skuCode: string; product: { name: string }; specs: any } }): TransferItemVo {
    const vo = new TransferItemVo();
    vo.id = entity.id;
    vo.skuId = entity.skuId;
    vo.quantity = entity.quantity;
    vo.skuCode = entity.sku?.skuCode || '';
    vo.productName = entity.sku?.product?.name || '';
    vo.specs = (entity.sku?.specs as Record<string, string>) || {};
    return vo;
  }

  static fromEntities(entities: (TransferItem & { sku?: { skuCode: string; product: { name: string }; specs: any } })[]): TransferItemVo[] {
    return entities.map(e => TransferItemVo.fromEntity(e));
  }
}

export class TransferVo {
  id: number;
  transferNo: string;
  fromId: number;
  fromName: string;
  toId: number;
  toName: string;
  status: TransferStatus;
  remark?: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  items: TransferItemVo[];

  static fromEntity(entity: Transfer & { 
    from: { name: string }; 
    to: { name: string };
    items: (TransferItem & { sku?: { skuCode: string; product: { name: string }; specs: any } })[];
  }): TransferVo {
    const vo = new TransferVo();
    vo.id = entity.id;
    vo.transferNo = entity.transferNo;
    vo.fromId = entity.fromId;
    vo.fromName = entity.from.name;
    vo.toId = entity.toId;
    vo.toName = entity.to.name;
    vo.status = entity.status;
    vo.remark = entity.remark || undefined;
    vo.createdBy = entity.createdBy;
    vo.createdAt = entity.createdAt;
    vo.updatedAt = entity.updatedAt;
    vo.items = TransferItemVo.fromEntities(entity.items);
    return vo;
  }

  static fromEntities(entities: (Transfer & { 
    from: { name: string }; 
    to: { name: string };
    items: (TransferItem & { sku?: { skuCode: string; product: { name: string }; specs: any } })[];
  })[]): TransferVo[] {
    return entities.map(e => TransferVo.fromEntity(e));
  }
}
