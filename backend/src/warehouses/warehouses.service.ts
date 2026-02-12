import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  async create(createWarehouseDto: CreateWarehouseDto) {
    // 检查编码是否已存在
    const existing = await this.prisma.warehouse.findUnique({
      where: { code: createWarehouseDto.code },
    });

    if (existing) {
      throw new ConflictException('仓库编码已存在');
    }

    // 如果设置为默认仓库，需要将其他仓库设为非默认
    if (createWarehouseDto.isDefault) {
      await this.prisma.warehouse.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.warehouse.create({
      data: createWarehouseDto,
    });
  }

  async findAll() {
    return this.prisma.warehouse.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
    });

    if (!warehouse) {
      throw new NotFoundException('仓库不存在');
    }

    return warehouse;
  }

  async update(id: number, updateWarehouseDto: UpdateWarehouseDto) {
    const existing = await this.prisma.warehouse.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('仓库不存在');
    }

    // 检查编码是否与其他记录冲突
    if (updateWarehouseDto.code) {
      const conflict = await this.prisma.warehouse.findFirst({
        where: {
          id: { not: id },
          code: updateWarehouseDto.code,
        },
      });

      if (conflict) {
        throw new ConflictException('仓库编码已存在');
      }
    }

    // 如果设置为默认仓库，需要将其他仓库设为非默认
    if (updateWarehouseDto.isDefault) {
      await this.prisma.warehouse.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.warehouse.update({
      where: { id },
      data: updateWarehouseDto,
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.warehouse.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('仓库不存在');
    }

    return this.prisma.warehouse.delete({
      where: { id },
    });
  }
}
