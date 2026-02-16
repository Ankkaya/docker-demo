import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryVo, CategoryTreeVo, CategoryWithParentVo } from '@/categories/vo';

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
        where: { 
          id: createCategoryDto.parentId,
          deletedAt: null,
        },
      });

      if (!parent) {
        throw new NotFoundException('父级分类不存在');
      }

      // 设置层级
      createCategoryDto.level = parent.level + 1;
    } else {
      createCategoryDto.level = 1;
    }

    const category = await this.prisma.category.create({
      data: createCategoryDto,
    });

    return CategoryVo.fromEntity(category);
  }

  async findAll() {
    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { sort: 'asc' },
      include: {
        parent: true,
        children: {
          where: { deletedAt: null },
        },
      },
    });

    // 构建树形结构
    const tree = this.buildTree(categories);
    return CategoryTreeVo.fromEntities(tree);
  }

  // 获取扁平化列表
  async findAllFlat() {
    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { sort: 'asc' },
      include: {
        parent: true,
      },
    });

    return CategoryWithParentVo.fromEntities(categories);
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { 
        id,
        deletedAt: null,
      },
      include: {
        parent: true,
        children: {
          where: { deletedAt: null },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return CategoryWithParentVo.fromEntity(category);
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { 
        id,
        deletedAt: null,
      },
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
          deletedAt: null,
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
        where: { 
          id: updateCategoryDto.parentId,
          deletedAt: null,
        },
      });

      if (!parent) {
        throw new NotFoundException('父级分类不存在');
      }

      updateCategoryDto.level = parent.level + 1;
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });

    return CategoryVo.fromEntity(updated);
  }

  async remove(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { 
        id,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    // 检查是否有子分类（未删除的）
    const childCount = await this.prisma.category.count({
      where: { 
        parentId: id,
        deletedAt: null,
      },
    });

    if (childCount > 0) {
      throw new BadRequestException('不能删除有子分类的分类');
    }

    // 软删除：更新 deletedAt 字段
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // 获取所有子分类ID（递归）
  private async getAllChildren(parentId: number): Promise<number[]> {
    const children = await this.prisma.category.findMany({
      where: { 
        parentId,
        deletedAt: null,
      },
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
