import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    // 检查角色编码是否存在
    const existingRole = await this.prisma.role.findFirst({
      where: { code: createRoleDto.code },
    });

    if (existingRole) {
      throw new ConflictException('Role code already exists');
    }

    const { menuIds, ...roleData } = createRoleDto;

    const role = await this.prisma.role.create({
      data: roleData,
      include: {
        menus: true,
      },
    });

    // 如果传入了菜单ID，则关联菜单
    if (menuIds && menuIds.length > 0) {
      await this.prisma.role.update({
        where: { id: role.id },
        data: {
          menus: {
            set: menuIds.map((id) => ({ id })),
          },
        },
        include: {
          menus: true,
        },
      });
    }

    return role;
  }

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        menus: true,
        users: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        menus: true,
        users: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new NotFoundException('Role not found');
    }

    // 如果更新code，检查是否重复
    if (updateRoleDto.code && updateRoleDto.code !== existingRole.code) {
      const duplicateRole = await this.prisma.role.findFirst({
        where: { code: updateRoleDto.code },
      });
      if (duplicateRole) {
        throw new ConflictException('Role code already exists');
      }
    }

    const { menuIds, ...roleData } = updateRoleDto;

    const role = await this.prisma.role.update({
      where: { id },
      data: roleData,
      include: {
        menus: true,
      },
    });

    // 如果传入了菜单ID，则更新关联
    if (menuIds) {
      await this.prisma.role.update({
        where: { id },
        data: {
          menus: {
            set: menuIds.map((menuId) => ({ id: menuId })),
          },
        },
        include: {
          menus: true,
        },
      });
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const role = await this.findOne(id);
    await this.prisma.role.delete({ where: { id } });
    return role;
  }

  // 根据角色编码查找
  async findByCode(code: string) {
    return this.prisma.role.findUnique({
      where: { code },
      include: { menus: true },
    });
  }

  // 根据用户ID获取角色
  async findRolesByUserId(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            menus: true,
          },
        },
      },
    });

    return user?.roles || [];
  }
}
