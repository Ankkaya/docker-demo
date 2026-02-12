import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RolesModule } from './roles/roles.module';
import { MenusModule } from './menus/menus.module';
import { UnitsModule } from './units/units.module';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { CustomersModule } from './customers/customers.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    PrismaModule,
    RolesModule,
    MenusModule,
    UnitsModule,
    CategoriesModule,
    BrandsModule,
    WarehousesModule,
    SuppliersModule,
    CustomersModule,
  ],
})
export class AppModule {}
