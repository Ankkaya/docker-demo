import { ApiProperty } from '@nestjs/swagger';

export class MallOrderItemVo {
  @ApiProperty({ description: '商品ID' })
  productId: number;

  @ApiProperty({ description: 'SKU ID' })
  skuId: number;

  @ApiProperty({ description: '商品名称' })
  productName: string;

  @ApiProperty({ description: 'SKU 编码' })
  skuCode: string;

  @ApiProperty({ description: '规格' })
  specs: Record<string, string>;

  @ApiProperty({ description: '商品图片', nullable: true })
  image: string | null;

  @ApiProperty({ description: '单价' })
  price: number;

  @ApiProperty({ description: '数量' })
  quantity: number;

  @ApiProperty({ description: '金额' })
  amount: number;
}

export class MallOrderListItemVo {
  @ApiProperty({ description: '订单ID' })
  id: number;

  @ApiProperty({ description: '订单号' })
  orderNo: string;

  @ApiProperty({ description: '订单状态' })
  status: string;

  @ApiProperty({ description: '支付状态' })
  payStatus: string;

  @ApiProperty({ description: '发货状态' })
  shipStatus: string;

  @ApiProperty({ description: '下单时间' })
  orderDate: Date;

  @ApiProperty({ description: '支付截止时间', nullable: true })
  expireAt?: Date | null;

  @ApiProperty({ description: '商品总额' })
  totalAmount: number;

  @ApiProperty({ description: '应付金额' })
  payable: number;

  @ApiProperty({ description: '已付金额' })
  paid: number;

  @ApiProperty({ description: '商品件数' })
  itemCount: number;

  @ApiProperty({ description: '订单商品', type: [MallOrderItemVo] })
  items: MallOrderItemVo[];
}

export class MallOrderDetailVo extends MallOrderListItemVo {
  @ApiProperty({ description: '收货人', nullable: true })
  receiverName?: string | null;

  @ApiProperty({ description: '收货电话', nullable: true })
  receiverPhone?: string | null;

  @ApiProperty({ description: '收货地址', nullable: true })
  receiverAddress?: string | null;

  @ApiProperty({ description: '优惠金额' })
  discount: number;

  @ApiProperty({ description: '运费' })
  freight: number;

  @ApiProperty({ description: '支付时间', nullable: true })
  payDate?: Date | null;

  @ApiProperty({ description: '发货时间', nullable: true })
  shipDate?: Date | null;

  @ApiProperty({ description: '收货时间', nullable: true })
  receiveDate?: Date | null;

  @ApiProperty({ description: '支付方式', nullable: true })
  paymentMethod?: string | null;
}

export class MallCreateOrderVo {
  @ApiProperty({ description: '订单ID' })
  id: number;

  @ApiProperty({ description: '订单号' })
  orderNo: string;

  @ApiProperty({ description: '订单来源', enum: ['cart', 'product-detail'] })
  source: string;

  @ApiProperty({ description: '商品总金额' })
  totalAmount: number;

  @ApiProperty({ description: '应付金额' })
  payable: number;

  @ApiProperty({ description: '商品件数' })
  itemCount: number;

  @ApiProperty({ description: '订单状态' })
  status: string;

  @ApiProperty({ description: '支付状态' })
  payStatus: string;

  @ApiProperty({ description: '支付截止时间', required: false, nullable: true })
  expireAt?: Date | null;
}

export class MallPayOrderVo {
  @ApiProperty({ description: '订单ID' })
  id: number;

  @ApiProperty({ description: '订单号' })
  orderNo: string;

  @ApiProperty({ description: '支付状态' })
  payStatus: string;

  @ApiProperty({ description: '订单状态' })
  status: string;

  @ApiProperty({ description: '已付金额' })
  paid: number;

  @ApiProperty({ description: '支付完成时间' })
  payDate: Date;
}
