import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MallModule } from './applications/mall/mall.module';
import { AdjustmentsModule } from './domains/adjustments/adjustments.module';
import { AuthModule } from './domains/auth/auth.module';
import { BannersModule } from './domains/banners/banners.module';
import { BalancesModule } from './domains/balances/balances.module';
import { BrandsModule } from './domains/brands/brands.module';
import { CartsModule } from './domains/carts/carts.module';
import { CategoriesModule } from './domains/categories/categories.module';
import { CustomersModule } from './domains/customers/customers.module';
import { CustomerAddressesModule } from './domains/customer-addresses/customer-addresses.module';
import { CouponsModule } from './domains/coupons/coupons.module';
import { InventoriesModule } from './domains/inventories/inventories.module';
import { MenusModule } from './domains/menus/menus.module';
import { OrdersModule } from './domains/orders/orders.module';
import { PaymentsModule } from './domains/payments/payments.module';
import { PrinterConfigsModule } from './domains/printer-configs/printer-configs.module';
import { PrintersModule } from './domains/printers/printers.module';
import { PrintTemplatesModule } from './domains/print-templates/print-templates.module';
import { ProductsModule } from './domains/products/products.module';
import { PurchaseReceiptsModule } from './domains/purchase-receipts/purchase-receipts.module';
import { PurchaseReturnsModule } from './domains/purchase-returns/purchase-returns.module';
import { PurchasesModule } from './domains/purchases/purchases.module';
import { RolesModule } from './domains/roles/roles.module';
import { ReviewsModule } from './domains/reviews/reviews.module';
import { SaleReturnsModule } from './domains/sale-returns/sale-returns.module';
import { ShipmentsModule } from './domains/shipments/shipments.module';
import { SuppliersModule } from './domains/suppliers/suppliers.module';
import { SystemSettingsModule } from './domains/system-settings/system-settings.module';
import { TransfersModule } from './domains/transfers/transfers.module';
import { UnitsModule } from './domains/units/units.module';
import { UsersModule } from './domains/users/users.module';
import { WarehousesModule } from './domains/warehouses/warehouses.module';
import { IconAssetsModule } from './infrastructure/icon-assets/icon-assets.module';
import { MinioModule } from './infrastructure/minio/minio.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    PrismaModule,
    RolesModule,
    MenusModule,
    UnitsModule,
    CategoriesModule,
    BrandsModule,
    BalancesModule,
    WarehousesModule,
    SuppliersModule,
    SystemSettingsModule,
    CustomersModule,
    CustomerAddressesModule,
    CouponsModule,
    ProductsModule,
    InventoriesModule,
    MallModule,
    MinioModule,
    PurchasesModule,
    PurchaseReceiptsModule,
    PurchaseReturnsModule,
    PaymentsModule,
    OrdersModule,
    ShipmentsModule,
    SaleReturnsModule,
    TransfersModule,
    AdjustmentsModule,
    CartsModule,
    ReviewsModule,
    PrintTemplatesModule,
    PrintersModule,
    PrinterConfigsModule,
    IconAssetsModule,
    BannersModule,
  ],
})
export class AppModule {}
