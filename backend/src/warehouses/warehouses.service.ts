import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { WarehouseVo } from '@/warehouses/vo';

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  async create(createWarehouseDto: CreateWarehouseDto) {
    // 检查编码是否已存在（排除已删除的）
    const existing = await this.prisma.warehouse.findFirst({
      where: { code: createWarehouseDto.code, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException('仓库编码已存在');
    }

    // 如果设置为默认仓库，需要将其他仓库设为非默认
    if (createWarehouseDto.isDefault) {
      await this.prisma.warehouse.updateMany({
        where: { isDefault: true, deletedAt: null },
        data: { isDefault: false },
      });
    }

    const warehouse = await this.prisma.warehouse.create({
      data: createWarehouseDto,
    });
    return WarehouseVo.fromEntity(warehouse);
  }

  async findAll() {
    const warehouses = await this.prisma.warehouse.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return WarehouseVo.fromEntities(warehouses);
  }

  async findOne(id: number) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, deletedAt: null },
    });

    if (!warehouse) {
      throw new NotFoundException('仓库不存在');
    }

    return WarehouseVo.fromEntity(warehouse);
  }

  async update(id: number, updateWarehouseDto: UpdateWarehouseDto) {
    const existing = await this.prisma.warehouse.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('仓库不存在');
    }

    // 检查编码是否与其他记录冲突（排除已删除的）
    if (updateWarehouseDto.code) {
      const conflict = await this.prisma.warehouse.findFirst({
        where: {
          id: { not: id },
          code: updateWarehouseDto.code,
          deletedAt: null,
        },
      });

      if (conflict) {
        throw new ConflictException('仓库编码已存在');
      }
    }

    // 如果设置为默认仓库，需要将其他仓库设为非默认
    if (updateWarehouseDto.isDefault) {
      await this.prisma.warehouse.updateMany({
        where: { isDefault: true, id: { not: id }, deletedAt: null },
        data: { isDefault: false },
      });
    }

    const warehouse = await this.prisma.warehouse.update({
      where: { id },
      data: updateWarehouseDto,
    });
    return WarehouseVo.fromEntity(warehouse);
  }

  async remove(id: number) {
    const existing = await this.prisma.warehouse.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('仓库不存在');
    }

    return this.prisma.warehouse.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
