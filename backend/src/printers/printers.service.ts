import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { UpdatePrinterDto } from './dto/update-printer.dto';

@Injectable()
export class PrintersService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreatePrinterDto) {
    const exists = await this.prisma.printer.findFirst({
      where: {
        deletedAt: null,
        device: createDto.device,
      },
    });
    if (exists) {
      throw new ConflictException('该打印机终端已被添加');
    }

    return this.prisma.printer.create({ data: createDto });
  }

  async findAll() {
    return this.prisma.printer.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const data = await this.prisma.printer.findFirst({
      where: { id, deletedAt: null },
    });
    if (!data) {
      throw new NotFoundException('打印机不存在');
    }
    return data;
  }

  async update(id: number, updateDto: UpdatePrinterDto) {
    await this.findOne(id);

    if (updateDto.device) {
      const conflict = await this.prisma.printer.findFirst({
        where: {
          id: { not: id },
          deletedAt: null,
          device: updateDto.device,
        },
      });
      if (conflict) {
        throw new ConflictException('该打印机终端已被添加');
      }
    }

    return this.prisma.printer.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.printer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
