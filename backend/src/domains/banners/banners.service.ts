import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { MinioService } from '@/infrastructure/minio/minio.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { BannerVo } from './vo';

@Injectable()
export class BannersService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
  ) {}

  async create(createBannerDto: CreateBannerDto) {
    await this.ensureTitleUnique(createBannerDto.title);
    const payload = this.buildCreatePayload(createBannerDto);
    const banner = await this.prisma.banner.create({ data: payload });
    return this.toBannerVo(banner);
  }

  async findAll() {
    const banners = await this.prisma.banner.findMany({
      where: { deletedAt: null },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });
    return Promise.all(banners.map(banner => this.toBannerVo(banner)));
  }

  async findEnabled() {
    const banners = await this.prisma.banner.findMany({
      where: {
        deletedAt: null,
        isEnabled: true,
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });
    return Promise.all(banners.map(banner => this.toBannerVo(banner)));
  }

  async findOne(id: number) {
    const banner = await this.prisma.banner.findFirst({
      where: { id, deletedAt: null },
    });

    if (!banner) {
      throw new NotFoundException('轮播图不存在');
    }

    return this.toBannerVo(banner);
  }

  async update(id: number, updateBannerDto: UpdateBannerDto) {
    const existing = await this.prisma.banner.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('轮播图不存在');
    }

    if (updateBannerDto.title && updateBannerDto.title !== existing.title) {
      await this.ensureTitleUnique(updateBannerDto.title, id);
    }

    const payload = this.buildUpdatePayload(updateBannerDto);
    const updated = await this.prisma.banner.update({
      where: { id },
      data: payload,
    });

    return this.toBannerVo(updated);
  }

  async remove(id: number) {
    const existing = await this.prisma.banner.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('轮播图不存在');
    }

    return this.prisma.banner.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async ensureTitleUnique(title: string, excludeId?: number) {
    const existing = await this.prisma.banner.findFirst({
      where: {
        title,
        deletedAt: null,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    if (existing) {
      throw new ConflictException('轮播图标题已存在');
    }
  }

  private buildCreatePayload(dto: CreateBannerDto) {
    const title = dto.title?.trim();
    const tag = dto.tag?.trim() || null;
    const subtitle = dto.subtitle?.trim() || null;
    const image = this.minioService.normalizeStoredFileReference(dto.image);
    const jumpEnabled = dto.jumpEnabled ?? false;
    const jumpPath = dto.jumpPath?.trim() || null;

    if (!title) {
      throw new BadRequestException('请输入轮播图标题');
    }

    if (!image) {
      throw new BadRequestException('请上传图片或填写图片地址');
    }

    if (jumpEnabled && !jumpPath) {
      throw new BadRequestException('开启跳转后必须填写跳转路径');
    }

    return {
      title,
      tag,
      subtitle,
      image,
      jumpEnabled,
      jumpPath: jumpEnabled ? jumpPath : null,
      sort: dto.sort ?? 0,
      remark: dto.remark?.trim() || null,
      isEnabled: dto.isEnabled ?? true,
    };
  }

  private buildUpdatePayload(dto: UpdateBannerDto) {
    const jumpEnabled = dto.jumpEnabled ?? false;
    const jumpPath = dto.jumpPath?.trim() || null;
    const payload: Record<string, any> = {};

    if (dto.title !== undefined) {
      const title = dto.title.trim();
      if (!title) {
        throw new BadRequestException('请输入轮播图标题');
      }
      payload.title = title;
    }

    if (dto.tag !== undefined) {
      payload.tag = dto.tag?.trim() || null;
    }

    if (dto.subtitle !== undefined) {
      payload.subtitle = dto.subtitle?.trim() || null;
    }

    if (dto.image !== undefined) {
      const image = this.minioService.normalizeStoredFileReference(dto.image);
      if (!image) {
        throw new BadRequestException('请上传图片或填写图片地址');
      }
      payload.image = image;
    }

    if (jumpEnabled && !jumpPath) {
      throw new BadRequestException('开启跳转后必须填写跳转路径');
    }

    if (dto.jumpEnabled !== undefined || dto.jumpPath !== undefined) {
      payload.jumpEnabled = jumpEnabled;
      payload.jumpPath = jumpEnabled ? jumpPath : null;
    }

    if (dto.sort !== undefined) {
      payload.sort = dto.sort;
    }

    if (dto.remark !== undefined) {
      payload.remark = dto.remark?.trim() || null;
    }

    if (dto.isEnabled !== undefined) {
      payload.isEnabled = dto.isEnabled;
    }

    return payload;
  }

  private async toBannerVo(entity: any) {
    return BannerVo.fromEntity({
      ...entity,
      image: await this.minioService.resolveStoredFileUrl(entity.image),
    });
  }
}
