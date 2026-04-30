# AGENTS.md - Project Documentation for AI Coding Agents

## Project Overview

This is a **full-stack Mall + Inventory Management System (商城+进销存系统)** built on top of an RBAC (Role-Based Access Control) Admin System.

**Current Progress:**
- ✅ RBAC Core: User/Role/Menu management
- ✅ v1.0 Basic Data: Unit/Category/Brand/Warehouse/Supplier/Customer/CustomerAddress/SystemSettings
- ✅ v1.0 Product Management: SPU/SKU/Inventory/Stock Query
- ✅ v1.0 Purchase/Sale: Purchase orders/Purchase receipts/Purchase returns/Sale orders/Shipments/Sale returns
- ✅ v1.0 Inventory: Stock transfer/Stock adjustment/Inventory logs (with weighted-avg cost recalc on receipt)
- ✅ v1.0 Finance: Payment records / Receivables & Payables / Customer Balance Account & Logs / Recharge Packages & Activities
- ✅ v1.0 Marketing: Coupons (issue/claim/exchange-code/use scope) / Banners / Mall hot searches
- ✅ v1.0 Mall (C-side): Product browse / Favorites / Browse history / Cart with **stock locking** / WeChat MiniProgram pay / Balance pay / Reviews
- ✅ v1.0 File Storage: MinIO object storage integration / Icon assets
- ✅ v1.0 Printing: Print templates / Printers / Printer configs (label & receipt printing pipeline)
- 🚧 v1.0 Mobile App: Uni-app based mobile frontend (In development)

**Language:** Chinese (zh-CN) - Code comments and documentation are primarily in Chinese.

### Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS (Node.js), TypeScript |
| **Frontend** | Vue.js 3, TypeScript, Vite |
| **Mobile** | Uni-app (Vue 3), TypeScript, Wot Design UI |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma |
| **Cache** | Redis |
| **File Storage** | MinIO |
| **Auth** | JWT + Passport.js |
| **UI Library** | Naive UI (Admin) / Wot Design Uni (Mobile) |
| **Styling** | Tailwind CSS |
| **State Management** | Pinia |
| **Containerization** | Docker, Docker Compose |
| **CI/CD** | GitHub Actions |

---

## Project Structure

> **Architecture note:** Backend follows a layered split — `applications/` (面向特定前端的编排层，目前只有 `mall/`) + `domains/` (按业务领域聚合的模块，~37 个) + `infrastructure/` (技术基础设施) + `common/` (横切关注点：异常过滤器、响应拦截器)。所有领域模块都通过 Prisma 直接访问 DB，没有独立 Repository 层。

```
docker-demo/
├── backend/                 # NestJS Backend API
│   ├── src/
│   │   ├── applications/
│   │   │   └── mall/              # 商城前台编排层（聚合多领域：订单/购物车/优惠券/余额/微信支付）
│   │   │       ├── mall.controller.ts        # /mall/* 路由聚合
│   │   │       ├── mall.service.ts           # 商品浏览/分类/搜索
│   │   │       ├── mall-orders.service.ts    # 商城下单/支付/取消/退款（含库存锁定&释放）
│   │   │       ├── mall-balance.service.ts   # 余额账户充值/消费/退款
│   │   │       ├── mall-coupons.service.ts   # 领券/兑换码/使用校验
│   │   │       ├── wechat-pay.service.ts     # 微信小程序支付适配
│   │   │       └── dto/, vo/
│   │   ├── domains/                # 业务领域模块（每个含 .module/.controller/.service/dto/vo）
│   │   │   ├── auth/               # JWT 登录、注册、当前用户
│   │   │   ├── users/              # 用户 CRUD
│   │   │   ├── roles/              # 角色 CRUD
│   │   │   ├── menus/              # 菜单（树形）
│   │   │   ├── units/              # 计量单位
│   │   │   ├── categories/         # 商品分类（树形）
│   │   │   ├── brands/             # 品牌
│   │   │   ├── warehouses/         # 仓库
│   │   │   ├── suppliers/          # 供应商
│   │   │   ├── customers/          # 客户主数据（B 端 / C 端 user 关联）
│   │   │   ├── customer-addresses/ # 客户收货地址
│   │   │   ├── system-settings/    # 系统配置项 KV
│   │   │   ├── products/           # 商品 SPU/SKU + Mall info
│   │   │   ├── inventories/        # 库存查询、安全库存、流水查询
│   │   │   ├── purchases/          # 采购订单（PENDING→APPROVED→PARTIAL→COMPLETED）
│   │   │   ├── purchase-receipts/  # 采购入库单（确认入库时执行库存事务）
│   │   │   ├── purchase-returns/   # 采购退货单
│   │   │   ├── orders/             # 销售订单（B 端 + 商城 SALE/MALL 共用表）
│   │   │   ├── shipments/          # 发货单（确认发货时执行库存事务）
│   │   │   ├── sale-returns/       # 销售退货单
│   │   │   ├── transfers/          # 库存调拨（PENDING→OUT→COMPLETED）
│   │   │   ├── adjustments/        # 库存调整/盘点
│   │   │   ├── payments/           # 收付款记录、应收应付统计
│   │   │   ├── balances/           # 客户余额账户 + 流水（消费/充值/退款）
│   │   │   ├── carts/              # 购物车 + **库存锁定/释放工具方法**
│   │   │   ├── coupons/            # 优惠券模板/发放/兑换码/领取记录
│   │   │   ├── favorites/          # 商品收藏
│   │   │   ├── browse-histories/   # 浏览历史
│   │   │   ├── reviews/            # 商品评价 + 回复
│   │   │   ├── banners/            # 商城轮播图
│   │   │   ├── mall-hot-searches/         # 热搜词
│   │   │   ├── mall-recharge-activities/  # 充值活动（满赠等）
│   │   │   ├── mall-recharge-packages/    # 充值套餐
│   │   │   ├── mall-user-products/        # 用户专享/定向商品池
│   │   │   ├── print-templates/    # 打印模板（标签/小票）
│   │   │   ├── printers/           # 打印机设备
│   │   │   └── printer-configs/    # 打印机绑定与默认配置
│   │   ├── infrastructure/
│   │   │   ├── prisma/             # PrismaService（全局）
│   │   │   ├── redis/              # Redis 服务
│   │   │   ├── minio/              # MinIO 客户端 + URL 解析
│   │   │   └── icon-assets/        # 图标资源服务
│   │   ├── common/
│   │   │   ├── filters/            # HttpExceptionFilter（统一错误响应）
│   │   │   └── interceptors/       # TransformInterceptor（统一成功响应）
│   │   ├── app.module.ts           # Root module（@nestjs/schedule 全局开启）
│   │   └── main.ts                 # Bootstrap：CORS、Swagger、全局管道/过滤器/拦截器
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema definition
│   │   ├── seed.ts         # Initial data seeding script
│   │   └── migrations/     # Database migrations
│   ├── test/               # Test files
│   ├── Dockerfile          # Multi-stage build
│   └── package.json
├── frontend/               # Vue.js 3 Admin Frontend
│   ├── src/
│   │   ├── api/            # API request modules
│   │   │   ├── adjustment.ts   # [v1.0] 库存调整 API
│   │   │   ├── auth.ts         # Authentication API
│   │   │   ├── brand.ts        # [v1.0] 品牌 API
│   │   │   ├── cart.ts         # [v1.0] 购物车 API
│   │   │   ├── category.ts     # [v1.0] 商品分类 API
│   │   │   ├── customer.ts     # [v1.0] 客户 API
│   │   │   ├── file.ts         # [v1.0] 文件上传 API
│   │   │   ├── inventory.ts    # [v1.0] 库存 API
│   │   │   ├── menu.ts         # Menu API
│   │   │   ├── order.ts        # [v1.0] 销售订单 API
│   │   │   ├── product.ts      # [v1.0] 商品 API
│   │   │   ├── purchase.ts     # [v1.0] 采购 API
│   │   │   ├── request.ts      # Axios instance config
│   │   │   ├── roles.ts        # Role API
│   │   │   ├── supplier.ts     # [v1.0] 供应商 API
│   │   │   ├── transfer.ts     # [v1.0] 库存调拨 API
│   │   │   ├── unit.ts         # [v1.0] 计量单位 API
│   │   │   ├── user.ts         # User API
│   │   │   └── warehouse.ts    # [v1.0] 仓库 API
│   │   ├── views/          # Page components
│   │   │   ├── adjustments/    # [v1.0] 库存调整页面
│   │   │   ├── brands/         # [v1.0] 品牌管理页面
│   │   │   ├── carts/          # [v1.0] 购物车页面
│   │   │   ├── categories/     # [v1.0] 商品分类页面
│   │   │   ├── customers/      # [v1.0] 客户管理页面
│   │   │   ├── inventories/    # [v1.0] 库存查询页面
│   │   │   ├── inventory-logs/ # [v1.0] 库存流水页面
│   │   │   ├── layout/         # Layout components
│   │   │   ├── login/          # Login page
│   │   │   ├── menus/          # Menu management page
│   │   │   ├── orders/         # [v1.0] 销售订单页面
│   │   │   ├── products/       # [v1.0] 商品管理页面
│   │   │   ├── purchase-receipts/  # [v1.0] 采购入库页面
│   │   │   ├── purchase-returns/   # [v1.0] 采购退货页面
│   │   │   ├── purchases/      # [v1.0] 采购订单页面
│   │   │   ├── roles/          # Role management page
│   │   │   ├── sale-returns/   # [v1.0] 销售退货页面
│   │   │   ├── shipments/      # [v1.0] 发货管理页面
│   │   │   ├── suppliers/      # [v1.0] 供应商管理页面
│   │   │   ├── transfers/      # [v1.0] 库存调拨页面
│   │   │   ├── units/          # [v1.0] 计量单位页面
│   │   │   ├── users/          # User management page
│   │   │   └── warehouses/     # [v1.0] 仓库管理页面
│   │   ├── components/     # Reusable components
│   │   ├── constants/      # Constants
│   │   ├── router/         # Vue Router configuration
│   │   ├── store/          # Pinia stores
│   │   ├── styles/         # Global styles
│   │   ├── theme/          # Theme configuration
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   ├── App.vue         # Root component
│   │   └── main.ts         # Application entry point
│   ├── Dockerfile          # Multi-stage build with Nginx
│   ├── nginx.conf          # Nginx configuration
│   ├── vite.config.ts      # Vite configuration
│   └── package.json
├── mobile/                 # [v1.0] Uni-app Mobile Frontend
│   ├── src/
│   │   ├── pages/          # Main pages
│   │   ├── subPages/       # Sub-pages
│   │   ├── components/     # Components
│   │   ├── composables/    # Vue composables
│   │   ├── layouts/        # Page layouts
│   │   ├── api/            # API modules
│   │   ├── store/          # Pinia stores
│   │   ├── utils/          # Utilities
│   │   ├── static/         # Static assets
│   │   ├── App.vue         # App root
│   │   └── main.ts         # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── manifest.json       # Uni-app manifest
├── docker-compose.yaml     # Full stack orchestration
├── start-local.sh          # Local dev startup (Linux/Mac)
├── start-local.ps1         # Local dev startup (Windows)
├── .github/workflows/      # CI/CD workflows
│   └── deploy.yml
├── .claude/                # AI assistant configuration
│   ├── rules/              # Rule documents
│   └── skills/             # Skill definitions
├── version/                # Version planning documents
│   └── v1.0.md
├── ENGINEERING_IMPROVEMENTS.md  # Engineering optimization suggestions
└── AGENTS.md               # This file
```

---

## Build and Development Commands

### Local Development (Docker)

```bash
# Linux/Mac
./start-local.sh

# Windows PowerShell
./start-local.ps1
```

This script will:
1. Start PostgreSQL database and MinIO containers
2. Run Prisma migrations
3. Seed initial data (admin user: `admin`/`123456`)
4. Build and start all services

Access points after startup:
- Frontend Admin: http://localhost:8080
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api/docs
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)

### Backend Commands

```bash
cd backend

# Install dependencies
pnpm install

# Development (requires local PostgreSQL)
pnpm start:dev

# Build for production
pnpm build

# Database operations
pnpm prisma:generate      # Generate Prisma client
pnpm prisma:migrate       # Run migrations in development
pnpm prisma:studio        # Open Prisma Studio GUI
pnpm prisma:seed          # Seed database
pnpm db:setup            # Run migrations + seed

# Testing
pnpm test                # Run Jest tests (passWithNoTests)
pnpm test:cov            # Run with coverage
```

### Frontend Commands

```bash
cd frontend

# Install dependencies
pnpm install

# Development server (with API proxy)
pnpm dev                 # Runs on http://localhost:5173

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Mobile App Commands

```bash
cd mobile

# Install dependencies
pnpm install

# Development
pnpm dev:h5              # H5 development
pnpm dev:mp-weixin       # WeChat mini-program development
pnpm dev:app-android     # Android app development

# Build
pnpm build:h5            # Build for H5
pnpm build:mp-weixin     # Build for WeChat mini-program
```

### Agent Workflow Preference

- 对 `mobile/` 目录下的常规页面与样式修改，默认不执行 `pnpm build`、`pnpm build:h5`、`eslint` 或类似校验命令
- 仅在用户明确要求验证、修改涉及构建配置/依赖、或代理判断存在高风险时，才执行移动端构建或 lint 检查
- 对 `backend/`、`frontend/` 的验证步骤，按任务风险单独判断，不受本偏好影响

### Docker Compose Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Restart specific service
docker-compose restart backend

# Stop all services
docker-compose down

# Rebuild after dependency changes
docker-compose up -d --build
```

---

## Database Schema

The database uses PostgreSQL with the following entities:

### Core RBAC Entities

#### User (用户)
- `id`, `username` (unique), `email` (unique), `password`
- `name`, `createdAt`, `updatedAt`, `deletedAt` (soft delete)
- Many-to-many relationship with Roles
- One-to-one relationship with Customer (optional)
- One-to-many relationship with Cart

#### Role (角色)
- `id`, `name` (unique), `code` (unique), `description`
- Many-to-many relationships with Users and Menus

#### Menu (菜单) - Tree Structure
- `id`, `name`, `path`, `icon`, `component`, `redirect`
- `parentId` (self-referencing for tree structure)
- `order`, `hidden`, `alwaysShow`, `type` (menu/button/iframe)
- Self-referential relationship for parent-child hierarchy

### Basic Data Entities (v1.0)

#### Unit (计量单位)
- `id`, `name` (unique), `code` (unique), `sort`
- Common units: 个、件、箱、kg、g、L、ml、m

#### Category (商品分类) - Tree Structure
- `id`, `name`, `code` (unique), `parentId`, `level`
- `sort`, `icon`, `image`, `isEnabled`, `deletedAt`
- Self-referential relationship for parent-child hierarchy

#### Brand (品牌)
- `id`, `name` (unique), `logo`, `description`
- `sort`, `isEnabled`, `deletedAt`

#### Warehouse (仓库)
- `id`, `name`, `code` (unique), `address`, `contact`, `phone`
- `isDefault`, `isEnabled`, `deletedAt`

#### Supplier (供应商)
- `id`, `name`, `code` (unique), `contact`, `phone`, `email`, `address`
- `bankName`, `bankAccount`, `taxNo`
- `creditLimit`, `period`, `isEnabled`, `remark`, `deletedAt`

#### Customer (客户)
- `id`, `name`, `code` (unique), `type` (INDIVIDUAL/COMPANY)
- `contact`, `phone`, `email`, `address`
- `creditLimit`, `period`, `isEnabled`, `remark`, `deletedAt`
- `userId` (optional, link to User for mall customers)

### Product Entities (v1.0)

#### Product (商品SPU)
- `id`, `name`, `spuCode` (unique), `description`, `detail` (富文本)
- `categoryId`, `brandId`, `unitId`
- `mainImage`, `images` (数组)
- `specTemplate` (JSON, 规格模板)
- `isEnabled`, `deletedAt`
- One-to-many relationship with ProductSku

#### ProductSku (商品SKU)
- `id`, `skuCode` (unique), `productId`
- `specs` (JSON, 规格组合如 {"颜色": "红", "尺码": "XL"})
- `costPrice`, `salePrice`, `marketPrice`
- `image`, `barcode`, `weight`, `volume`
- `isDefault`, `sort`, `status` (ACTIVE/INACTIVE/DELETED)
- `deletedAt`

#### Inventory (库存)
- `id`, `skuId`, `warehouseId`
- `quantity` (实际库存), `locked` (锁定库存), `available` (可用库存)
- `minStock` (安全库存), `maxStock` (库存上限), `location` (库位)
- Unique constraint on [skuId, warehouseId]

### Inventory Management (库存管理)

#### InventoryLog (库存流水)
- `id`, `type` (变动类型: IN_PURCHASE/IN_SALE_RETURN/IN_TRANSFER/IN_ADJUST/OUT_SALE/OUT_PURCHASE_RETURN/OUT_TRANSFER/OUT_ADJUST)
- `skuId`, `warehouseId`, `quantity`, `before`, `after`
- `bizType`, `bizId`, `bizNo` (关联业务单据)

#### Transfer (库存调拨单)
- `id`, `transferNo` (unique), `fromId`, `toId` (出入库仓库)
- `status` (PENDING/OUT/IN/COMPLETED/CANCELLED)
- One-to-many relationship with TransferItem

#### TransferItem (调拨明细)
- `id`, `transferId`, `skuId`, `quantity`

#### Adjustment (库存调整单)
- `id`, `adjustNo` (unique), `warehouseId`
- `status` (PENDING/APPROVED/COMPLETED/CANCELLED)
- One-to-many relationship with AdjustmentItem

#### AdjustmentItem (调整明细)
- `id`, `adjustmentId`, `skuId`, `bookQty`, `actualQty`, `diffQty`

### Purchase Management (采购管理)

#### Purchase (采购订单)
- `id`, `orderNo` (unique), `supplierId`, `warehouseId`
- `totalAmount`, `discount`, `payable`, `paid`
- `status` (PENDING/APPROVED/PARTIAL/COMPLETED/CANCELLED)
- `orderDate`, `deliveryDate`
- One-to-many relationship with PurchaseItem

#### PurchaseItem (采购明细)
- `id`, `purchaseId`, `skuId`, `quantity`, `received`, `price`, `amount`

#### PurchaseReceipt (采购入库单)
- `id`, `receiptNo` (unique), `purchaseId`, `warehouseId`
- `status` (PENDING/RECEIVED/CANCELLED), `totalAmount`
- One-to-many relationship with PurchaseReceiptItem

#### PurchaseReceiptItem (入库明细)
- `id`, `receiptId`, `skuId`, `quantity`, `price`

#### PurchaseReturn (采购退货单)
- `id`, `returnNo` (unique), `receiptId`, `supplierId`, `warehouseId`
- `status` (PENDING/APPROVED/COMPLETED/CANCELLED), `totalAmount`
- One-to-many relationship with PurchaseReturnItem

### Sales Management (销售管理)

#### Order (销售订单)
- `id`, `orderNo` (unique), `type` (SALE/MALL), `customerId`
- `receiverName`, `receiverPhone`, `receiverAddress`
- `totalAmount`, `discount`, `freight`, `payable`, `paid`
- `status` (PENDING/CONFIRMED/PROCESSING/SHIPPED/COMPLETED/CANCELLED/REFUNDING/REFUNDED)
- `payStatus` (UNPAID/PARTIAL/PAID/REFUNDING/REFUNDED)
- `shipStatus` (UNSHIPPED/PARTIAL/SHIPPED/RECEIVED)
- One-to-many relationship with OrderItem

#### OrderItem (订单明细)
- `id`, `orderId`, `skuId`, `quantity`, `shipped`, `price`, `amount`

#### Shipment (发货单)
- `id`, `shipmentNo` (unique), `orderId`, `warehouseId`
- `logisticsCompany`, `trackingNo`
- `status` (PENDING/SHIPPED/RECEIVED/CANCELLED)
- One-to-many relationship with ShipmentItem

#### SaleReturn (销售退货单)
- `id`, `returnNo` (unique), `shipmentId`, `customerId`, `warehouseId`
- `status` (PENDING/APPROVED/COMPLETED/CANCELLED), `totalAmount`
- One-to-many relationship with SaleReturnItem

### Finance Management (财务管理)

#### Payment (收付款记录)
- `id`, `type` (RECEIPT/PAYMENT), `bizType` (PURCHASE/SALE)
- `orderId`, `purchaseId`, `amount`, `method` (CASH/BANK/ALIPAY/WECHAT/CREDIT)
- `status` (PENDING/COMPLETED/CANCELLED)

### Mall Module (商城模块)

#### Cart (购物车)
- `id`, `userId`, `skuId`, `quantity`, `selected`
- Unique constraint on [userId, skuId]
- 库存锁定/释放工具方法位于 `@c:\project\docker-demo\backend\src\domains\carts\carts.service.ts:40-130`，被 `mall-orders.service.ts` 调用

#### CustomerAddress (客户收货地址)
- `id`, `customerId`, `receiverName`, `receiverPhone`, `province`, `city`, `district`, `address`, `isDefault`

#### Favorite (商品收藏) / BrowseHistory (浏览历史)
- 关联 `userId` + `productId`/`skuId`，唯一约束防重；BrowseHistory 包含 `viewedAt`/`viewCount`

#### Review (商品评价) `enum ReviewStatus`
- `id`, `orderItemId` (unique with userId), `productId`, `userId`, `rating`, `content`, `images[]`, `isAnonymous`
- `status` (PENDING/APPROVED/REJECTED), `replyContent`, `replyAt`, `reviewedAt`

#### Banner (商城轮播) / MallHotSearch (热搜词)
- Banner: `id`, `title`, `image`, `linkType`, `linkValue`, `sort`, `startAt`, `endAt`, `isEnabled`
- HotSearch: `keyword`, `sort`, `weight`

### Marketing - Coupon (优惠券)

#### Coupon (券模板) `enum CouponType` / `CouponSceneType` / `CouponIssueType` / `CouponValidType`
- `id`, `name`, `type` (CASH/DISCOUNT/INSTANT_REDUCTION), `discountValue`, `minAmount`, `totalCount`, `usedCount`
- `validType` (FIXED/RELATIVE), `validFrom`, `validTo`, `validDays`
- `issueType` (USER_CLAIM/ADMIN_ASSIGN/AUTO_GRANT/EXCHANGE_CODE)
- `issueScopeType`, `useScopeType` (ALL/CATEGORY/BRAND/PRODUCT/SKU) + scope 关联表
- `refundReturnMode` (RETURN_ORIGINAL/GRANT_NEW/NOT_RETURN)

#### CouponReceive (领取记录) `enum CouponReceiveStatus`
- `id`, `couponId`, `customerId`, `status` (UNUSED/USED/EXPIRED/INVALID)
- `validFrom`, `validTo`, `usedAt`, `usedOrder`

#### CouponExchangeCode (兑换码) `enum CouponExchangeCodeStatus`
- `id`, `couponId`, `code` (unique), `status` (UNUSED/USED/EXPIRED), `customerId`, `usedAt`, `expiresAt`

### Finance Extended

#### BalanceAccount (客户余额账户) `enum BalanceAccountStatus`
- `id`, `customerId` (unique), `availableBalance`, `totalRecharged`, `totalConsumed`, `totalRefunded`, `status` (ACTIVE/FROZEN)

#### BalanceLog (余额流水) `enum BalanceLogType`
- `id`, `account`, `customerId`, `type` (RECHARGE/CONSUME/REFUND/ADJUST/EXPIRE)
- `changeAmount`, `balanceBefore`, `balanceAfter`, `bizType`, `bizId`

#### MallRechargePackage / MallRechargeActivity
- 充值套餐：`amount`, `giftAmount`, `giftCouponId?`
- 充值活动：`startAt`, `endAt`, `rules` (满赠规则 JSON)

#### Payment (扩展) `enum PaymentMethod` / `PaymentStatus` / `PaymentType` / `PaymentRefundStatus`
- `method` 增加 `BALANCE`、`WECHAT_MINI`
- `outTradeNo`, `thirdTradeNo`, `thirdStatus`, `paidAt` 用于微信支付适配
- `PaymentRefund` 子表：`refundNo`, `amount`, `reason`, `status` (PROCESSING/SUCCESS/CLOSED/ABNORMAL), `thirdRefundNo`

### Printing

#### PrintTemplate / Printer / PrinterConfig
- PrintTemplate: `name`, `category` (LABEL/RECEIPT), `width`, `height`, `content` (DSL/HTML)
- Printer: `name`, `model`, `connectionType`, `address`, `isOnline`
- PrinterConfig: 绑定 `printerId` + `templateId` + `bizScope`，可标记 `isDefault`

### System

#### SystemSetting (系统配置 KV)
- `id`, `key` (unique), `value`, `category`, `description`

**Default seeded data:**
- Admin user: `admin` / `123456`
- Roles: `admin` (超级管理员), `user` (普通用户)
- Menus: System Management + Basic Data + Product Management + Purchase/Sales + Inventory + Finance (20+ menus)
- Basic Data: Main warehouse, 8 common units, sample categories/brands/suppliers

---

## 库存扣减事务设计 (Inventory Transaction Design)

> 所有库存增减都通过 `prisma.$transaction(async (tx) => ...)` 完成，确保「库存数量变化 + InventoryLog 流水 + 业务单据状态/数量回写」原子提交。隔离级别使用 PostgreSQL 默认 **READ COMMITTED**（未显式覆盖）。

### 1. 库存数据模型三栏制

`Inventory` 表对每个 `(skuId, warehouseId)` 维护三个数值（见 `@c:\project\docker-demo\backend\prisma\schema.prisma:679-697`）：

| 字段 | 含义 | 不变量 |
|---|---|---|
| `quantity` | 物理库存（实际仓内数量） | `quantity ≥ locked` |
| `locked` | 已下单待发货占用 | `locked ≥ 0` |
| `available` | 可售/可出库数量 | `available = quantity - locked`（**显式物化**，非视图） |

**关键设计：** `available` 是物化列，所有写入路径必须同时维护 `quantity`/`locked`/`available` 三者一致；任何只改两栏的代码都是 bug。

### 2. 出/入库统一手法

每条出入库都遵循三段式：

```ts
// 伪代码
await prisma.$transaction(async (tx) => {
  const inv = await tx.inventory.findUnique({ where: { skuId_warehouseId: { skuId, warehouseId } } });
  // 1) 业务校验：库存充足、单据状态合法
  if (!inv || inv.available < qty) throw new BadRequestException('库存不足');
  // 2) 原子增减（quantity + available 一起动）
  await tx.inventory.update({ where: { id: inv.id }, data: {
    quantity: { decrement: qty }, available: { decrement: qty }
  }});
  // 3) 写流水 InventoryLog（记录 before/after/bizType/bizNo）
  await tx.inventoryLog.create({ data: { type, skuId, warehouseId, quantity, before, after, bizType, bizId, bizNo, createdBy } });
  // 4) 回写业务单据数量与状态
  await tx.purchaseItem.update(...); await tx.purchase.update(...);
});
```

### 3. 各场景实现位置

| 场景 | 关键代码 | quantity | locked | available | 流水类型 | 备注 |
|---|---|---|---|---|---|---|
| **采购入库确认** | `@c:\project\docker-demo\backend\src\domains\purchase-receipts\purchase-receipts.service.ts:276-421` | `+qty` | — | `+qty` | `IN_PURCHASE` | 同步触发 SKU 成本价**加权平均**重算（`(oldQty*oldCost + newQty*newCost) / totalQty`），并回写 `purchaseItem.received` + `Purchase.status` 推进 |
| **销售发货确认** | `@c:\project\docker-demo\backend\src\domains\shipments\shipments.service.ts:248-392` | `-qty` | — | `-qty` | `OUT_SALE` | B 端发货**未走 locked 流程**——直接扣 quantity+available；事务内回写 `orderItem.shipped` 与 `Order.status=SHIPPED` |
| **采购退货审核通过** | `@c:\project\docker-demo\backend\src\domains\purchase-returns\purchase-returns.service.ts:343-…` | `-qty` | — | `-qty` | `OUT_PURCHASE_RETURN` | 同事务扣减应付金额 |
| **销售退货审核通过** | `@c:\project\docker-demo\backend\src\domains\sale-returns\sale-returns.service.ts:342-432` | `+qty` | — | `+qty` | `IN_SALE_RETURN` | 同事务扣减原订单 `Order.payable` |
| **调拨出库 confirmOut** | `@c:\project\docker-demo\backend\src\domains\transfers\transfers.service.ts:201-267` | `-qty`(from) | — | `-qty`(from) | `OUT_TRANSFER` | 出库后状态进入 OUT；**不写中间 in-transit 表**，依赖状态机串联 |
| **调拨入库 confirmIn** | `@c:\project\docker-demo\backend\src\domains\transfers\transfers.service.ts:270-345` | `+qty`(to) | — | `+qty`(to) | `IN_TRANSFER` | 不存在则建仓库行 |
| **调拨在 OUT 后取消** | `@c:\project\docker-demo\backend\src\domains\transfers\transfers.service.ts:362-411` | `+qty`(from 回滚) | — | `+qty`(from) | `IN_ADJUST`(bizType=`TRANSFER_CANCEL`) | ⚠️ 流水类型借用 IN_ADJUST，与盘盈混用 |
| **库存调整 complete** | `@c:\project\docker-demo\backend\src\domains\adjustments\adjustments.service.ts:207-285` | `=actualQty` | 保持 | `=actualQty - locked` | `IN_ADJUST` 或 `OUT_ADJUST` | 直接置位、保留 locked，避免误释放他人占用 |
| **商城下单（C 端）锁定** | `@c:\project\docker-demo\backend\src\domains\carts\carts.service.ts:40-81`，由 `@c:\project\docker-demo\backend\src\applications\mall\mall-orders.service.ts:1292` 调用 | — | `+qty` | `-qty` | 无 InventoryLog | 跨多仓库**贪心选可用最多的仓**逐行迁移 available→locked |
| **商城订单取消/退款 释放** | `@c:\project\docker-demo\backend\src\domains\carts\carts.service.ts:91-130`，由 `mall-orders.service.ts:610-622` 调用 | — | `-qty` | `+qty` | 无 InventoryLog | 反向回滚 locked→available；不写流水（仅占位回滚） |
| **商城发货扣减真实 quantity** | `@c:\project\docker-demo\backend\src\domains\shipments\shipments.service.ts:351-388` | `-qty` | `-qty`(先释放) | 净 `-qty` | `OUT_SALE` | MALL 订单先 `releaseSkuInventoryForOrder` 把 locked→available（跨仓贪心），再原子条件 `updateMany` 扣减 quantity+available |

### 4. 风险点与注意事项（实施层观察）

#### 已修复

- **✅ Shipment 与 locked 衔接缺失**(2026-04 修)：原 `shipments.ship()` 对 mall 订单只 `decrement quantity/available` 不动 `locked`,导致 `available = quantity - locked` 不变量被破坏并可能跑负;且 `shipments.create()` 仍按 `available >= qty` 校验,使 mall 订单(创建时已 lock)永远发不出去。修复方式见 `@c:\project\docker-demo\backend\src\domains\shipments\shipments.service.ts:81-127` (按 `order.type` 分支校验:MALL 用 `quantity`,SALE 用 `available`) 与 `@c:\project\docker-demo\backend\src\domains\shipments\shipments.service.ts:351-388` (MALL 订单先调用 `cartsService.releaseSkuInventoryForOrder` 释放 locked,再走标准 quantity+available 扣减;原子 `updateMany` 携带 `quantity/available >= qty` 条件,杜绝 oversell)。需要在 `ShipmentsModule` 中 `import CartsModule`。
- **✅ 并发 oversell**(2026-04 修)：将 `findUnique → check → update` 模式改造为原子条件 `updateMany({ where: { …, quantity: { gte }, available: { gte } }, data: { decrement } })` 并断言 `count === 1`,覆盖 `shipments.ship()` / `transfers.confirmOut()` / `purchase-returns.audit()`。`carts.lockSkuInventory` 也改为带 `available: { gte }` 条件的 `updateMany` + 多轮重试以容忍并发抢占。

#### 待处理(设计层取舍)

- **B 端订单未锁库存：** `@c:\project\docker-demo\backend\src\domains\orders\orders.service.ts:73-96` 仅做总可用 `available` 求和校验后即创建订单,未占用 locked。两个并发后台用户对同一 SKU 各自下单可能在 `Shipment.ship()` 阶段才发现库存不足。**仅 C 端 (`mall-orders`) 走 locked 锁定流程。** 现状下因 `ship()` 已改为原子条件扣减,不会真正 oversell,但 UX 上「下单成功 → 发货失败」体验不佳。要彻底解决需统一让 B 端订单也在 `confirm()` 时锁库存,并在 `cancel()` 时释放,涉及前端流程改造。
- **加权平均成本多仓偏差：** 仅在 `purchase-receipts` 入库时重算成本,且使用的是 SKU 维度而非 (sku, warehouse) 维度的旧成本,在多仓场景下会偏离物理仓库实际成本。要修复需扩展成本字段到 inventory 表或加 (sku, warehouse) 维度成本表。
- **分布式 locked 无法精确归属订单：** `Inventory.locked` 是 (sku, warehouse) 维度的总数,无法区分「这部分 locked 是哪个订单的」。当某 mall 订单取消触发 `releaseSkuInventoryForOrder` 时,贪心释放策略可能误释放其他订单的 lock(但总量正确)。要精确归属需新增 `OrderInventoryLock` 表 `(orderId, skuId, warehouseId, qty)`。
- **流水语义噪音：** 调拨取消的回滚流水使用 `IN_ADJUST` + `bizType: TRANSFER_CANCEL`,与盘盈无法仅靠 `type` 字段区分,需联合 `bizType` 解读。要彻底分清需新增 `IN_TRANSFER_CANCEL` 等枚举值(migration)。
- **软删除一致性：** 入库/发货等检查均显式过滤 `deletedAt: null`,但 Inventory 表自身**不软删**,仓库或 SKU 软删除后历史 inventory 行仍存在,查询层需要 join 过滤。

---

## 单据状态机 (Document State Machines)

### 1. 采购链 Purchase → PurchaseReceipt → PurchaseReturn

**Purchase（采购订单）** `enum PurchaseStatus`：

```
                ┌──────────────────────────────────┐
                │                                  ▼
PENDING ──audit(APPROVE)──▶ APPROVED ─receipt确认─▶ PARTIAL ─receipt确认──▶ COMPLETED
   │                          │   ▲                                  ▲
   │                          │   └────receipt 部分入库回路─────────┘
   ├──audit(REJECT)──┐        │
   │                 ▼        │
   ├──cancel()─▶ CANCELLED ◀──┘ (cancel 仅在非 COMPLETED 允许)
   └──update() 仅在 PENDING 可改
```

- 实现：`@c:\project\docker-demo\backend\src\domains\purchases\purchases.service.ts`（`audit`、`cancel`、`update` 守卫均在该文件内）
- 状态推进点：`PurchaseReceipt.confirm()` 在事务末尾根据 `every(received >= quantity)` / `some(received > 0)` 推进至 `COMPLETED` / `PARTIAL`（见 `purchase-receipts.service.ts:399-418`）
- 不可逆：`COMPLETED` 不可 cancel/delete

**PurchaseReceipt（入库单）** `enum ReceiptStatus`：

```
PENDING ──confirm()──▶ RECEIVED  (触发库存增加 + 成本重算)
   │
   └──cancel()──▶ CANCELLED      (RECEIVED 后不可 cancel/delete)
```

**PurchaseReturn（采购退货）** `enum ReturnStatus`（与 SaleReturn 共用同一 enum）：

```
PENDING ──audit(APPROVE)──▶ APPROVED ──complete()──▶ COMPLETED
   │                           │ (审核通过即扣库存 + 减应付)
   ├──audit(REJECT)─┐
   │                ▼
   └──cancel()─▶ CANCELLED   (COMPLETED 不可 cancel/delete)
```

- 注意：**审核通过即扣库存**（不在 COMPLETED 阶段），`complete()` 仅是状态收尾。

### 2. 销售链 Order → Shipment → SaleReturn

**Order（销售订单）** `enum OrderStatus` × `PayStatus` × `ShipStatus` 三维状态：

```
主状态 OrderStatus：
  PENDING ──confirm()──▶ CONFIRMED ──shipment.ship()──▶ SHIPPED ──shipment.receive()──▶ COMPLETED
     │                       │                              │
     ├──cancel()─┐            │                              │
     │           ▼            │                              │
     └─────▶ CANCELLED ◀──────┘                              │
                                                             │
  PROCESSING (定义但未在 service 中流转)                     │
  REFUNDING ─────────────▶ REFUNDED  (商城退款流程)          │
                                                             │
                                                             ▼ (商城确认收货后可 SaleReturn)

支付状态 PayStatus: UNPAID → PARTIAL → PAID → REFUNDING → REFUNDED
发货状态 ShipStatus: UNSHIPPED → PARTIAL → SHIPPED → RECEIVED
```

- B 端订单：`orders.service.ts:329` `confirm()` 仅状态变更，不锁库存
- 商城订单：在 `mall-orders.service.ts` 创建时即调用 `cartsService.lockSkuInventoryForOrder` 占用 locked
- `shipments.ship()` 同步把 `Order.status` 推到 SHIPPED 且 `shipStatus = SHIPPED`（注意：当前实现未走 PARTIAL，因 `Shipment.create` 强制要求一次性发完所有 pending 行——见 `shipments.service.ts:72-87`）
- `shipments.receive()` 把 `Order.status` 推到 COMPLETED（`shipments.service.ts:431-437`）
- 修改限制：`update()` 仅 PENDING；`cancel()` 不允许 COMPLETED

**Shipment（发货单）** `enum ShipmentStatus`：

```
PENDING ──ship()──▶ SHIPPED ──receive()──▶ RECEIVED
                                  ▲
                                  │ 已 RECEIVED 才允许 SaleReturn

取消路径：仅 PENDING 状态可 remove()，SHIPPED/RECEIVED 不可删
```

- 一个 Order 只能有一张未删除的 Shipment（`shipments.service.ts:56-65` 强约束）

**SaleReturn（销售退货）**：

```
PENDING ──audit(APPROVE)──▶ APPROVED ──complete()──▶ COMPLETED
   │                            │ (审核通过即增库存 + 减原 Order.payable)
   ├──audit(REJECT)─┐
   │                ▼
   └──cancel()─▶ CANCELLED   (COMPLETED 不可 cancel/delete)
```

- 校验：仅基于 `Shipment.status === RECEIVED` 才能创建；按已退数量扣减可退余量（`getReturnedQuantity` 聚合 `APPROVED + COMPLETED` 状态的 SaleReturnItem）

### 3. 库存运营链 Transfer / Adjustment

**Transfer（调拨单）** `enum TransferStatus`：

```
PENDING ──confirmOut()──▶ OUT ──confirmIn()──▶ COMPLETED
   │                       │
   │                       └──cancel()──▶ CANCELLED  (回滚 from 仓库存)
   └──cancel()──▶ CANCELLED  (无库存回滚)

⚠️ enum 中定义了 IN 状态但 service 中未使用（OUT 后直接到 COMPLETED）
```

**Adjustment（调整/盘点单）** `enum AdjustmentStatus`：

```
PENDING ──audit()──▶ APPROVED ──complete()──▶ COMPLETED
   │
   └──cancel()──▶ CANCELLED  (COMPLETED 不可 cancel)
```

- 三段式：录入 → 审核 → 执行调整。差异为 0 的明细在 complete 时跳过流水。

### 4. 状态机一致性观察

- **审核 vs 完成的语义不统一：** 采购退货 / 销售退货在 `audit(APPROVE)` 一步即扣减库存，`complete()` 仅是状态收尾；而 Adjustment 是 `audit→APPROVED` 仅状态变更，真实库存动作在 `complete()`。文档/前端按钮文案需注意区分。
- **取消的回滚边界：** 只有 `transfers.cancel(OUT)` 显式补偿出库扣减；其它单据（PurchaseReturn/SaleReturn）一旦审核通过即不允许直接取消，必须走 COMPLETED 后另开反向单据。
- **Order 三维状态：** `status` / `payStatus` / `shipStatus` 互不严格联动，不同入口（B 端 confirm 仅推 status，商城支付推 status+payStatus）维护各自部分。前端筛选/列表展示时需要明确判断维度。

---

## API Architecture

### Response Format

All API responses follow a unified format via `TransformInterceptor`:

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

Error responses (via `HttpExceptionFilter`):

```json
{
  "code": 400,
  "message": "Error message",
  "data": null,
  "path": "/api/...",
  "timestamp": "2026-01-..."
}
```

### Authentication

- JWT-based authentication
- Token required for protected endpoints (use `@UseGuards(JwtAuthGuard)`)
- Swagger UI has Bearer auth support for testing

### Key Endpoints

#### Auth
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/auth/register` | POST | User registration | No |
| `/auth/login` | POST | User login | No |
| `/auth/me` | GET | Get current user | Yes |

#### RBAC Core
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/users` | GET/POST | User CRUD | Yes |
| `/roles` | GET/POST | Role CRUD | Yes |
| `/menus` | GET/POST | Menu CRUD | Yes |

#### Basic Data (v1.0)
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/units` | GET/POST | Unit management | Yes |
| `/categories` | GET/POST | Category tree | Yes |
| `/brands` | GET/POST | Brand management | Yes |
| `/warehouses` | GET/POST | Warehouse management | Yes |
| `/suppliers` | GET/POST | Supplier management | Yes |
| `/customers` | GET/POST | Customer management | Yes |

#### Product Management (v1.0)
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/products` | GET/POST | Product list / Create | Yes |
| `/products/:id` | GET/PATCH/DELETE | Product CRUD | Yes |
| `/products/:id/status` | PATCH | Toggle status | Yes |
| `/products/:id/skus` | GET | Get SKU list | Yes |
| `/skus/:id` | PATCH | Update SKU | Yes |
| `/skus/:id/price` | PATCH | Update price | Yes |

#### Inventory Management (v1.0)
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/inventories` | GET | Inventory list | Yes |
| `/inventories/stats` | GET | Inventory stats | Yes |
| `/inventories/warnings` | GET | Stock warnings | Yes |
| `/inventories/:id` | PATCH | Update inventory | Yes |
| `/inventory-logs` | GET | Inventory logs | Yes |
| `/transfers` | GET/POST | Transfer orders | Yes |
| `/transfers/:id` | GET/PATCH | Transfer detail/update | Yes |
| `/transfers/:id/out` | PATCH | Confirm outbound | Yes |
| `/transfers/:id/in` | PATCH | Confirm inbound | Yes |
| `/adjustments` | GET/POST | Adjustment orders | Yes |
| `/adjustments/:id` | GET/PATCH | Adjustment detail/update | Yes |
| `/adjustments/:id/audit` | PATCH | Audit adjustment | Yes |

#### Purchase Management (v1.0)
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/purchases` | GET/POST | Purchase orders | Yes |
| `/purchases/:id` | GET/PATCH | Purchase detail/update | Yes |
| `/purchases/:id/audit` | PATCH | Audit purchase | Yes |
| `/purchase-receipts` | GET/POST | Purchase receipts | Yes |
| `/purchase-receipts/:id` | GET/PATCH | Receipt detail | Yes |
| `/purchase-receipts/:id/confirm` | PATCH | Confirm receipt | Yes |
| `/purchase-returns` | GET/POST | Purchase returns | Yes |
| `/purchase-returns/:id` | GET/PATCH | Return detail | Yes |
| `/purchase-returns/:id/audit` | PATCH | Audit return | Yes |

#### Sales Management (v1.0)
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/orders` | GET/POST | Sales orders | Yes |
| `/orders/:id` | GET/PATCH | Order detail/update | Yes |
| `/orders/:id/confirm` | PATCH | Confirm order | Yes |
| `/orders/:id/cancel` | PATCH | Cancel order | Yes |
| `/shipments` | GET/POST | Shipments | Yes |
| `/shipments/:id` | GET/PATCH | Shipment detail | Yes |
| `/shipments/:id/ship` | PATCH | Confirm shipment | Yes |
| `/shipments/:id/receive` | PATCH | Confirm receive | Yes |
| `/sale-returns` | GET/POST | Sale returns | Yes |
| `/sale-returns/:id` | GET/PATCH | Return detail | Yes |
| `/sale-returns/:id/audit` | PATCH | Audit return | Yes |

#### Finance (v1.0)
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/payments` | GET/POST | Payment records | Yes |
| `/payments/stats/payable` | GET | Payable stats | Yes |
| `/payments/stats/receivable` | GET | Receivable stats | Yes |

#### File Storage (v1.0)
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/files/upload` | POST | Upload file to MinIO | Yes |
| `/files/:filename` | GET | Get file URL | Yes |

#### Mall - C 端 (v1.0)
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/mall/products` | GET | 商城商品列表 | No |
| `/mall/products/:id` | GET | 商品详情 | No |
| `/mall/categories` | GET | 分类树 | No |
| `/mall/brands` | GET | 品牌列表 | No |
| `/mall/banners` | GET | 轮播图 | No |
| `/mall/hot-searches` | GET | 热搜词 | No |
| `/mall/orders` | GET/POST | 商城订单（创建时锁库存） | Yes |
| `/mall/orders/:id/pay` | POST | 微信/余额支付 | Yes |
| `/mall/orders/:id/cancel` | POST | 取消并释放库存 | Yes |
| `/mall/orders/wechat/notify` | POST | 微信支付回调 | No |
| `/mall/balance/account` | GET | 余额账户 | Yes |
| `/mall/balance/recharge` | POST | 余额充值（套餐/活动） | Yes |
| `/mall/coupons/claim` | POST | 领取优惠券 | Yes |
| `/mall/coupons/exchange` | POST | 兑换码兑换 | Yes |
| `/mall/coupons/my` | GET | 我的优惠券 | Yes |
| `/carts` | GET/POST | 购物车 | Yes |
| `/carts/:id` | PATCH/DELETE | 更新/移除购物车 | Yes |
| `/carts/clear` | DELETE | 清空购物车 | Yes |
| `/favorites` | GET/POST/DELETE | 收藏 | Yes |
| `/browse-histories` | GET/DELETE | 浏览历史 | Yes |
| `/customer-addresses` | GET/POST/PATCH/DELETE | 收货地址 | Yes |
| `/reviews` | GET/POST | 商品评价 | Yes |
| `/reviews/:id/reply` | POST | 商家回复（管理员） | Yes |

#### Marketing & 系统 (v1.0)
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/coupons` | GET/POST/PATCH/DELETE | 优惠券模板 CRUD | Yes |
| `/coupons/:id/issue` | POST | 发放给指定客户 | Yes |
| `/coupons/:id/exchange-codes` | GET/POST | 兑换码生成/查询 | Yes |
| `/banners` | GET/POST/PATCH/DELETE | 轮播图管理 | Yes |
| `/mall-hot-searches` | GET/POST/PATCH/DELETE | 热搜词管理 | Yes |
| `/mall-recharge-packages` | GET/POST/PATCH/DELETE | 充值套餐 | Yes |
| `/mall-recharge-activities` | GET/POST/PATCH/DELETE | 充值活动 | Yes |
| `/balances/accounts` | GET | 余额账户列表 | Yes |
| `/balances/logs` | GET | 余额流水 | Yes |
| `/system-settings` | GET/PATCH | 系统配置项 | Yes |
| `/print-templates` | GET/POST/PATCH/DELETE | 打印模板 | Yes |
| `/printers` | GET/POST/PATCH/DELETE | 打印机设备 | Yes |
| `/printer-configs` | GET/POST/PATCH | 打印机绑定与默认 | Yes |

Full API documentation available at `/api/docs` when backend is running.

---

## Code Style Guidelines

### Current State

**⚠️ Note:** The project currently lacks formal linting configuration. Based on existing code:

### Backend (NestJS)

- **Imports:** Group by external → internal, alphabetical within groups
- **Decorators:** One per line for class decorators
- **Naming:**
  - Classes: PascalCase (e.g., `AuthService`, `UsersController`)
  - Methods: camelCase
  - Files: kebab-case with dot notation (e.g., `auth.controller.ts`)
- **Module Pattern:** Each feature has its own module folder with `.module.ts`, `.controller.ts`, `.service.ts`
- **DTOs:** Use `class-validator` decorators for validation
- **Comments:** Chinese comments for business logic

### Frontend (Vue 3)

- **Vue SFC:** `<script setup>` syntax with TypeScript
- **Component names:** PascalCase
- **File organization:** Views in `views/`, API calls in `api/`, stores in `store/`
- **Styling:** Tailwind CSS classes, minimal custom CSS

### Mobile (Uni-app)

- **Framework:** Uni-app with Vue 3
- **UI Library:** Wot Design Uni
- **Styling:** UnoCSS + custom SCSS
- **API Client:** Alova (lightweight request library)

### Path Aliases

Both projects use `@/` alias for `src/` directory:

```typescript
// Backend
import { AuthService } from '@/auth/auth.service';

// Frontend
import { useAuthStore } from '@/store/auth';

// Mobile
import { useUserStore } from '@/store/user';
```

---

## Testing Instructions

### Current State

**⚠️ Warning:** The project has minimal test coverage. Jest is configured but with `--passWithNoTests` flag.

### Running Tests

```bash
# Backend
cd backend
pnpm test              # Run Jest tests
pnpm test:cov          # Run with coverage report

# Note: Tests require database connection
# Set DATABASE_URL environment variable before running
```

### Test Configuration

- **Backend:** Jest with ts-jest, test files in `test/` directory
- **Test Environment:** Node.js
- **File Pattern:** `*.spec.ts`

### Missing Test Coverage

As noted in `ENGINEERING_IMPROVEMENTS.md`:
- No unit tests for services
- No integration tests for controllers
- No E2E tests
- No frontend tests

---

## Security Considerations

### ⚠️ Known Security Issues

1. **Hardcoded JWT Secret**
   - Location: `docker-compose.yaml`
   - Current value: `your-super-secret-jwt-key-change-in-production`
   - **Action Required:** Change before production deployment

2. **Database Port Exposed**
   - PostgreSQL port 5432 is mapped to host
   - **Risk:** Database accessible from host machine
   - **Recommended:** Remove `ports` from db service, use `expose` instead

3. **MinIO Default Credentials**
   - Current credentials: `minioadmin`/`minioadmin123`
   - **Action Required:** Change for production

4. **Missing Security Middleware**
   - No Helmet for security headers
   - No rate limiting
   - No request body size limits

5. **Default Credentials**
   - Admin password in seed: `123456`
   - Database password: `postgres`

### Security Recommendations

```yaml
# docker-compose.yaml improvements needed
services:
  db:
    # Remove: ports: - "5432:5432"
    expose:
      - "5432"  # Only internal network access
  
  backend:
    environment:
      - JWT_SECRET=${JWT_SECRET}  # Use env var, not hardcoded
      
  minio:
    environment:
      - MINIO_ROOT_USER=${MINIO_ROOT_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
```

---

## Deployment Process

### CI/CD Pipeline

GitHub Actions workflow: `.github/workflows/deploy.yml`

**Triggers:**
- Push to `master` branch
- Manual workflow dispatch

**Pipeline Steps:**
1. **Build & Test Job:**
   - Checkout code
   - Setup pnpm and Node.js 20
   - Install backend dependencies
   - Generate Prisma client
   - Build backend
   - Run tests (with PostgreSQL service)
   - Install and build frontend

2. **Deploy Job:**
   - SSH to production server
   - Pull latest code
   - Build Docker images
   - Run database migrations
   - Seed data (if needed)
   - Start/update all services

### Required Secrets

Configure in GitHub Settings → Secrets:

- `SERVER_HOST` - Production server IP/hostname
- `SERVER_USER` - SSH username
- `SSH_PRIVATE_KEY` - SSH private key for deployment
- `SSH_TARGET_DIR` - Deployment directory on server

### Production Deployment Checklist

- [ ] Change JWT_SECRET to secure random string
- [ ] Change MinIO credentials
- [ ] Remove PostgreSQL port exposure
- [ ] Configure firewall rules
- [ ] Setup SSL/TLS certificates
- [ ] Configure environment-specific variables
- [ ] Setup log rotation
- [ ] Configure database backups

---

## Development Notes

### Package Manager

This project uses **pnpm** exclusively. Do not use npm or yarn.

```bash
# Enable pnpm (if using corepack)
corepack enable

# Install dependencies
pnpm install
```

**Package Manager Versions:**
- Backend: pnpm@10.26.2
- Frontend: Uses system pnpm
- Mobile: pnpm@9.9.0

### Database Migrations

```bash
# Create new migration (development)
cd backend
pnpm prisma migrate dev --name migration_name

# Deploy migrations (production)
pnpm prisma migrate deploy

# Reset database (caution: destroys data)
pnpm prisma migrate reset
```

### Frontend Development Proxy

The Vite dev server proxies `/api` requests to the backend:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\api/, '')
    }
  }
}
```

### MinIO File Storage

MinIO is used for file/object storage:
- **API Endpoint:** http://localhost:9000
- **Console:** http://localhost:9001
- **Default Bucket:** `docker-demo`
- **Credentials:** minioadmin / minioadmin123 (change in production)

Files are stored with the following structure:
- `products/{productId}/{filename}` - Product images
- `brands/{brandId}/{filename}` - Brand logos
- `avatars/{userId}/{filename}` - User avatars

---

## Common Issues

### Database Connection Errors

Ensure PostgreSQL container is healthy before running migrations:

```bash
# Check database status
docker-compose ps

# View database logs
docker-compose logs db
```

### Prisma Client Generation

If you see Prisma client errors after dependency changes:

```bash
cd backend
pnpm prisma:generate
```

### Port Conflicts

Default ports used:
- 8080 - Frontend Admin (Nginx)
- 3001 - Backend API
- 5432 - PostgreSQL (exposed to host)
- 9000 - MinIO API
- 9001 - MinIO Console
- 5173 - Vite dev server (development only)

### File Upload Issues

Ensure MinIO container is running and bucket exists:

```bash
# Check MinIO status
docker-compose ps minio

# View MinIO logs
docker-compose logs minio
```

---

## References

- [ENGINEERING_IMPROVEMENTS.md](./ENGINEERING_IMPROVEMENTS.md) - Detailed engineering improvement suggestions (in Chinese)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Vue.js Documentation](https://vuejs.org/guide/introduction.html)
- [Naive UI Documentation](https://www.naiveui.com)
- [Uni-app Documentation](https://uniapp.dcloud.net.io/)
- [Wot Design Uni Documentation](https://wot-design-uni.cn/)
- [MinIO Documentation](https://min.io/docs)
