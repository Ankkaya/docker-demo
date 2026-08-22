import { BadRequestException } from '@nestjs/common';
import { CouponReceiveStatus } from '@prisma/client';
import { MallCouponsService } from '@/applications/mall/mall-coupons.service';

function createPrismaMock() {
  return {
    user: {
      findFirst: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
    },
    order: {
      count: jest.fn(),
    },
    balanceRechargeOrder: {
      count: jest.fn(),
    },
    couponReceive: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    coupon: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    serializableTransaction: jest.fn(),
  }
}

describe('MallCouponsService', () => {
  it('returns wallet summary for current user', async () => {
    const prisma = createPrismaMock()
    const customer = { id: 7, createdAt: new Date('2026-04-01T00:00:00.000Z') }
    prisma.user.findFirst.mockResolvedValue({ customer })
    prisma.customer.findFirst.mockResolvedValue(customer)
    prisma.order.count.mockResolvedValue(0)
    prisma.balanceRechargeOrder.count.mockResolvedValue(0)
    prisma.couponReceive.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3)
    prisma.coupon.findMany.mockResolvedValue([
      {
        id: 11,
        name: '新人券',
        code: 'CP001',
        discountAmount: 10,
        thresholdAmount: 50,
        totalCount: 100,
        receivedCount: 20,
        perLimit: 1,
        startTime: new Date('2026-04-01T00:00:00.000Z'),
        endTime: new Date('2026-04-30T00:00:00.000Z'),
        description: null,
        issueScopeType: 'ALL',
        useScopeType: 'ALL',
        issueRuleJson: null,
        useRuleJson: null,
        sceneType: 'COMMON',
        validType: 'FIXED',
        channelScope: [],
        sort: 0,
        isEnabled: true,
      },
    ])
    prisma.couponReceive.findMany.mockResolvedValue([])

    const service = new MallCouponsService(prisma as any)
    const result = await service.getSummaryByUserId(1)

    expect(result).toEqual({
      unusedCount: 2,
      usedCount: 1,
      expiredCount: 3,
      claimableCount: 1,
    })
  })

  it('claims coupon for current user', async () => {
    const prisma = createPrismaMock()
    prisma.user.findFirst.mockResolvedValue({ customer: { id: 9, createdAt: new Date('2026-04-01T00:00:00.000Z') } })
    prisma.order.count.mockResolvedValue(0)
    prisma.balanceRechargeOrder.count.mockResolvedValue(0)
    prisma.serializableTransaction.mockImplementation(async (callback: any) => callback({
      coupon: {
        findFirst: jest.fn().mockResolvedValue({
          id: 5,
          isEnabled: true,
          isPublic: true,
          issueType: 'USER_CLAIM',
          issueScopeType: 'ALL',
          issueRuleJson: null,
          validType: 'FIXED',
          validDelayDays: 0,
          validDays: null,
          startTime: new Date('2026-04-01T00:00:00.000Z'),
          endTime: new Date('2026-04-30T00:00:00.000Z'),
          claimStartTime: null,
          claimEndTime: null,
          perLimit: 2,
          dailyLimit: null,
          totalCount: 10,
          receivedCount: 1,
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      couponReceive: {
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue({
          id: 100,
          status: CouponReceiveStatus.UNUSED,
        }),
      },
    }))

    const service = new MallCouponsService(prisma as any)
    const result = await service.claimByUserId(1, 5)

    expect(result).toEqual({
      success: true,
      message: '领取成功',
    })
  })

  it('throws when user has no customer profile', async () => {
    const prisma = createPrismaMock()
    prisma.user.findFirst.mockResolvedValue({ customer: null })

    const service = new MallCouponsService(prisma as any)

    await expect(service.findWalletByUserId(1, { status: 'UNUSED' })).rejects.toBeInstanceOf(BadRequestException)
  })
})
