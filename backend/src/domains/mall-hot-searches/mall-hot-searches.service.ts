import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateMallHotSearchDto } from './dto/create-mall-hot-search.dto';
import { UpdateMallHotSearchDto } from './dto/update-mall-hot-search.dto';
import { MallHotSearchVo } from './vo';

@Injectable()
export class MallHotSearchesService {
  constructor(private readonly prisma: PrismaService) {}

  private get mallHotSearchKeywordModel() {
    return (this.prisma as any).mallHotSearchKeyword;
  }

  async create(dto: CreateMallHotSearchDto) {
    const keyword = this.normalizeKeyword(dto.keyword);
    await this.ensureKeywordUnique(keyword);

    const entity = await this.mallHotSearchKeywordModel.create({
      data: {
        keyword,
        sort: dto.sort ?? 0,
        isEnabled: dto.isEnabled ?? true,
      },
    });

    return MallHotSearchVo.fromEntity(entity);
  }

  async findAll() {
    const list = await this.mallHotSearchKeywordModel.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });

    return MallHotSearchVo.fromEntities(list);
  }

  async findEnabled(limit?: number) {
    const list = await this.mallHotSearchKeywordModel.findMany({
      where: {
        deletedAt: null,
        isEnabled: true,
      },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      take: limit,
    });

    return MallHotSearchVo.fromEntities(list);
  }

  async findOne(id: number) {
    const entity = await this.mallHotSearchKeywordModel.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!entity) {
      throw new NotFoundException('热门搜索词不存在');
    }

    return MallHotSearchVo.fromEntity(entity);
  }

  async update(id: number, dto: UpdateMallHotSearchDto) {
    const existing = await this.mallHotSearchKeywordModel.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('热门搜索词不存在');
    }

    const data: Record<string, any> = {};

    if (dto.keyword !== undefined) {
      const keyword = this.normalizeKeyword(dto.keyword);
      await this.ensureKeywordUnique(keyword, id);
      data.keyword = keyword;
    }

    if (dto.sort !== undefined) {
      data.sort = dto.sort;
    }

    if (dto.isEnabled !== undefined) {
      data.isEnabled = dto.isEnabled;
    }

    const entity = await this.mallHotSearchKeywordModel.update({
      where: { id },
      data,
    });

    return MallHotSearchVo.fromEntity(entity);
  }

  async remove(id: number) {
    const existing = await this.mallHotSearchKeywordModel.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('热门搜索词不存在');
    }

    await this.mallHotSearchKeywordModel.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  private normalizeKeyword(keyword?: string) {
    const normalizedKeyword = keyword?.trim();
    if (!normalizedKeyword) {
      throw new BadRequestException('请输入热门搜索词');
    }
    return normalizedKeyword;
  }

  private async ensureKeywordUnique(keyword: string, excludeId?: number) {
    const existing = await this.mallHotSearchKeywordModel.findFirst({
      where: {
        keyword,
        deletedAt: null,
        id: excludeId ? { not: excludeId } : undefined,
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('热门搜索词已存在');
    }
  }
}
