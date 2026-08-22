import { ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaymentMethod, PaymentStatus, PaymentType, PayStatus, ReceiptStatus } from '@prisma/client';
import { CreateAdjustmentDto } from '@/domains/adjustments/dto/create-adjustment.dto';
import { PaymentsService } from '@/domains/payments/payments.service';
import { PurchaseReceiptsService } from '@/domains/purchase-receipts/purchase-receipts.service';
import { MallBalanceService } from '@/applications/mall/mall-balance.service';
import { MallOrdersService } from '@/applications/mall/mall-orders.service';
import { Prisma } from '@prisma/client';

describe('finance and inventory regression', () => {
  it('rejects negative physical-count quantities', async () => {
    const dto = plainToInstance(CreateAdjustmentDto, {
      warehouseId: 1,
      items: [{ skuId: 2, actualQty: -1 }],
    });
    const errors = await validate(dto);
    expect(JSON.stringify(errors)).toContain('实盘数量不能为负数');
  });

  it('writes a completed SALE receipt back to order paid and payStatus atomically', async () => {
    const order: any = { id: 7, orderNo: 'SO-7', payable: new Prisma.Decimal(100), paid: new Prisma.Decimal(20) };
    const tx: any = {
      order: {
        findFirst: jest.fn().mockResolvedValue(order),
        update: jest.fn(async ({ data }: any) => {
          order.paid = data.paid;
          order.payStatus = data.payStatus;
          return order;
        }),
      },
      payment: {
        create: jest.fn(async ({ data }: any) => ({ id: 1, createdAt: new Date(), updatedAt: new Date(), ...data, order })),
      },
    };
    const prisma = { serializableTransaction: jest.fn((callback: any) => callback(tx)) };
    const service = new PaymentsService(prisma as any, {} as any);

    await service.create({
      type: PaymentType.RECEIPT,
      bizType: 'SALE',
      bizId: 7,
      amount: 80,
      method: PaymentMethod.BANK,
    }, 1);

    expect(order.paid.toFixed(2)).toBe('100.00');
    expect(order.payStatus).toBe(PayStatus.PAID);
    expect(tx.payment.create).toHaveBeenCalledTimes(1);
  });

  it('does not change stock when the same receipt confirmation loses the status claim', async () => {
    const receipt: any = {
      id: 3,
      status: ReceiptStatus.PENDING,
      deletedAt: null,
      warehouseId: 1,
      receiptNo: 'RK-3',
      items: [{ id: 1, skuId: 9, quantity: 2, price: 10 }],
      purchaseId: 4,
      purchase: { status: 'APPROVED', items: [], supplier: { name: '供应商' } },
    };
    const inventoryUpdate = jest.fn();
    const tx: any = {
      purchaseReceipt: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      inventory: { update: inventoryUpdate },
    };
    const prisma: any = {
      purchaseReceipt: { findFirst: jest.fn().mockResolvedValue(receipt) },
      serializableTransaction: jest.fn((callback: any) => callback(tx)),
    };
    const service = new PurchaseReceiptsService(prisma);

    await expect(service.confirm(3, 1)).rejects.toBeInstanceOf(ForbiddenException);
    expect(inventoryUpdate).not.toHaveBeenCalled();
  });

  it('credits a duplicate recharge success callback only once', async () => {
    const recharge: any = {
      id: 5,
      accountId: 8,
      customerId: 9,
      rechargeNo: 'RC-5',
      outTradeNo: 'WT-5',
      amount: new Prisma.Decimal(100),
      bonusAmount: new Prisma.Decimal(10),
      status: PaymentStatus.PENDING,
      thirdTradeNo: null,
      notifyAt: null,
      notifyPayload: null,
      remark: null,
      createdBy: 9,
    };
    const account: any = {
      id: 8,
      availableBalance: new Prisma.Decimal(0),
      totalRecharged: new Prisma.Decimal(0),
      totalPresented: new Prisma.Decimal(0),
    };
    const balanceLogCreate = jest.fn();
    const tx: any = {
      balanceRechargeOrder: {
        findFirst: jest.fn(async () => recharge),
        updateMany: jest.fn(async () => {
          if (recharge.status !== PaymentStatus.PENDING) return { count: 0 };
          recharge.status = PaymentStatus.COMPLETED;
          return { count: 1 };
        }),
        findUniqueOrThrow: jest.fn(async () => recharge),
      },
      balanceAccount: {
        findUnique: jest.fn(async () => account),
        update: jest.fn(async ({ data }: any) => {
          account.availableBalance = account.availableBalance.add(data.availableBalance.increment);
          account.totalRecharged = account.totalRecharged.add(data.totalRecharged.increment);
          account.totalPresented = account.totalPresented.add(data.totalPresented.increment);
        }),
        findUniqueOrThrow: jest.fn(async () => account),
      },
      balanceLog: { create: balanceLogCreate },
    };
    const prisma = { serializableTransaction: jest.fn((callback: any) => callback(tx)) };
    const couponAutoGrant = { grantRechargeCoupons: jest.fn() };
    const service = new MallBalanceService(prisma as any, {} as any, {} as any, couponAutoGrant as any);

    await (service as any).markRechargeSuccess('WT-5', { trade_state: 'SUCCESS' });
    await (service as any).markRechargeSuccess('WT-5', { trade_state: 'SUCCESS' });

    expect(account.availableBalance.toFixed(2)).toBe('110.00');
    expect(balanceLogCreate).toHaveBeenCalledTimes(1);
    expect(couponAutoGrant.grantRechargeCoupons).toHaveBeenCalledTimes(1);
  });

  it('allows only one of two concurrent balance payments when combined funds are insufficient', async () => {
    const orders = new Map<number, any>([
      [1, { id: 1, orderNo: 'MO-1', customerId: 9, type: 'MALL', payable: 80, paid: 0, payStatus: PayStatus.UNPAID, status: 'PENDING', couponReceiveId: null }],
      [2, { id: 2, orderNo: 'MO-2', customerId: 9, type: 'MALL', payable: 80, paid: 0, payStatus: PayStatus.UNPAID, status: 'PENDING', couponReceiveId: null }],
    ]);
    const account: any = { id: 4, customerId: 9, status: 'ACTIVE', availableBalance: new Prisma.Decimal(100) };
    const paymentCreate = jest.fn(async ({ data }: any) => ({ id: data.orderId, ...data }));
    const tx: any = {
      order: {
        findFirst: jest.fn(async ({ where }: any) => orders.get(where.id)),
        updateMany: jest.fn(async ({ where, data }: any) => {
          const order = orders.get(where.id);
          if (!order || order.payStatus === PayStatus.PAID) return { count: 0 };
          order.paid += Number(data.paid.increment);
          order.payStatus = data.payStatus;
          order.status = data.status;
          return { count: 1 };
        }),
        findUniqueOrThrow: jest.fn(async ({ where }: any) => orders.get(where.id)),
      },
      balanceAccount: {
        upsert: jest.fn(async () => account),
        updateMany: jest.fn(async ({ where, data }: any) => {
          if (account.availableBalance.lt(where.availableBalance.gte)) return { count: 0 };
          account.availableBalance = account.availableBalance.sub(data.availableBalance.decrement);
          return { count: 1 };
        }),
        findUnique: jest.fn(async () => account),
        findUniqueOrThrow: jest.fn(async () => account),
      },
      payment: {
        findMany: jest.fn().mockResolvedValue([]),
        create: paymentCreate,
      },
      balanceLog: { create: jest.fn() },
    };
    let transactionTail = Promise.resolve();
    const prisma = {
      serializableTransaction: jest.fn((callback: any) => {
        const result = transactionTail.then(() => callback(tx));
        transactionTail = result.then(() => undefined, () => undefined);
        return result;
      }),
    };
    const couponAutoGrant = { grantOrderCoupons: jest.fn() };
    const service = new MallOrdersService(prisma as any, {} as any, {} as any, {} as any, {} as any, couponAutoGrant as any);

    const results = await Promise.allSettled([
      (service as any).payOrderByBalance(9, 9, orders.get(1), 80),
      (service as any).payOrderByBalance(9, 9, orders.get(2), 80),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(paymentCreate).toHaveBeenCalledTimes(1);
    expect(account.availableBalance.toFixed(2)).toBe('20.00');
  });
});
