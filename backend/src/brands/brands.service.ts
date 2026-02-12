import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async create(createBrandDto: CreateBrandDto) {
    // 检查名称是否已存在
    const existing = await this.prisma.brand.findUnique({
      where: { name: createBrandDto.name },
    });

    if (existing) {
      throw new ConflictException('品牌名称已存在');
    }

    return this.prisma.brand.create({
      data: createBrandDto,
    });
  }

  async findAll() {
    return this.prisma.brand.findMany({
      orderBy: { sort: 'asc' },
    });
  }

  async findOne(id: number) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
    });

    if (!brand) {
      throw new NotFoundException('品牌不存在');
    }

    return brand;
  }

  async update(id: number, updateBrandDto: UpdateBrandDto) {
    const existing = await this.prisma.brand.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('品牌不存在');
    }

    // 检查名称是否与其他记录冲突
    if (updateBrandDto.name) {
      const conflict = await this.prisma.brand.findFirst({
        where: {
          id: { not: id },
          name: updateBrandDto.name,
        },
      });

      if (conflict) {
        throw new ConflictException('品牌名称已存在');
      }
    }

    return this.prisma.brand.update({
      where: { id },
      data: updateBrandDto,
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.brand.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('品牌不存在');
    }

    return this.prisma.brand.delete({
      where: { id },
    });
  }
}
