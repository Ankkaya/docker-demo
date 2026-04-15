import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreatePrintTemplateDto } from './dto/create-print-template.dto';
import { UpdatePrintTemplateDto } from './dto/update-print-template.dto';

@Injectable()
export class PrintTemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreatePrintTemplateDto) {
    const exists = await this.prisma.printTemplate.findFirst({
      where: {
        deletedAt: null,
        name: createDto.name,
      },
    });

    if (exists) {
      throw new ConflictException('模板名称已存在');
    }

    return this.prisma.printTemplate.create({ data: createDto });
  }

  async findAll() {
    return this.prisma.printTemplate.findMany({
      where: { deletedAt: null },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: number) {
    const data = await this.prisma.printTemplate.findFirst({
      where: { id, deletedAt: null },
    });
    if (!data) {
      throw new NotFoundException('打印模板不存在');
    }
    return data;
  }

  async update(id: number, updateDto: UpdatePrintTemplateDto) {
    await this.findOne(id);

    if (updateDto.name) {
      const conflict = await this.prisma.printTemplate.findFirst({
        where: {
          id: { not: id },
          deletedAt: null,
          name: updateDto.name,
        },
      });
      if (conflict) {
        throw new ConflictException('模板名称已存在');
      }
    }

    return this.prisma.printTemplate.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.printTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
