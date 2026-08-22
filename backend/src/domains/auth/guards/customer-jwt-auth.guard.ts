import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** 商城用户只要求合法登录，不授予任何后台管理权限。 */
@Injectable()
export class CustomerJwtAuthGuard extends AuthGuard('jwt') {}
