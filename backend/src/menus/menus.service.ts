import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

  async create(createMenuDto: CreateMenuDto) {
    return this.prisma.menu.create({
      data: createMenuDto,
    });
  }

  async findAll() {
    const menus = await this.prisma.menu.findMany({
      orderBy: { order: 'asc' },
      include: {
        parent: true,
        children: true,
        roles: {
          select: { id: true, name: true },
        },
      },
    });

    // 构建树形结构
    return this.buildTree(menus);
  }

  // 获取所有菜单（扁平化）
  async findAllFlat() {
    return this.prisma.menu.findMany({
      orderBy: { order: 'asc' },
      include: {
        parent: true,
      },
    });
  }

  async findOne(id: number) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        roles: {
          select: { id: true, name: true },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    return menu;
  }

  async update(id: number, updateMenuDto: UpdateMenuDto) {
    const existingMenu = await this.prisma.menu.findUnique({
      where: { id },
    });

    if (!existingMenu) {
      throw new NotFoundException('Menu not found');
    }

    // 不能将父级设置为自己
    if (updateMenuDto.parentId === id) {
      throw new Error('Parent ID cannot be the same as the menu ID');
    }

    return this.prisma.menu.update({
      where: { id },
      data: updateMenuDto,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async remove(id: number) {
    const menu = await this.findOne(id);

    // 检查是否有子菜单
    const childCount = await this.prisma.menu.count({
      where: { parentId: id },
    });

    if (childCount > 0) {
      throw new Error('Cannot delete menu with children');
    }

    await this.prisma.menu.delete({ where: { id } });
    return menu;
  }

  // 根据角色ID获取菜单
  async findMenusByRoleId(roleId: number) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        menus: {
          include: {
            children: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const menus = role.menus;
    // 构建树形结构
    return this.buildTree(menus);
  }

  // 根据用户ID获取菜单
  async findMenusByUserId(userId: number) {
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
      throw new NotFoundException('User not found');
    }

    // 获取所有角色的菜单并去重
    const menuSet = new Set<number>();
    const menus: any[] = [];

    for (const role of user.roles) {
      for (const menu of role.menus) {
        if (!menuSet.has(menu.id)) {
          menuSet.add(menu.id);
          menus.push(menu);
        }
      }
    }

    // 构建树形结构
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
      // 移除不需要的字段
      delete menu.parent;
      delete menu.parentId;
    };

    roots.forEach(cleanMenu);

    return roots;
  }
}
