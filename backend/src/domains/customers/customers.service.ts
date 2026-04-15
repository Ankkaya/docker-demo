import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerVo, CustomerWithUserVo } from '@/customers/vo';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    // 检查编码是否已存在（排除已删除的）
    const existing = await this.prisma.customer.findFirst({
      where: {
        code: createCustomerDto.code,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException('客户编码已存在');
    }

    if (createCustomerDto.phone) {
      const existingPhone = await this.prisma.customer.findFirst({
        where: {
          phone: createCustomerDto.phone,
          deletedAt: null,
        },
      });

      if (existingPhone) {
        throw new ConflictException('客户手机号已存在');
      }
    }

    // 如果关联了用户，检查用户是否已存在
    if (createCustomerDto.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: createCustomerDto.userId },
      });

      if (!user) {
        throw new NotFoundException('关联的用户不存在');
      }

      // 检查用户是否已关联其他客户（排除已删除的）
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          userId: createCustomerDto.userId,
          deletedAt: null,
        },
      });

      if (existingCustomer) {
        throw new ConflictException('该用户已关联其他客户');
      }
    }

    const customer = await this.prisma.customer.create({
      data: createCustomerDto,
    });

    return CustomerVo.fromEntity(customer);
  }

  async findAll() {
    const customers = await this.prisma.customer.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    return CustomerWithUserVo.fromEntities(customers);
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('客户不存在');
    }

    return CustomerWithUserVo.fromEntity(customer);
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const existing = await this.prisma.customer.findFirst({
      where: {
        id,
        deletedAt: null,
      },
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
          deletedAt: null,
        },
      });

      if (conflict) {
        throw new ConflictException('客户编码已存在');
      }
    }

    if (updateCustomerDto.phone) {
      const existingPhone = await this.prisma.customer.findFirst({
        where: {
          id: { not: id },
          phone: updateCustomerDto.phone,
          deletedAt: null,
        },
      });

      if (existingPhone) {
        throw new ConflictException('客户手机号已存在');
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

        // 检查用户是否已关联其他客户（排除已删除的）
        const existingCustomer = await this.prisma.customer.findFirst({
          where: {
            userId: updateCustomerDto.userId,
            id: { not: id },
            deletedAt: null,
          },
        });

        if (existingCustomer) {
          throw new ConflictException('该用户已关联其他客户');
        }
      }
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });

    return CustomerVo.fromEntity(customer);
  }

  async remove(id: number) {
    const existing = await this.prisma.customer.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('客户不存在');
    }

    return this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
