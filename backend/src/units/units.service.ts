import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitVo } from '@/units/vo';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async create(createUnitDto: CreateUnitDto) {
    // 检查名称或编码是否已存在
    const existing = await this.prisma.unit.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { name: createUnitDto.name },
          { code: createUnitDto.code },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('单位名称或编码已存在');
    }

    return UnitVo.fromEntity(await this.prisma.unit.create({
      data: createUnitDto,
    }));
  }

  async findAll() {
    return UnitVo.fromEntities(await this.prisma.unit.findMany({
      where: { deletedAt: null },
      orderBy: { sort: 'asc' },
    }));
  }

  async findOne(id: number) {
    const unit = await this.prisma.unit.findFirst({
      where: { id, deletedAt: null },
    });

    if (!unit) {
      throw new NotFoundException('单位不存在');
    }

    return UnitVo.fromEntity(unit);
  }

  async update(id: number, updateUnitDto: UpdateUnitDto) {
    const existing = await this.prisma.unit.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('单位不存在');
    }

    // 如果修改了名称或编码，检查是否与其他记录冲突
    if (updateUnitDto.name || updateUnitDto.code) {
      const conflict = await this.prisma.unit.findFirst({
        where: {
          id: { not: id },
          deletedAt: null,
          OR: [
            updateUnitDto.name ? { name: updateUnitDto.name } : undefined,
            updateUnitDto.code ? { code: updateUnitDto.code } : undefined,
          ].filter(Boolean) as any[],
        },
      });

      if (conflict) {
        throw new ConflictException('单位名称或编码已存在');
      }
    }

    return UnitVo.fromEntity(await this.prisma.unit.update({
      where: { id },
      data: updateUnitDto,
    }));
  }

  async remove(id: number) {
    const existing = await this.prisma.unit.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('单位不存在');
    }

    return this.prisma.unit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
