import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // 检查用户名是否存在
    const existingUser = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
    });

    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 检查邮箱是否存在（如果提供了邮箱）
    if (createUserDto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('邮箱已被使用');
      }
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    const { password, ...result } = user;
    return result;
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            menus: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const { password, ...result } = user;
    return result;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('用户不存在');
    }

    // 检查邮箱是否被其他用户使用
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const duplicateEmail = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (duplicateEmail) {
        throw new ConflictException('邮箱已被使用');
      }
    }

    // 如果更新密码，需要加密
    const data: any = { ...updateUserDto };
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        roles: true,
      },
    });

    const { password, ...result } = user;
    return result;
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查是否是最后一个管理员（可选的业务逻辑）
    const adminRole = await this.prisma.role.findUnique({
      where: { code: 'admin' },
      include: { users: true },
    });

    if (adminRole && adminRole.users.length === 1 && adminRole.users[0].id === id) {
      throw new ConflictException('不能删除最后一个管理员');
    }

    await this.prisma.user.delete({ where: { id } });
    return { id, message: '用户已删除' };
  }

  // 获取用户完整信息（包括角色）
  async findUserWithRoles(userId: number) {
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

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const { password, ...result } = user;
    return result;
  }

  // 为用户分配角色
  async assignRoles(userId: number, roleIds: number[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          set: roleIds.map((id) => ({ id })),
        },
      },
      include: {
        roles: true,
      },
    });
  }

  // 获取用户角色
  async getUserRoles(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user.roles;
  }

  // 获取用户菜单（聚合所有角色的菜单）
  async getUserMenus(userId: number, format: string = 'tree') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            menus: {
              include: {
                children: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 获取所有角色的菜单并去重
    const menuSet = new Map<number, any>();

    for (const role of user.roles) {
      for (const menu of role.menus) {
        if (!menuSet.has(menu.id)) {
          menuSet.set(menu.id, menu);
        }
      }
    }

    const menus = Array.from(menuSet.values());

    // 根据格式返回
    if (format === 'flat') {
      return menus.map(menu => {
        const { children, ...rest } = menu;
        return rest;
      });
    }

    // 默认返回树形结构
    return this.buildTree(menus);
  }

  // 构建树形结构
  private buildTree(menus: any[]): any[] {
    const menuMap = new Map<number, any>();
    const roots: any[] = [];

    // 先建立映射
    menus.forEach((menu) => {
      menuMap.set(menu.id, { ...menu, children: [] });
    });

    // 构建树
    menus.forEach((menu) => {
      const menuNode = menuMap.get(menu.id);
      if (menu.parentId) {
        const parent = menuMap.get(menu.parentId);
        if (parent) {
          parent.children.push(menuNode);
        }
      } else {
        roots.push(menuNode);
      }
    });

    // 移除空数组字段
    const cleanMenu = (menu: any) => {
      if (menu.children.length === 0) {
        delete menu.children;
      } else {
        menu.children.forEach(cleanMenu);
      }
      delete menu.parent;
    };

    roots.forEach(cleanMenu);

    return roots;
  }
}
