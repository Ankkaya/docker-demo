import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RolesModule } from './roles/roles.module';
import { MenusModule } from './menus/menus.module';

@Module({
  imports: [UsersModule, AuthModule, PrismaModule, RolesModule, MenusModule],
})
export class AppModule {}
