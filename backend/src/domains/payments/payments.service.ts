import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { PaymentStatus, PaymentType, Prisma, PurchaseStatus } from '@prisma/client';
import { PaymentVo } from './vo/payment.vo';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  // 创建收付款记录
  async create(createDto: CreatePaymentDto, userId: number) {
    const { type, bizType, bizId, amount, method, remark } = createDto;

    // 验证业务单据
    let orderNo = '';
    if (bizType === 'PURCHASE') {
      const purchase = await this.prisma.purchase.findFirst({
        where: { id: bizId, deletedAt: null },
      });
      if (!purchase) {
        throw new NotFoundException('采购订单不存在');
      }
      orderNo = purchase.orderNo;

      // 验证付款金额
      if (type === PaymentType.PAYMENT) {
        const remaining = Number(purchase.payable) - Number(purchase.paid);
        if (amount > remaining) {
          throw new BadRequestException(`付款金额超过未付金额(未付:${remaining})`);
        }
      }
    } else if (bizType === 'SALE') {
      const order = await this.prisma.order.findFirst({
        where: { id: bizId, deletedAt: null },
      });
      if (!order) {
        throw new NotFoundException('销售订单不存在');
      }
      orderNo = order.orderNo;

      // 验证收款金额
      if (type === PaymentType.RECEIPT) {
        const remaining = Number(order.payable) - Number(order.paid);
        if (amount > remaining) {
          throw new BadRequestException(`收款金额超过未收金额(未收:${remaining})`);
        }
      }
    } else {
      throw new BadRequestException('无效的业务类型');
    }

    // 创建收付款记录
    const data: any = {
      type,
      bizType,
      amount,
      method,
      status: PaymentStatus.COMPLETED, // 直接完成
      remark,
      createdBy: userId,
    };
    
    if (bizType === 'PURCHASE') {
      data.purchaseId = bizId;
    } else if (bizType === 'SALE') {
      data.orderId = bizId;
    }
    
    const payment = await this.prisma.payment.create({
      data,
      include: {
        purchase: { select: { orderNo: true } },
      },
    });

    // 更新采购订单的已付金额
    if (bizType === 'PURCHASE' && type === PaymentType.PAYMENT) {
      await this.prisma.purchase.update({
        where: { id: bizId },
        data: { paid: { increment: amount } },
      });
    }

    return PaymentVo.fromEntity(payment);
  }

  // 查询收付款列表
  async findAll(query: QueryPaymentDto) {
    const { type, bizType, status, method, keyword, mallOnly, page = 1, pageSize = 10 } = query;

    const where: Prisma.PaymentWhereInput = {
      deletedAt: null,
    };

    if (type) {
      where.type = type;
    }

    if (bizType) {
      where.bizType = bizType;
    }

    if (status) {
      where.status = status;
    }

    if (method) {
      where.method = method;
    }

    if (mallOnly) {
      where.order = {
        is: {
          type: 'MALL',
          deletedAt: null,
        },
      };
    }

    if (keyword) {
      where.OR = [
        { outTradeNo: { contains: keyword, mode: 'insensitive' } },
        { thirdTradeNo: { contains: keyword, mode: 'insensitive' } },
        { purchase: { is: { orderNo: { contains: keyword, mode: 'insensitive' } } } },
        { order: { is: { orderNo: { contains: keyword, mode: 'insensitive' } } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          purchase: { select: { orderNo: true } },
          order: { select: { orderNo: true, type: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: PaymentVo.fromEntities(data),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // 查询收付款详情
  async findOne(id: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, deletedAt: null },
      include: {
        purchase: { select: { orderNo: true } },
        order: { select: { orderNo: true, type: true } },
      },
    });

    if (!payment) {
      throw new NotFoundException('收付款记录不存在');
    }

    return PaymentVo.fromEntity(payment);
  }

  // 确认收付款
  async confirm(id: number, userId: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!payment) {
      throw new NotFoundException('收付款记录不存在');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new ForbiddenException('只有待确认的收付款记录可以确认');
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.COMPLETED },
      include: {
        purchase: { select: { orderNo: true } },
      },
    });

    // 更新业务单据的已付/已收金额
    if (payment.bizType === 'PURCHASE' && payment.type === PaymentType.PAYMENT && payment.purchaseId) {
      await this.prisma.purchase.update({
        where: { id: payment.purchaseId },
        data: { paid: { increment: payment.amount } },
      });
    } else if (payment.bizType === 'SALE' && payment.type === PaymentType.RECEIPT && payment.orderId) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { paid: { increment: payment.amount } },
      });
    }

    return PaymentVo.fromEntity(updated);
  }

  // 取消收付款
  async cancel(id: number, userId: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!payment) {
      throw new NotFoundException('收付款记录不存在');
    }

    if (payment.status === PaymentStatus.CANCELLED) {
      throw new BadRequestException('收付款记录已取消');
    }

    // 如果已确认，需要回滚金额
    if (payment.status === PaymentStatus.COMPLETED) {
      if (payment.bizType === 'PURCHASE' && payment.type === PaymentType.PAYMENT && payment.purchaseId) {
        const purchase = await this.prisma.purchase.findUnique({
          where: { id: payment.purchaseId },
        });
        if (purchase) {
          const newPaid = Math.max(0, Number(purchase.paid) - Number(payment.amount));
          await this.prisma.purchase.update({
            where: { id: payment.purchaseId },
            data: { paid: newPaid },
          });
        }
      } else if (payment.bizType === 'SALE' && payment.type === PaymentType.RECEIPT && payment.orderId) {
        const order = await this.prisma.order.findUnique({
          where: { id: payment.orderId },
        });
        if (order) {
          const newPaid = Math.max(0, Number(order.paid) - Number(payment.amount));
          await this.prisma.order.update({
            where: { id: payment.orderId },
            data: { paid: newPaid },
          });
        }
      }
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.CANCELLED },
      include: {
        purchase: { select: { orderNo: true } },
      },
    });

    return PaymentVo.fromEntity(updated);
  }

  // 删除收付款记录（软删除）
  async remove(id: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!payment) {
      throw new NotFoundException('收付款记录不存在');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new ForbiddenException('已完成的收付款记录不能删除');
    }

    await this.prisma.payment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  // 获取供应商应付款统计
  async getPayableStats(supplierId?: number) {
    const where: Prisma.PurchaseWhereInput = {
      deletedAt: null,
      status: { in: [PurchaseStatus.APPROVED, PurchaseStatus.PARTIAL, PurchaseStatus.COMPLETED] },
    };

    if (supplierId) {
      where.supplierId = supplierId;
    }

    const purchases = await this.prisma.purchase.findMany({
      where,
      select: {
        id: true,
        orderNo: true,
        payable: true,
        paid: true,
        supplier: { select: { id: true, name: true } },
      },
    });

    const stats = purchases.map((p) => ({
      purchaseId: p.id,
      orderNo: p.orderNo,
      supplierId: p.supplier.id,
      supplierName: p.supplier.name,
      payable: Number(p.payable),
      paid: Number(p.paid),
      unpaid: Number(p.payable) - Number(p.paid),
    }));

    const totalPayable = stats.reduce((sum, s) => sum + s.payable, 0);
    const totalPaid = stats.reduce((sum, s) => sum + s.paid, 0);
    const totalUnpaid = stats.reduce((sum, s) => sum + s.unpaid, 0);

    return {
      list: stats,
      summary: {
        totalPayable,
        totalPaid,
        totalUnpaid,
      },
    };
  }
}
