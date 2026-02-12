import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(createSupplierDto: CreateSupplierDto) {
    // 检查编码是否已存在
    const existing = await this.prisma.supplier.findUnique({
      where: { code: createSupplierDto.code },
    });

    if (existing) {
      throw new ConflictException('供应商编码已存在');
    }

    return this.prisma.supplier.create({
      data: createSupplierDto,
    });
  }

  async findAll() {
    return this.prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException('供应商不存在');
    }

    return supplier;
  }

  async update(id: number, updateSupplierDto: UpdateSupplierDto) {
    const existing = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('供应商不存在');
    }

    // 检查编码是否与其他记录冲突
    if (updateSupplierDto.code) {
      const conflict = await this.prisma.supplier.findFirst({
        where: {
          id: { not: id },
          code: updateSupplierDto.code,
        },
      });

      if (conflict) {
        throw new ConflictException('供应商编码已存在');
      }
    }

    return this.prisma.supplier.update({
      where: { id },
      data: updateSupplierDto,
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('供应商不存在');
    }

    return this.prisma.supplier.delete({
      where: { id },
    });
  }
}
