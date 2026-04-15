import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { QueryPurchaseDto } from './dto/query-purchase.dto';
import { AuditPurchaseDto, AuditAction } from './dto/audit-purchase.dto';
import { PurchaseStatus, Prisma } from '@prisma/client';
import { PurchaseVo, PurchaseDetailVo } from './vo/purchase.vo';

// 生成采购单号
function generateOrderNo(): string {
  const date = new Date();
  const prefix = 'CG';
  const dateStr =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
}

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  // 创建采购订单
  async create(createDto: CreatePurchaseDto, userId: number) {
    const { supplierId, warehouseId, items, discount = 0, remark, deliveryDate } = createDto;

    // 验证供应商
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) {
      throw new NotFoundException('供应商不存在');
    }

    // 验证仓库
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId },
    });
    if (!warehouse) {
      throw new NotFoundException('仓库不存在');
    }

    // 验证商品明细
    if (!items || items.length === 0) {
      throw new BadRequestException('采购商品不能为空');
    }

    // 计算总金额
    let totalAmount = 0;
    for (const item of items) {
      const sku = await this.prisma.productSku.findFirst({
        where: { id: item.skuId, deletedAt: null },
        include: { product: true },
      });
      if (!sku) {
        throw new NotFoundException(`商品SKU(ID:${item.skuId})不存在`);
      }
      totalAmount += item.quantity * item.price;
    }

    const payable = totalAmount - discount;

    // 创建采购订单
    const purchase = await this.prisma.purchase.create({
      data: {
        orderNo: generateOrderNo(),
        supplierId,
        warehouseId,
        totalAmount,
        discount,
        payable,
        paid: 0,
        status: PurchaseStatus.PENDING,
        orderDate: new Date(),
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        remark,
        createdBy: userId,
        items: {
          create: items.map((item) => ({
            skuId: item.skuId,
            quantity: item.quantity,
            price: item.price,
            amount: item.quantity * item.price,
            received: 0,
          })),
        },
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          include: {
            sku: {
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    return PurchaseDetailVo.fromEntity({
      ...purchase,
      warehouse: { id: warehouseId, name: warehouse.name },
    });
  }

  // 查询采购订单列表
  async findAll(query: QueryPurchaseDto) {
    const { keyword, supplierId, status, page = 1, pageSize = 10 } = query;

    const where: Prisma.PurchaseWhereInput = {
      deletedAt: null,
    };

    if (keyword) {
      where.orderNo = { contains: keyword };
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
          _count: {
            select: { items: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchase.count({ where }),
    ]);
    
    // 获取仓库信息
    const warehouseIds = [...new Set(data.map((p) => p.warehouseId))];
    const warehouses = await this.prisma.warehouse.findMany({
      where: { id: { in: warehouseIds } },
      select: { id: true, name: true },
    });
    const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));
    
    const dataWithWarehouse = data.map((p) => ({
      ...p,
      warehouse: warehouseMap.get(p.warehouseId) || { id: p.warehouseId, name: '' },
    }));

    return {
      data: PurchaseVo.fromEntities(dataWithWarehouse),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // 查询采购订单详情
  async findOne(id: number) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id, deletedAt: null },
      include: {
        supplier: { select: { id: true, name: true, contact: true, phone: true } },
        items: {
          include: {
            sku: {
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
        receipts: {
          where: { deletedAt: null },
          select: {
            id: true,
            receiptNo: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new NotFoundException('采购订单不存在');
    }
    
    // 查询仓库信息
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: purchase.warehouseId },
      select: { id: true, name: true },
    });

    return PurchaseDetailVo.fromEntity({
      ...purchase,
      warehouse: warehouse || { id: purchase.warehouseId, name: '' },
    });
  }

  // 更新采购订单（仅在待审核状态可更新）
  async update(id: number, updateDto: UpdatePurchaseDto) {
    const existing = await this.prisma.purchase.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });

    if (!existing) {
      throw new NotFoundException('采购订单不存在');
    }

    if (existing.status !== PurchaseStatus.PENDING) {
      throw new ForbiddenException('只有待审核的采购订单可以修改');
    }

    const { items, ...otherData } = updateDto;

    // 使用事务更新
    const updated = await this.prisma.$transaction(async (tx) => {
      // 计算新的金额
      let totalAmount = Number(existing.totalAmount);
      let discount = otherData.discount !== undefined ? otherData.discount : Number(existing.discount);

      // 如果更新了明细，重新计算金额
      if (items && items.length > 0) {
        totalAmount = 0;
        for (const item of items) {
          totalAmount += item.quantity * item.price;
        }

        // 删除旧明细
        await tx.purchaseItem.deleteMany({
          where: { purchaseId: id },
        });

        // 创建新明细
        await tx.purchaseItem.createMany({
          data: items.map((item) => ({
            purchaseId: id,
            skuId: item.skuId,
            quantity: item.quantity,
            price: item.price,
            amount: item.quantity * item.price,
            received: 0,
          })),
        });
      }

      const payable = totalAmount - discount;

      // 更新订单
      const updatedPurchase = await tx.purchase.update({
        where: { id },
        data: {
          ...otherData,
          totalAmount,
          discount,
          payable,
          deliveryDate: otherData.deliveryDate
            ? new Date(otherData.deliveryDate)
            : undefined,
        },
        include: {
          supplier: { select: { id: true, name: true } },
          items: {
            include: {
              sku: {
                include: {
                  product: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      });
      
      // 查询仓库信息
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: updatedPurchase.warehouseId },
        select: { id: true, name: true },
      });
      
      return {
        ...updatedPurchase,
        warehouse: warehouse || { id: updatedPurchase.warehouseId, name: '' },
      };
    });

    return PurchaseDetailVo.fromEntity(updated);
  }

  // 审核采购订单
  async audit(id: number, auditDto: AuditPurchaseDto, userId: number) {
    const existing = await this.prisma.purchase.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('采购订单不存在');
    }

    if (existing.status !== PurchaseStatus.PENDING) {
      throw new ForbiddenException('只有待审核的采购订单可以进行审核操作');
    }

    const newStatus =
      auditDto.action === AuditAction.APPROVE
        ? PurchaseStatus.APPROVED
        : PurchaseStatus.CANCELLED;

    const updated = await this.prisma.purchase.update({
      where: { id },
      data: { status: newStatus },
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          include: {
            sku: {
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
    
    // 查询仓库信息
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: updated.warehouseId },
      select: { id: true, name: true },
    });

    return PurchaseDetailVo.fromEntity({
      ...updated,
      warehouse: warehouse || { id: updated.warehouseId, name: '' },
    });
  }

  // 取消采购订单
  async cancel(id: number, userId: number) {
    const existing = await this.prisma.purchase.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('采购订单不存在');
    }

    if (existing.status === PurchaseStatus.COMPLETED) {
      throw new ForbiddenException('已完成的采购订单不能取消');
    }

    if (existing.status === PurchaseStatus.CANCELLED) {
      throw new BadRequestException('采购订单已取消');
    }

    const updated = await this.prisma.purchase.update({
      where: { id },
      data: { status: PurchaseStatus.CANCELLED },
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          include: {
            sku: {
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
    
    // 查询仓库信息
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: updated.warehouseId },
      select: { id: true, name: true },
    });

    return PurchaseDetailVo.fromEntity({
      ...updated,
      warehouse: warehouse || { id: updated.warehouseId, name: '' },
    });
  }

  // 删除采购订单（软删除）
  async remove(id: number) {
    const existing = await this.prisma.purchase.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('采购订单不存在');
    }

    if (existing.status === PurchaseStatus.COMPLETED) {
      throw new ForbiddenException('已完成的采购订单不能删除');
    }

    await this.prisma.purchase.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }
}
