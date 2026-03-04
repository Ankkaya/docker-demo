# AGENTS.md - Project Documentation for AI Coding Agents

## Project Overview

This is a **full-stack Mall + Inventory Management System (商城+进销存系统)** built on top of an RBAC (Role-Based Access Control) Admin System.

**Current Progress:**
- ✅ RBAC Core: User/Role/Menu management
- ✅ v1.0 Basic Data: Unit/Category/Brand/Warehouse/Supplier/Customer
- ✅ v1.0 Product Management: SPU/SKU/Inventory/Stock Query
- ✅ v1.0 Purchase/Sale: Purchase orders/Purchase receipts/Purchase returns/Sale orders/Shipments/Sale returns
- ✅ v1.0 Inventory: Stock transfer/Stock adjustment/Inventory logs
- ✅ v1.0 Finance: Payment records/Receivables & Payables
- ✅ v1.0 File Storage: MinIO object storage integration
- ✅ v1.0 Mall: Shopping cart/Product browsing (Backend APIs ready)
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

```
docker-demo/
├── backend/                 # NestJS Backend API
│   ├── src/
│   │   ├── auth/           # Authentication module (JWT, login, register)
│   │   ├── users/          # User management module
│   │   ├── roles/          # Role management module
│   │   ├── menus/          # Menu management module (tree structure)
│   │   ├── units/          # [v1.0] 计量单位模块
│   │   ├── categories/     # [v1.0] 商品分类模块（树形）
│   │   ├── brands/         # [v1.0] 品牌管理模块
│   │   ├── warehouses/     # [v1.0] 仓库管理模块
│   │   ├── suppliers/      # [v1.0] 供应商管理模块
│   │   ├── customers/      # [v1.0] 客户管理模块
│   │   ├── products/       # [v1.0] 商品管理模块（SPU/SKU）
│   │   ├── inventories/    # [v1.0] 库存管理模块
│   │   ├── purchases/      # [v1.0] 采购订单模块
│   │   ├── purchase-receipts/  # [v1.0] 采购入库模块
│   │   ├── purchase-returns/   # [v1.0] 采购退货模块
│   │   ├── orders/         # [v1.0] 销售订单模块
│   │   ├── shipments/      # [v1.0] 发货管理模块
│   │   ├── sale-returns/   # [v1.0] 销售退货模块
│   │   ├── transfers/      # [v1.0] 库存调拨模块
│   │   ├── adjustments/    # [v1.0] 库存调整模块
│   │   ├── payments/       # [v1.0] 收付款管理模块
│   │   ├── carts/          # [v1.0] 购物车模块
│   │   ├── mall/           # [v1.0] 商城前台接口模块
│   │   ├── minio/          # [v1.0] MinIO文件存储模块
│   │   ├── prisma/         # Prisma service module
│   │   ├── redis/          # Redis service
│   │   ├── common/         # Shared utilities (filters, interceptors)
│   │   ├── app.module.ts   # Root module
│   │   └── main.ts         # Application entry point
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

**Default seeded data:**
- Admin user: `admin` / `123456`
- Roles: `admin` (超级管理员), `user` (普通用户)
- Menus: System Management + Basic Data + Product Management + Purchase/Sales + Inventory + Finance (20+ menus)
- Basic Data: Main warehouse, 8 common units, sample categories/brands/suppliers

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

#### Mall (v1.0)
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/mall/products` | GET | Mall product list | No |
| `/mall/products/:id` | GET | Product detail | No |
| `/mall/categories` | GET | Category list | No |
| `/mall/brands` | GET | Brand list | No |
| `/carts` | GET/POST | Shopping cart | Yes |
| `/carts/:id` | PATCH/DELETE | Update/Remove cart item | Yes |
| `/carts/clear` | DELETE | Clear cart | Yes |

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
