import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandVo } from '@/brands/vo';
import { MinioService } from '@/infrastructure/minio/minio.service';

@Injectable()
export class BrandsService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
  ) {}

  async create(createBrandDto: CreateBrandDto) {
    // 检查名称是否已存在
    const existing = await this.prisma.brand.findUnique({
      where: { name: createBrandDto.name },
    });

    if (existing) {
      throw new ConflictException('品牌名称已存在');
    }

    const brand = await this.prisma.brand.create({
      data: {
        ...createBrandDto,
        logo: this.minioService.normalizeStoredFileReference(createBrandDto.logo),
      },
    });
    return this.toBrandVo(brand);
  }

  async findAll() {
    const brands = await this.prisma.brand.findMany({
      where: { deletedAt: null },
      orderBy: { sort: 'asc' },
    });
    return Promise.all(brands.map(brand => this.toBrandVo(brand)));
  }

  async findOne(id: number) {
    const brand = await this.prisma.brand.findFirst({
      where: { id, deletedAt: null },
    });

    if (!brand) {
      throw new NotFoundException('品牌不存在');
    }

    return this.toBrandVo(brand);
  }

  async update(id: number, updateBrandDto: UpdateBrandDto) {
    const existing = await this.prisma.brand.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('品牌不存在');
    }

    // 检查名称是否与其他非删除记录冲突
    if (updateBrandDto.name) {
      const conflict = await this.prisma.brand.findFirst({
        where: {
          id: { not: id },
          name: updateBrandDto.name,
          deletedAt: null,
        },
      });

      if (conflict) {
        throw new ConflictException('品牌名称已存在');
      }
    }

    const updated = await this.prisma.brand.update({
      where: { id },
      data: {
        ...updateBrandDto,
        logo: updateBrandDto.logo === undefined
          ? undefined
          : this.minioService.normalizeStoredFileReference(updateBrandDto.logo),
      },
    });
    return this.toBrandVo(updated);
  }

  async remove(id: number) {
    const existing = await this.prisma.brand.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('品牌不存在');
    }

    return this.prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async toBrandVo(entity: any) {
    return BrandVo.fromEntity({
      ...entity,
      logo: await this.minioService.resolveStoredFileUrl(entity.logo),
    });
  }
}
