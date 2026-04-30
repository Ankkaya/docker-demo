import { ApiProperty } from '@nestjs/swagger';

export class MallOrderItemVo {
  @ApiProperty({ description: '订单明细ID' })
  orderItemId: number;

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

  @ApiProperty({ description: '是否已评价' })
  reviewed: boolean;

  @ApiProperty({ description: '当前是否可评价' })
  canReview: boolean;
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

  @ApiProperty({ description: '是否还有待评价商品' })
  hasPendingReview: boolean;

  @ApiProperty({ description: '已评价商品数量' })
  reviewedItemCount: number;

  @ApiProperty({ description: '待评价商品数量' })
  pendingReviewItemCount: number;
}

export class MallOrderListMetaVo {
  @ApiProperty({ description: '当前页码' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  pageSize: number;

  @ApiProperty({ description: '总记录数' })
  total: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;
}

export class MallOrderListResponseVo {
  @ApiProperty({ description: '订单列表', type: [MallOrderListItemVo] })
  data: MallOrderListItemVo[];

  @ApiProperty({ description: '分页信息', type: MallOrderListMetaVo })
  meta: MallOrderListMetaVo;
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

  @ApiProperty({ description: '取消时间', nullable: true })
  cancelDate?: Date | null;

  @ApiProperty({ description: '发货时间', nullable: true })
  shipDate?: Date | null;

  @ApiProperty({ description: '收货时间', nullable: true })
  receiveDate?: Date | null;

  @ApiProperty({ description: '支付方式', nullable: true })
  paymentMethod?: string | null;

  @ApiProperty({ description: '优惠券领取记录 ID', nullable: true })
  couponReceiveId?: number | null;

  @ApiProperty({ description: '优惠券名称', nullable: true })
  couponName?: string | null;

  @ApiProperty({ description: '物流公司编码（快递100 公司编码）', nullable: true })
  logisticsCompany?: string | null;

  @ApiProperty({ description: '物流单号', nullable: true })
  trackingNo?: string | null;

  @ApiProperty({ description: '发货单号', nullable: true })
  shipmentNo?: string | null;
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

  @ApiProperty({ description: '优惠金额' })
  discount: number;

  @ApiProperty({ description: '优惠券领取记录 ID', nullable: true })
  couponReceiveId: number | null;

  @ApiProperty({ description: '优惠券名称', nullable: true })
  couponName: string | null;

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
  @ApiProperty({ description: '支付单ID', nullable: true })
  paymentId: number | null;

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

  @ApiProperty({ description: '支付单状态' })
  paymentStatus: string;

  @ApiProperty({ description: '支付方式', nullable: true })
  method: string | null;

  @ApiProperty({ description: '商户支付单号', nullable: true })
  outTradeNo: string | null;

  @ApiProperty({ description: '支付完成时间', nullable: true })
  payDate: Date | null;

  @ApiProperty({
    description: '微信小程序支付参数',
    required: false,
    nullable: true,
    example: {
      appId: 'wx123',
      timeStamp: '1712736000',
      nonceStr: 'abc123',
      package: 'prepay_id=wx201410272009395522657a690389285100',
      signType: 'RSA',
      paySign: 'xxxx',
    },
  })
  paymentConfig?: {
    appId: string;
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: string;
    paySign: string;
  } | null;
}
