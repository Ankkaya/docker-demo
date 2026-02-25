import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  // ==================== 1. 创建角色 ====================
  const adminRole = await prisma.role.upsert({
    where: { code: 'admin' },
    update: {},
    create: {
      name: '超级管理员',
      code: 'admin',
      description: '拥有所有权限的超级管理员角色',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { code: 'user' },
    update: {},
    create: {
      name: '普通用户',
      code: 'user',
      description: '普通用户角色',
    },
  });

  // ==================== 2. 创建菜单 ====================
  // 系统管理菜单组
  const systemMenu = await prisma.menu.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: '系统管理',
      path: '/system',
      icon: 'setting',
      component: 'Layout',
      order: 1,
      type: 'menu',
    },
  });

  const userManagementMenu = await prisma.menu.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: '用户管理',
      path: '/system/users',
      icon: 'user',
      component: 'system/user/index',
      parentId: 1,
      order: 1,
      type: 'menu',
    },
  });

  const roleManagementMenu = await prisma.menu.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: '角色管理',
      path: '/system/roles',
      icon: 'peoples',
      component: 'system/role/index',
      parentId: 1,
      order: 2,
      type: 'menu',
    },
  });

  const menuManagementMenu = await prisma.menu.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      name: '菜单管理',
      path: '/system/menus',
      icon: 'menu',
      component: 'system/menu/index',
      parentId: 1,
      order: 3,
      type: 'menu',
    },
  });

  // ==================== 3. 创建基础数据菜单 ====================
  // 【必需】基础数据菜单组 - 没有这些菜单无法访问基础数据模块
  const basicDataMenu = await prisma.menu.upsert({
    where: { id: 10 },
    update: {},
    create: {
      id: 10,
      name: '基础数据',
      path: '/basic',
      icon: 'database',
      component: 'Layout',
      order: 2,
      type: 'menu',
    },
  });

  const unitMenu = await prisma.menu.upsert({
    where: { id: 11 },
    update: {},
    create: {
      id: 11,
      name: '计量单位',
      path: '/basic/units',
      icon: 'measurement',
      component: 'basic/unit/index',
      parentId: 10,
      order: 1,
      type: 'menu',
    },
  });

  const categoryMenu = await prisma.menu.upsert({
    where: { id: 12 },
    update: {},
    create: {
      id: 12,
      name: '商品分类',
      path: '/basic/categories',
      icon: 'category',
      component: 'basic/category/index',
      parentId: 10,
      order: 2,
      type: 'menu',
    },
  });

  const brandMenu = await prisma.menu.upsert({
    where: { id: 13 },
    update: {},
    create: {
      id: 13,
      name: '品牌管理',
      path: '/basic/brands',
      icon: 'brand',
      component: 'basic/brand/index',
      parentId: 10,
      order: 3,
      type: 'menu',
    },
  });

  const warehouseMenu = await prisma.menu.upsert({
    where: { id: 14 },
    update: {},
    create: {
      id: 14,
      name: '仓库管理',
      path: '/basic/warehouses',
      icon: 'warehouse',
      component: 'basic/warehouse/index',
      parentId: 10,
      order: 4,
      type: 'menu',
    },
  });

  const supplierMenu = await prisma.menu.upsert({
    where: { id: 15 },
    update: {},
    create: {
      id: 15,
      name: '供应商管理',
      path: '/basic/suppliers',
      icon: 'supplier',
      component: 'basic/supplier/index',
      parentId: 10,
      order: 5,
      type: 'menu',
    },
  });

  const customerMenu = await prisma.menu.upsert({
    where: { id: 16 },
    update: {},
    create: {
      id: 16,
      name: '客户管理',
      path: '/basic/customers',
      icon: 'customer',
      component: 'basic/customer/index',
      parentId: 10,
      order: 6,
      type: 'menu',
    },
  });

  // ==================== 3.1 创建商品管理菜单 ====================
  // ==================== 3.1 创建商品管理菜单 ====================
  const productMenu = await prisma.menu.upsert({
    where: { id: 20 },
    update: {},
    create: {
      id: 20,
      name: '商品管理',
      path: '/products',
      icon: 'shopping',        // 购物袋图标 - 代表商品管理
      component: 'Layout',
      order: 3,
      type: 'menu',
    },
  });

  const productListMenu = await prisma.menu.upsert({
    where: { id: 21 },
    update: {},
    create: {
      id: 21,
      name: '商品列表',
      path: '/products/list',
      icon: 'goods',           // 带勾选购物袋 - 代表商品清单
      component: 'product/list/index',
      parentId: 20,
      order: 1,
      type: 'menu',
    },
  });

  const inventoryMenu = await prisma.menu.upsert({
    where: { id: 22 },
    update: {},
    create: {
      id: 22,
      name: '库存查询',
      path: '/inventories',
      icon: 'inventory',       // 层叠图标 - 代表库存/仓储
      component: 'inventory/index',
      parentId: 20,
      order: 2,
      type: 'menu',
    },
  });

  // ==================== 4. 创建进销存菜单 ====================
  const inventoryMgmtMenu = await prisma.menu.upsert({
    where: { id: 30 },
    update: {},
    create: {
      id: 30,
      name: '进销存',
      path: '/inventory-mgmt',
      icon: 'inventory-2',     // 仓库图标 - 代表进销存
      component: 'Layout',
      order: 4,
      type: 'menu',
    },
  });

  const purchaseMenu = await prisma.menu.upsert({
    where: { id: 31 },
    update: {
      component: 'purchases/index',
    },
    create: {
      id: 31,
      name: '采购订单',
      path: '/purchases',
      icon: 'order',           // 订单图标
      component: 'purchases/index',
      parentId: 30,
      order: 1,
      type: 'menu',
    },
  });

  const purchaseReceiptMenu = await prisma.menu.upsert({
    where: { id: 32 },
    update: {
      component: 'purchase-receipts/index',
    },
    create: {
      id: 32,
      name: '采购入库',
      path: '/purchase-receipts',
      icon: 'inbound',         // 入库图标
      component: 'purchase-receipts/index',
      parentId: 30,
      order: 2,
      type: 'menu',
    },
  });

  const purchaseReturnMenu = await prisma.menu.upsert({
    where: { id: 33 },
    update: {
      component: 'purchase-returns/index',
    },
    create: {
      id: 33,
      name: '采购退货',
      path: '/purchase-returns',
      icon: 'return',          // 退货图标
      component: 'purchase-returns/index',
      parentId: 30,
      order: 3,
      type: 'menu',
    },
  });

  const orderMenu = await prisma.menu.upsert({
    where: { id: 34 },
    update: {},
    create: {
      id: 34,
      name: '销售订单',
      path: '/orders',
      icon: 'order',           // 订单图标
      component: 'orders/index',
      parentId: 30,
      order: 4,
      type: 'menu',
    },
  });

  const shipmentMenu = await prisma.menu.upsert({
    where: { id: 35 },
    update: {},
    create: {
      id: 35,
      name: '发货管理',
      path: '/shipments',
      icon: 'shipment',        // 发货图标
      component: 'shipments/index',
      parentId: 30,
      order: 5,
      type: 'menu',
    },
  });

  const saleReturnMenu = await prisma.menu.upsert({
    where: { id: 36 },
    update: {},
    create: {
      id: 36,
      name: '销售退货',
      path: '/sale-returns',
      icon: 'return',          // 退货图标
      component: 'sale-returns/index',
      parentId: 30,
      order: 6,
      type: 'menu',
    },
  });

  // ==================== 库存管理菜单（调拨、调整、流水）====================
  const transferMenu = await prisma.menu.upsert({
    where: { id: 37 },
    update: {},
    create: {
      id: 37,
      name: '库存调拨',
      path: '/transfers',
      icon: 'transfer',        // 调拨图标
      component: 'transfers/index',
      parentId: 30,
      order: 7,
      type: 'menu',
    },
  });

  const adjustmentMenu = await prisma.menu.upsert({
    where: { id: 38 },
    update: {},
    create: {
      id: 38,
      name: '库存调整',
      path: '/adjustments',
      icon: 'adjust',          // 调整图标
      component: 'adjustments/index',
      parentId: 30,
      order: 8,
      type: 'menu',
    },
  });

  const inventoryLogMenu = await prisma.menu.upsert({
    where: { id: 39 },
    update: {},
    create: {
      id: 39,
      name: '库存流水',
      path: '/inventory-logs',
      icon: 'log',             // 流水图标
      component: 'inventory-logs/index',
      parentId: 30,
      order: 9,
      type: 'menu',
    },
  });

  // ==================== 商城管理菜单 ====================
  const mallMenu = await prisma.menu.upsert({
    where: { id: 40 },
    update: {},
    create: {
      id: 40,
      name: '商城管理',
      path: '/mall',
      icon: 'shopping-cart',   // 购物车图标
      component: 'Layout',
      order: 5,
      type: 'menu',
    },
  });

  const cartMenu = await prisma.menu.upsert({
    where: { id: 41 },
    update: {},
    create: {
      id: 41,
      name: '购物车管理',
      path: '/carts',
      icon: 'cart',            // 购物车图标
      component: 'carts/index',
      parentId: 40,
      order: 1,
      type: 'menu',
    },
  });

  // ==================== 5. 分配菜单给角色 ====================
  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      menus: {
        set: [
          { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 },           // 系统管理
          { id: 10 }, { id: 11 }, { id: 12 }, { id: 13 },       // 基础数据
          { id: 14 }, { id: 15 }, { id: 16 },
          { id: 20 }, { id: 21 }, { id: 22 },                   // 商品管理
          { id: 30 }, { id: 31 }, { id: 32 }, { id: 33 },       // 进销存-采购
          { id: 34 }, { id: 35 }, { id: 36 },                   // 进销存-销售+退货
          { id: 37 }, { id: 38 }, { id: 39 },                   // 库存管理（调拨、调整、流水）
          { id: 40 }, { id: 41 },                               // 商城管理
        ],
      },
    },
  });

  // ==================== 5. 创建默认管理员用户 ====================
  const hashedPassword = await bcrypt.hash('123456', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      name: '超级管理员',
      roles: {
        connect: [{ id: adminRole.id }],
      },
    },
  });

  // ==================== 6. 【必需】创建默认仓库 ====================
  // 进销存系统至少需要一个仓库才能进行入库操作
  const defaultWarehouse = await prisma.warehouse.upsert({
    where: { code: 'MAIN' },
    update: {},
    create: {
      name: '主仓库',
      code: 'MAIN',
      address: '默认仓库地址',
      contact: '管理员',
      phone: '',
      isDefault: true,
      isEnabled: true,
    },
  });

  // ==================== 7. 【可选】常用计量单位 ====================
  // 建议添加，方便用户直接使用，无需手动创建
  const commonUnits = [
    { name: '个', code: 'GE', sort: 1 },
    { name: '件', code: 'JIAN', sort: 2 },
    { name: '箱', code: 'XIANG', sort: 3 },
    { name: '千克', code: 'KG', sort: 4 },
    { name: '克', code: 'G', sort: 5 },
    { name: '升', code: 'L', sort: 6 },
    { name: '毫升', code: 'ML', sort: 7 },
    { name: '米', code: 'M', sort: 8 },
  ];

  for (const unit of commonUnits) {
    await prisma.unit.upsert({
      where: { code: unit.code },
      update: {},
      create: unit,
    });
  }

  // ==================== 8. 【可选】示例商品分类 ====================
  // 帮助用户理解多级分类结构
  const electronics = await prisma.category.upsert({
    where: { code: 'ELEC' },
    update: {},
    create: {
      name: '电子产品',
      code: 'ELEC',
      level: 1,
      sort: 1,
      isEnabled: true,
    },
  });

  const phone = await prisma.category.upsert({
    where: { code: 'PHONE' },
    update: {},
    create: {
      name: '手机',
      code: 'PHONE',
      parentId: electronics.id,
      level: 2,
      sort: 1,
      isEnabled: true,
    },
  });

  const computer = await prisma.category.upsert({
    where: { code: 'COMPUTER' },
    update: {},
    create: {
      name: '电脑',
      code: 'COMPUTER',
      parentId: electronics.id,
      level: 2,
      sort: 2,
      isEnabled: true,
    },
  });

  const daily = await prisma.category.upsert({
    where: { code: 'DAILY' },
    update: {},
    create: {
      name: '日用百货',
      code: 'DAILY',
      level: 1,
      sort: 2,
      isEnabled: true,
    },
  });

  // ==================== 9. 【可选】示例品牌 ====================
  await prisma.brand.upsert({
    where: { name: 'Apple' },
    update: {},
    create: {
      name: 'Apple',
      description: '美国苹果公司',
      sort: 1,
      isEnabled: true,
    },
  });

  await prisma.brand.upsert({
    where: { name: '华为' },
    update: {},
    create: {
      name: '华为',
      description: '华为技术有限公司',
      sort: 2,
      isEnabled: true,
    },
  });

  // ==================== 10. 【可选】示例供应商 ====================
  await prisma.supplier.upsert({
    where: { code: 'SUP001' },
    update: {},
    create: {
      name: '示例供应商',
      code: 'SUP001',
      contact: '张三',
      phone: '13800138000',
      email: 'supplier@example.com',
      address: '北京市朝阳区示例路1号',
      creditLimit: 50000,
      period: 30,
      isEnabled: true,
      remark: '系统示例供应商',
    },
  });

  // ==================== 输出日志 ====================
  console.log('🌱 Seed data created successfully!');
  console.log('-----------------------------------');
  console.log('Admin User:', {
    id: adminUser.id,
    username: adminUser.username,
    email: adminUser.email,
    name: adminUser.name,
  });
  console.log('-----------------------------------');
  console.log('Admin Role:', {
    id: adminRole.id,
    name: adminRole.name,
    code: adminRole.code,
  });
  console.log('-----------------------------------');
  console.log('System Menus:', ['系统管理', '用户管理', '角色管理', '菜单管理']);
  console.log('-----------------------------------');
  console.log('Basic Data Menus:', ['基础数据', '计量单位', '商品分类', '品牌管理', '仓库管理', '供应商管理', '客户管理']);
  console.log('-----------------------------------');
  console.log('Product Menus:', ['商品管理', '商品列表', '库存查询']);
  console.log('-----------------------------------');
  console.log('Inventory Menus:', ['库存调拨', '库存调整', '库存流水']);
  console.log('-----------------------------------');
  console.log('【必需】Default Warehouse:', {
    id: defaultWarehouse.id,
    name: defaultWarehouse.name,
    code: defaultWarehouse.code,
    isDefault: defaultWarehouse.isDefault,
  });
  console.log('-----------------------------------');
  console.log('【可选】Common Units:', commonUnits.map(u => u.name).join(', '));
  console.log('-----------------------------------');
  console.log('【可选】Categories:', ['电子产品(一级)', '- 手机(二级)', '- 电脑(二级)', '日用百货(一级)']);
  console.log('-----------------------------------');
  console.log('【可选】Brands:', ['Apple', '华为']);
  console.log('-----------------------------------');
  console.log('【可选】Supplier:', '示例供应商(SUP001)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
