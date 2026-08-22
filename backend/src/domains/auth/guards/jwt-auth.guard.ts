import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authenticated = await super.canActivate(context) as boolean;
    const request = context.switchToHttp().getRequest();
    const roleCodes = Array.isArray(request.user?.roles) ? request.user.roles : [];

    if (!roleCodes.includes('admin')) {
      throw new ForbiddenException('无后台管理权限');
    }

    return authenticated;
  }
}
