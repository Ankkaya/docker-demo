import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    // 检查编码是否已存在
    const existing = await this.prisma.customer.findUnique({
      where: { code: createCustomerDto.code },
    });

    if (existing) {
      throw new ConflictException('客户编码已存在');
    }

    // 如果关联了用户，检查用户是否已存在
    if (createCustomerDto.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: createCustomerDto.userId },
      });

      if (!user) {
        throw new NotFoundException('关联的用户不存在');
      }

      // 检查用户是否已关联其他客户
      const existingCustomer = await this.prisma.customer.findUnique({
        where: { userId: createCustomerDto.userId },
      });

      if (existingCustomer) {
        throw new ConflictException('该用户已关联其他客户');
      }
    }

    return this.prisma.customer.create({
      data: createCustomerDto,
    });
  }

  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('客户不存在');
    }

    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('客户不存在');
    }

    // 检查编码是否与其他记录冲突
    if (updateCustomerDto.code) {
      const conflict = await this.prisma.customer.findFirst({
        where: {
          id: { not: id },
          code: updateCustomerDto.code,
        },
      });

      if (conflict) {
        throw new ConflictException('客户编码已存在');
      }
    }

    // 如果修改了关联用户，检查用户是否存在
    if (updateCustomerDto.userId !== undefined) {
      if (updateCustomerDto.userId !== null) {
        const user = await this.prisma.user.findUnique({
          where: { id: updateCustomerDto.userId },
        });

        if (!user) {
          throw new NotFoundException('关联的用户不存在');
        }

        // 检查用户是否已关联其他客户
        const existingCustomer = await this.prisma.customer.findFirst({
          where: {
            userId: updateCustomerDto.userId,
            id: { not: id },
          },
        });

        if (existingCustomer) {
          throw new ConflictException('该用户已关联其他客户');
        }
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('客户不存在');
    }

    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
