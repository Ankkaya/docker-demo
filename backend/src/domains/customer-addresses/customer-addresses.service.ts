import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto';
import { CustomerAddressVo } from './vo/customer-address.vo';

@Injectable()
export class CustomerAddressesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getCustomerByUserId(userId: number) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        userId,
        deletedAt: null,
        isEnabled: true,
      },
      select: {
        id: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('当前用户未绑定客户信息');
    }

    return customer;
  }

  private async getAddressEntity(customerId: number, id: number) {
    const address = await this.prisma.customerAddress.findFirst({
      where: {
        id,
        customerId,
        deletedAt: null,
      },
    });

    if (!address) {
      throw new NotFoundException('收货地址不存在');
    }

    return address;
  }

  async findByUserId(userId: number) {
    const customer = await this.getCustomerByUserId(userId);
    const addresses = await this.prisma.customerAddress.findMany({
      where: {
        customerId: customer.id,
        deletedAt: null,
      },
      orderBy: [{ isDefault: 'desc' }, { sort: 'asc' }, { id: 'desc' }],
    });

    return CustomerAddressVo.fromEntities(addresses);
  }

  async findDefaultByUserId(userId: number) {
    const customer = await this.getCustomerByUserId(userId);
    const address = await this.prisma.customerAddress.findFirst({
      where: {
        customerId: customer.id,
        deletedAt: null,
        isDefault: true,
      },
      orderBy: [{ sort: 'asc' }, { id: 'desc' }],
    });

    return address ? CustomerAddressVo.fromEntity(address) : null;
  }

  async findOneByUserId(userId: number, id: number) {
    const customer = await this.getCustomerByUserId(userId);
    const address = await this.getAddressEntity(customer.id, id);
    return CustomerAddressVo.fromEntity(address);
  }

  async createForUser(userId: number, dto: CreateCustomerAddressDto) {
    const customer = await this.getCustomerByUserId(userId);
    const existingCount = await this.prisma.customerAddress.count({
      where: {
        customerId: customer.id,
        deletedAt: null,
      },
    });

    const created = await this.prisma.$transaction(async (tx) => {
      const shouldSetDefault = dto.isDefault === true || existingCount === 0;

      if (shouldSetDefault) {
        await tx.customerAddress.updateMany({
          where: {
            customerId: customer.id,
            deletedAt: null,
          },
          data: {
            isDefault: false,
          },
        });
      }

      return tx.customerAddress.create({
        data: {
          customerId: customer.id,
          receiverName: dto.receiverName.trim(),
          receiverPhone: dto.receiverPhone.trim(),
          province: dto.province?.trim(),
          city: dto.city?.trim(),
          district: dto.district?.trim(),
          address: dto.address.trim(),
          postalCode: dto.postalCode?.trim(),
          tag: dto.tag?.trim(),
          isDefault: shouldSetDefault,
          sort: dto.sort ?? 0,
          remark: dto.remark?.trim(),
        },
      });
    });

    return CustomerAddressVo.fromEntity(created);
  }

  async updateForUser(userId: number, id: number, dto: UpdateCustomerAddressDto) {
    const customer = await this.getCustomerByUserId(userId);
    await this.getAddressEntity(customer.id, id);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await tx.customerAddress.updateMany({
          where: {
            customerId: customer.id,
            deletedAt: null,
          },
          data: {
            isDefault: false,
          },
        });
      }

      const next = await tx.customerAddress.update({
        where: { id },
        data: {
          ...(dto.receiverName !== undefined ? { receiverName: dto.receiverName.trim() } : {}),
          ...(dto.receiverPhone !== undefined ? { receiverPhone: dto.receiverPhone.trim() } : {}),
          ...(dto.province !== undefined ? { province: dto.province?.trim() || null } : {}),
          ...(dto.city !== undefined ? { city: dto.city?.trim() || null } : {}),
          ...(dto.district !== undefined ? { district: dto.district?.trim() || null } : {}),
          ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
          ...(dto.postalCode !== undefined ? { postalCode: dto.postalCode?.trim() || null } : {}),
          ...(dto.tag !== undefined ? { tag: dto.tag?.trim() || null } : {}),
          ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
          ...(dto.sort !== undefined ? { sort: dto.sort } : {}),
          ...(dto.remark !== undefined ? { remark: dto.remark?.trim() || null } : {}),
        },
      });

      if (dto.isDefault === false) {
        const defaultExists = await tx.customerAddress.findFirst({
          where: {
            customerId: customer.id,
            deletedAt: null,
            isDefault: true,
          },
          select: { id: true },
        });

        if (!defaultExists) {
          await tx.customerAddress.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
          next.isDefault = true;
        }
      }

      return next;
    });

    return CustomerAddressVo.fromEntity(updated);
  }

  async setDefaultForUser(userId: number, id: number) {
    const customer = await this.getCustomerByUserId(userId);
    await this.getAddressEntity(customer.id, id);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.customerAddress.updateMany({
        where: {
          customerId: customer.id,
          deletedAt: null,
        },
        data: {
          isDefault: false,
        },
      });

      return tx.customerAddress.update({
        where: { id },
        data: {
          isDefault: true,
        },
      });
    });

    return CustomerAddressVo.fromEntity(updated);
  }

  async removeForUser(userId: number, id: number) {
    const customer = await this.getCustomerByUserId(userId);
    const address = await this.getAddressEntity(customer.id, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.customerAddress.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isDefault: false,
        },
      });

      if (address.isDefault) {
        const nextDefault = await tx.customerAddress.findFirst({
          where: {
            customerId: customer.id,
            deletedAt: null,
          },
          orderBy: [{ sort: 'asc' }, { id: 'desc' }],
        });

        if (nextDefault) {
          await tx.customerAddress.update({
            where: { id: nextDefault.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return true;
  }

  async findAddressForOrder(customerId: number, addressId?: number | null) {
    if (addressId) {
      return this.getAddressEntity(customerId, addressId);
    }

    return this.prisma.customerAddress.findFirst({
      where: {
        customerId,
        deletedAt: null,
        isDefault: true,
      },
      orderBy: [{ sort: 'asc' }, { id: 'desc' }],
    });
  }
}
