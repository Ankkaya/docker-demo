import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierVo } from '@/suppliers/vo';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(createSupplierDto: CreateSupplierDto) {
    const existing = await this.prisma.supplier.findUnique({
      where: { code: createSupplierDto.code },
    });

    if (existing) {
      throw new ConflictException('供应商编码已存在');
    }

    const supplier = await this.prisma.supplier.create({
      data: createSupplierDto,
    });
    return SupplierVo.fromEntity(supplier);
  }

  async findAll() {
    const suppliers = await this.prisma.supplier.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return SupplierVo.fromEntities(suppliers);
  }

  async findOne(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id, deletedAt: null },
    });

    if (!supplier) {
      throw new NotFoundException('供应商不存在');
    }

    return SupplierVo.fromEntity(supplier);
  }

  async update(id: number, updateSupplierDto: UpdateSupplierDto) {
    const existing = await this.prisma.supplier.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('供应商不存在');
    }

    if (updateSupplierDto.code) {
      const conflict = await this.prisma.supplier.findFirst({
        where: {
          id: { not: id },
          code: updateSupplierDto.code,
          deletedAt: null,
        },
      });

      if (conflict) {
        throw new ConflictException('供应商编码已存在');
      }
    }

    const updated = await this.prisma.supplier.update({
      where: { id },
      data: updateSupplierDto,
    });
    return SupplierVo.fromEntity(updated);
  }

  async remove(id: number) {
    const existing = await this.prisma.supplier.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('供应商不存在');
    }

    return this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
