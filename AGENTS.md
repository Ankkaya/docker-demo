# AGENTS.md - Project Documentation for AI Coding Agents

## Project Overview

This is a **full-stack Mall + Inventory Management System (商城+进销存系统)** built on top of an RBAC (Role-Based Access Control) Admin System. 

**Current Progress:**
- ✅ RBAC Core: User/Role/Menu management
- ✅ v1.0 Basic Data: Unit/Category/Brand/Warehouse/Supplier/Customer
- ✅ v1.0 Product Management: SPU/SKU/Inventory/Stock Query
- ✅ v1.0 Purchase/Sale: Purchase orders/Sale orders/Shipments
- 🚧 v1.0 Mall: Shopping/Order/Payment (Coming soon)

**Language:** Chinese (zh-CN) - Code comments and documentation are primarily in Chinese.

### Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS (Node.js), TypeScript |
| **Frontend** | Vue.js 3, TypeScript, Vite |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma |
| **Cache** | Redis |
| **Auth** | JWT + Passport.js |
| **UI Library** | Naive UI |
| **Styling** | Tailwind CSS + UnoCSS |
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
│   │   ├── mall/           # [v1.0] 商城前台接口模块
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
├── frontend/               # Vue.js 3 Frontend
│   ├── src/
│   │   ├── api/            # API request modules
│   │   │   ├── unit.ts     # [v1.0] 计量单位 API
│   │   │   ├── category.ts # [v1.0] 商品分类 API
│   │   │   ├── brand.ts    # [v1.0] 品牌 API
│   │   │   ├── warehouse.ts# [v1.0] 仓库 API
│   │   │   ├── supplier.ts # [v1.0] 供应商 API
│   │   │   ├── customer.ts # [v1.0] 客户 API
│   │   │   └── product.ts  # [v1.0] 商品/库存 API
│   │   ├── views/          # Page components
│   │   │   ├── units/      # [v1.0] 计量单位页面
│   │   │   │   └── index.vue
│   │   │   ├── categories/ # [v1.0] 商品分类页面
│   │   │   │   └── index.vue
│   │   │   ├── brands/     # [v1.0] 品牌管理页面
│   │   │   │   └── index.vue
│   │   │   ├── warehouses/ # [v1.0] 仓库管理页面
│   │   │   │   └── index.vue
│   │   │   ├── suppliers/  # [v1.0] 供应商管理页面
│   │   │   │   └── index.vue
│   │   │   ├── customers/  # [v1.0] 客户管理页面
│   │   │   │   └── index.vue
│   │   │   ├── products/   # [v1.0] 商品管理页面
│   │   │   │   ├── index.vue     # 商品列表
│   │   │   │   └── edit.vue      # 商品编辑
│   │   │   ├── inventories/# [v1.0] 库存查询页面
│   │   │   │   └── index.vue
│   │   │   ├── roles/      # 角色管理页面
│   │   │   │   └── index.vue
│   │   │   ├── menus/      # 菜单管理页面
│   │   │   │   └── index.vue
│   │   │   ├── users/      # 用户管理页面
│   │   │   │   └── index.vue
│   │   │   └── login/      # 登录页面
│   │   │       └── index.vue
│   │   ├── router/         # Vue Router configuration
│   │   ├── stores/         # Pinia stores
│   │   ├── types/          # TypeScript type definitions
│   │   │   ├── basic-data.ts # [v1.0] 基础数据类型定义
│   │   │   └── product.ts  # [v1.0] 商品管理类型定义
│   │   ├── App.vue         # Root component
│   │   └── main.ts         # Application entry point
│   ├── Dockerfile          # Multi-stage build with Nginx
│   ├── nginx.conf          # Nginx configuration
│   └── package.json
├── docker-compose.yaml     # Full stack orchestration
├── .github/workflows/      # CI/CD workflows
├── .claude/                # AI 助手配置
│   ├── rules/              # 规则文档
│   └── skills/             # Skill 定义
│       └── doc-sync/       # 文档同步检查 Skill
├── version/                # 版本计划文档
│   └── v1.0.md             # V1.0 开发计划
└── start-local.sh/ps1      # Local development scripts
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
1. Start PostgreSQL database container
2. Run Prisma migrations
3. Seed initial data (admin user: `admin`/`123456`)
4. Start all services

Access points after startup:
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api/docs

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
pnpm db:setup            # Run migrations + seed

# Testing (currently no actual tests)
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
- `name`, `createdAt`, `updatedAt`
- Many-to-many relationship with Roles
- One-to-one relationship with Customer (optional)

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
- `sort`, `icon`, `image`, `isEnabled`
- Self-referential relationship for parent-child hierarchy

#### Brand (品牌)
- `id`, `name` (unique), `logo`, `description`
- `sort`, `isEnabled`

#### Warehouse (仓库)
- `id`, `name`, `code` (unique), `address`, `contact`, `phone`
- `isDefault`, `isEnabled`

#### Supplier (供应商)
- `id`, `name`, `code` (unique), `contact`, `phone`, `email`, `address`
- `bankName`, `bankAccount`, `taxNo`
- `creditLimit`, `period`, `isEnabled`, `remark`

#### Customer (客户)
- `id`, `name`, `code` (unique), `type` (INDIVIDUAL/COMPANY)
- `contact`, `phone`, `email`, `address`
- `creditLimit`, `period`, `isEnabled`, `remark`
- `userId` (optional, link to User for mall customers)

### Product Entities (v1.0)

#### Product (商品SPU)
- `id`, `name`, `spuCode` (unique), `description`, `detail` (富文本)
- `categoryId`, `brandId`, `unitId`
- `mainImage`, `images` (数组)
- `specTemplate` (JSON, 规格模板)
- `status` (DRAFT/PENDING/APPROVED/REJECTED/DISABLED), `isEnabled`
- One-to-many relationship with ProductSku

#### ProductSku (商品SKU)
- `id`, `skuCode` (unique), `productId`
- `specs` (JSON, 规格组合如 {"颜色": "红", "尺码": "XL"})
- `costPrice`, `salePrice`, `marketPrice`
- `image`, `barcode`, `weight`, `volume`
- `isDefault`, `sort`, `status` (ACTIVE/INACTIVE/DELETED)
- One-to-many relationship with Inventory

#### Inventory (库存)
- `id`, `skuId`, `warehouseId`
- `quantity` (实际库存), `locked` (锁定库存), `available` (可用库存)
- `minStock` (安全库存), `maxStock` (库存上限), `location` (库位)
- Unique constraint on [skuId, warehouseId]

#### Purchase Management (采购管理)
- **Purchase**: `id`, `orderNo`, `supplierId`, `warehouseId`, `totalAmount`, `discount`, `payable`, `paid`, `status`
- **PurchaseItem**: `id`, `purchaseId`, `skuId`, `quantity`, `received`, `price`, `amount`
- **PurchaseReceipt**: `id`, `receiptNo`, `purchaseId`, `warehouseId`, `totalAmount`, `status`
- **PurchaseReceiptItem**: `id`, `receiptId`, `skuId`, `quantity`, `price`
- **PurchaseReturn**: `id`, `returnNo`, `receiptId`, `supplierId`, `warehouseId`, `totalAmount`, `status`
- **PurchaseReturnItem**: `id`, `returnId`, `skuId`, `quantity`, `price`, `amount`

#### Sales Management (销售管理)
- **Order**: `id`, `orderNo`, `type` (SALE/MALL), `customerId`, `totalAmount`, `discount`, `freight`, `payable`, `paid`, `status`, `payStatus`, `shipStatus`
- **OrderItem**: `id`, `orderId`, `skuId`, `quantity`, `shipped`, `price`, `amount`
- **Shipment**: `id`, `shipmentNo`, `orderId`, `warehouseId`, `logisticsCompany`, `trackingNo`, `status`
- **ShipmentItem**: `id`, `shipmentId`, `skuId`, `quantity`

#### Finance (财务管理)
- **Payment**: `id`, `type` (RECEIPT/PAYMENT), `bizType`, `orderId`, `purchaseId`, `amount`, `method`, `status`

**Default seeded data:**
- Admin user: `admin` / `123456`
- Roles: `admin` (超级管理员), `user` (普通用户)
- Menus: System Management + Basic Data + Product Management + Purchase/Sales (17+ menus)
- Basic Data: Main warehouse, 8 common units, sample categories/brands/supplier

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
| `/inventories/initialize` | POST | Init inventory | Yes |

#### Inventory Management (v1.0)
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/inventories` | GET | Inventory list | Yes |
| `/inventories/stats` | GET | Inventory stats | Yes |
| `/inventories/warnings` | GET | Stock warnings | Yes |
| `/inventories/:id` | PATCH | Update inventory | Yes |

#### Purchase Management (v1.0)
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/purchases` | GET/POST | Purchase orders | Yes |
| `/purchases/:id` | GET/PATCH | Purchase detail/update | Yes |
| `/purchases/:id/audit` | PATCH | Audit purchase | Yes |
| `/purchase-receipts` | GET/POST | Purchase receipts | Yes |
| `/purchase-receipts/:id/confirm` | PATCH | Confirm receipt | Yes |
| `/purchase-returns` | GET/POST | Purchase returns | Yes |
| `/purchase-returns/:id/audit` | PATCH | Audit return | Yes |

#### Sales Management (v1.0)
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/orders` | GET/POST | Sales orders | Yes |
| `/orders/:id` | GET/PATCH | Order detail/update | Yes |
| `/orders/:id/confirm` | PATCH | Confirm order | Yes |
| `/orders/:id/cancel` | PATCH | Cancel order | Yes |
| `/shipments` | GET/POST | Shipments | Yes |
| `/shipments/:id/ship` | PATCH | Confirm shipment | Yes |
| `/shipments/:id/receive` | PATCH | Confirm receive | Yes |

#### Finance (v1.0)
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/payments` | GET/POST | Payment records | Yes |
| `/payments/stats/payable` | GET | Payable stats | Yes |

#### Mall (v1.0)
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/mall/products` | GET | Mall product list | No |
| `/mall/products/:id` | GET | Product detail | No |
| `/mall/categories` | GET | Category list | No |
| `/mall/brands` | GET | Brand list | No |

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
- **File organization:** Views in `views/`, API calls in `api/`, stores in `stores/`
- **Styling:** Tailwind CSS classes, minimal custom CSS

### Path Aliases

Both projects use `@/` alias for `src/` directory:

```typescript
// Backend
import { AuthService } from '@/auth/auth.service';

// Frontend
import { useAuthStore } from '@/stores/auth';
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

3. **Missing Security Middleware**
   - No Helmet for security headers
   - No rate limiting
   - No request body size limits

4. **Default Credentials**
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
- [ ] Remove PostgreSQL port exposure
- [ ] Configure firewall rules
- [ ] Setup SSL/TLS certificates
- [ ] Configure environment-specific variables
- [ ] Setup log rotation
- [ ] Configure database backups

---

## Development Notes

### Package Manager

This project uses **pnpm** (v10.26.2) exclusively. Do not use npm or yarn.

```bash
# Enable pnpm (if using corepack)
corepack enable

# Install dependencies
pnpm install
```

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
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

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
- 8080 - Frontend (Nginx)
- 3001 - Backend API
- 5432 - PostgreSQL (exposed to host)
- 5173 - Vite dev server (development only)

---

## References

- [ENGINEERING_IMPROVEMENTS.md](./ENGINEERING_IMPROVEMENTS.md) - Detailed engineering improvement suggestions (in Chinese)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Vue.js Documentation](https://vuejs.org/guide/introduction.html)
- [Naive UI Documentation](https://www.naiveui.com)
