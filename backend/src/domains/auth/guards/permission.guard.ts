import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

/** 校验当前用户是否被角色分配了指定按钮权限。 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    const roleCodes = Array.isArray(request.user?.roles) ? request.user.roles : [];

    // admin 是系统超级管理员，保留全量权限。
    if (roleCodes.includes('admin')) return true;
    if (!userId) throw new ForbiddenException('缺少用户身份');

    const granted = await this.prisma.menu.count({
      where: {
        deletedAt: null,
        permission: { in: required },
        roles: { some: { users: { some: { id: userId } } } },
      },
    });

    if (granted === 0) throw new ForbiddenException('无权执行此操作');
    return true;
  }
}
