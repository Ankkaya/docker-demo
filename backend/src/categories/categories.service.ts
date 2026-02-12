import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    // 检查编码是否已存在
    const existing = await this.prisma.category.findUnique({
      where: { code: createCategoryDto.code },
    });

    if (existing) {
      throw new ConflictException('分类编码已存在');
    }

    // 如果有父级，检查父级是否存在
    if (createCategoryDto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: createCategoryDto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('父级分类不存在');
      }

      // 设置层级
      createCategoryDto.level = parent.level + 1;
    } else {
      createCategoryDto.level = 1;
    }

    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async findAll() {
    const categories = await this.prisma.category.findMany({
      orderBy: { sort: 'asc' },
      include: {
        parent: true,
        children: true,
      },
    });

    // 构建树形结构
    return this.buildTree(categories);
  }

  // 获取扁平化列表
  async findAllFlat() {
    return this.prisma.category.findMany({
      orderBy: { sort: 'asc' },
      include: {
        parent: true,
      },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('分类不存在');
    }

    // 检查编码是否与其他记录冲突
    if (updateCategoryDto.code) {
      const conflict = await this.prisma.category.findFirst({
        where: {
          id: { not: id },
          code: updateCategoryDto.code,
        },
      });

      if (conflict) {
        throw new ConflictException('分类编码已存在');
      }
    }

    // 检查是否将父级设置为自己或子级
    if (updateCategoryDto.parentId) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('不能将父级设置为自己');
      }

      // 检查是否设置为子级
      const children = await this.getAllChildren(id);
      if (children.includes(updateCategoryDto.parentId)) {
        throw new BadRequestException('不能将父级设置为子级');
      }

      const parent = await this.prisma.category.findUnique({
        where: { id: updateCategoryDto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('父级分类不存在');
      }

      updateCategoryDto.level = parent.level + 1;
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    // 检查是否有子分类
    const childCount = await this.prisma.category.count({
      where: { parentId: id },
    });

    if (childCount > 0) {
      throw new BadRequestException('不能删除有子分类的分类');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  // 获取所有子分类ID（递归）
  private async getAllChildren(parentId: number): Promise<number[]> {
    const children = await this.prisma.category.findMany({
      where: { parentId },
      select: { id: true },
    });

    const result = children.map(c => c.id);

    for (const child of children) {
      const grandChildren = await this.getAllChildren(child.id);
      result.push(...grandChildren);
    }

    return result;
  }

  // 构建树形结构
  private buildTree(categories: any[]): any[] {
    const categoryMap = new Map<number, any>();
    const roots: any[] = [];

    // 先建立映射
    categories.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // 构建树
    categories.forEach((category) => {
      const categoryNode = categoryMap.get(category.id);
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(categoryNode);
        }
      } else {
        roots.push(categoryNode);
      }
    });

    // 移除空数组字段
    const cleanCategory = (category: any) => {
      if (category.children.length === 0) {
        delete category.children;
      } else {
        category.children.forEach(cleanCategory);
      }
      delete category.parent;
      delete category.parentId;
    };

    roots.forEach(cleanCategory);

    return roots;
  }
}
