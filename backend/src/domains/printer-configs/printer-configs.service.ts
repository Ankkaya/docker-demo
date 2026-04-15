import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreatePrinterConfigDto } from './dto/create-printer-config.dto';
import { UpdatePrinterConfigDto } from './dto/update-printer-config.dto';

@Injectable()
export class PrinterConfigsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreatePrinterConfigDto) {
    const exists = await this.prisma.printerConfig.findFirst({
      where: {
        deletedAt: null,
        name: createDto.name,
      },
    });
    if (exists) {
      throw new ConflictException('打印配置名称已存在');
    }

    if (createDto.templateId) {
      const template = await this.prisma.printTemplate.findFirst({
        where: { id: createDto.templateId, deletedAt: null },
      });
      if (!template) {
        throw new NotFoundException('关联打印模板不存在');
      }
    }

    if (createDto.printerId) {
      const printer = await this.prisma.printer.findFirst({
        where: { id: createDto.printerId, deletedAt: null },
      });
      if (!printer) {
        throw new NotFoundException('关联打印机不存在');
      }
    }

    if (createDto.isDefault) {
      await this.prisma.printerConfig.updateMany({
        where: { deletedAt: null, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.printerConfig.create({ data: createDto });
  }

  async findAll() {
    return this.prisma.printerConfig.findMany({
      where: { deletedAt: null },
      include: {
        template: { select: { id: true, name: true, bizType: true } },
        printer: { select: { id: true, name: true, device: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: number) {
    const data = await this.prisma.printerConfig.findFirst({
      where: { id, deletedAt: null },
      include: {
        template: { select: { id: true, name: true, bizType: true } },
        printer: { select: { id: true, name: true, device: true } },
      },
    });
    if (!data) {
      throw new NotFoundException('打印配置不存在');
    }
    return data;
  }

  async update(id: number, updateDto: UpdatePrinterConfigDto) {
    await this.findOne(id);

    if (updateDto.name) {
      const conflict = await this.prisma.printerConfig.findFirst({
        where: {
          id: { not: id },
          deletedAt: null,
          name: updateDto.name,
        },
      });
      if (conflict) {
        throw new ConflictException('打印配置名称已存在');
      }
    }

    if (updateDto.templateId) {
      const template = await this.prisma.printTemplate.findFirst({
        where: { id: updateDto.templateId, deletedAt: null },
      });
      if (!template) {
        throw new NotFoundException('关联打印模板不存在');
      }
    }

    if (updateDto.printerId) {
      const printer = await this.prisma.printer.findFirst({
        where: { id: updateDto.printerId, deletedAt: null },
      });
      if (!printer) {
        throw new NotFoundException('关联打印机不存在');
      }
    }

    if (updateDto.isDefault) {
      await this.prisma.printerConfig.updateMany({
        where: { id: { not: id }, deletedAt: null, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.printerConfig.update({
      where: { id },
      data: updateDto,
      include: {
        template: { select: { id: true, name: true, bizType: true } },
        printer: { select: { id: true, name: true, device: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.printerConfig.update({
      where: { id },
      data: { deletedAt: new Date(), isDefault: false },
    });
  }
}
