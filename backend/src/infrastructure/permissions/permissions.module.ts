import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionGuard } from '@/domains/auth/guards/permission.guard';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [PermissionGuard],
  exports: [PermissionGuard],
})
export class PermissionsModule {}
