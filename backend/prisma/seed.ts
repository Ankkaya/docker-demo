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
  const adminRoleData = {
    name: '超级管理员',
    code: 'admin',
    description: '拥有所有权限的超级管理员角色',
  };
  const adminRole = await prisma.role.upsert({
    where: { code: 'admin' },
    update: adminRoleData,
    create: adminRoleData,
  });

  const userRoleData = {
    name: '普通用户',
    code: 'user',
    description: '普通用户角色',
  };
  const userRole = await prisma.role.upsert({
    where: { code: 'user' },
    update: userRoleData,
    create: userRoleData,
  });

  // ==================== 2. 创建菜单 ====================
  // 系统管理菜单组
  const systemMenuData = {
    name: '系统管理',
    path: '/system',
    icon: 'setting',
    component: 'Layout',
    order: 1,
    type: 'menu',
  };
  const systemMenu = await prisma.menu.upsert({
    where: { id: 1 },
    update: systemMenuData,
    create: { id: 1, ...systemMenuData },
  });

  const userManagementMenuData = {
    name: '用户管理',
    path: '/system/users',
    icon: 'user',
    component: 'system/user/index',
    parentId: 1,
    order: 1,
    type: 'menu',
  };
  const userManagementMenu = await prisma.menu.upsert({
    where: { id: 2 },
    update: userManagementMenuData,
    create: { id: 2, ...userManagementMenuData },
  });

  const roleManagementMenuData = {
    name: '角色管理',
    path: '/system/roles',
    icon: 'peoples',
    component: 'system/role/index',
    parentId: 1,
    order: 2,
    type: 'menu',
  };
  const roleManagementMenu = await prisma.menu.upsert({
    where: { id: 3 },
    update: roleManagementMenuData,
    create: { id: 3, ...roleManagementMenuData },
  });

  const menuManagementMenuData = {
    name: '菜单管理',
    path: '/system/menus',
    icon: 'menu',
    component: 'system/menu/index',
    parentId: 1,
    order: 3,
    type: 'menu',
  };
  const menuManagementMenu = await prisma.menu.upsert({
    where: { id: 4 },
    update: menuManagementMenuData,
    create: { id: 4, ...menuManagementMenuData },
  });

  await prisma.menu.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      name: '打印模板',
      path: '/system/print-templates',
      icon: 'print-template',
      component: 'print-templates/index',
      parentId: 1,
      order: 4,
      type: 'menu',
    },
  });

  await prisma.menu.upsert({
    where: { id: 6 },
    update: {},
    create: {
      id: 6,
      name: '打印机管理',
      path: '/system/printers',
      icon: 'printer',
      component: 'printers/index',
      parentId: 1,
      order: 5,
      type: 'menu',
    },
  });

  await prisma.menu.upsert({
    where: { id: 7 },
    update: {},
    create: {
      id: 7,
      name: '打印机配置',
      path: '/system/printer-configs',
      icon: 'printer-config',
      component: 'printer-configs/index',
      parentId: 1,
      order: 6,
      type: 'menu',
    },
  });

  await prisma.menu.upsert({
    where: { id: 8 },
    update: {
      name: '系统设置',
      path: '/system/settings',
      icon: 'setting',
      component: 'system-settings/index',
      parentId: 1,
      order: 7,
      type: 'menu',
      deletedAt: null,
      hidden: false,
    },
    create: {
      id: 8,
      name: '系统设置',
      path: '/system/settings',
      icon: 'setting',
      component: 'system-settings/index',
      parentId: 1,
      order: 7,
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
    update: {
      hidden: true,
      deletedAt: new Date(),
    },
    create: {
      id: 20,
      name: '商品管理',
      path: '/products',
      icon: 'shopping',        // 购物袋图标 - 代表商品管理
      component: 'Layout',
      order: 3,
      hidden: true,
      deletedAt: new Date(),
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

  const productListMenu = await prisma.menu.upsert({
    where: { id: 21 },
    update: {
      name: '商品档案',
      parentId: 30,
      order: 4,
      component: 'products/index',
      deletedAt: null,
      hidden: false,
    },
    create: {
      id: 21,
      name: '商品档案',
      path: '/products/list',
      icon: 'goods',           // 带勾选购物袋 - 代表商品清单
      component: 'products/index',
      parentId: 30,
      order: 4,
      type: 'menu',
    },
  });

  const inventoryMenu = await prisma.menu.upsert({
    where: { id: 22 },
    update: {
      parentId: 30,
      order: 7,
      component: 'inventories/index',
      deletedAt: null,
      hidden: false,
    },
    create: {
      id: 22,
      name: '库存查询',
      path: '/inventories',
      icon: 'inventory',       // 层叠图标 - 代表库存/仓储
      component: 'inventories/index',
      parentId: 30,
      order: 7,
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
    update: {
      parentId: 40,
      order: 3,
      deletedAt: null,
      hidden: false,
    },
    create: {
      id: 34,
      name: '销售订单',
      path: '/orders',
      icon: 'order',           // 订单图标
      component: 'orders/index',
      parentId: 40,
      order: 3,
      type: 'menu',
    },
  });

  const shipmentMenu = await prisma.menu.upsert({
    where: { id: 35 },
    update: {
      parentId: 40,
      order: 4,
      deletedAt: null,
      hidden: false,
    },
    create: {
      id: 35,
      name: '发货管理',
      path: '/shipments',
      icon: 'shipment',        // 发货图标
      component: 'shipments/index',
      parentId: 40,
      order: 4,
      type: 'menu',
    },
  });

  const saleReturnMenu = await prisma.menu.upsert({
    where: { id: 36 },
    update: {
      parentId: 40,
      order: 5,
      deletedAt: null,
      hidden: false,
    },
    create: {
      id: 36,
      name: '销售退货',
      path: '/sale-returns',
      icon: 'return',          // 退货图标
      component: 'sale-returns/index',
      parentId: 40,
      order: 5,
      type: 'menu',
    },
  });

  // ==================== 库存管理菜单（调拨、调整、流水）====================
  const transferMenu = await prisma.menu.upsert({
    where: { id: 37 },
    update: {
      parentId: 30,
      order: 8,
      component: 'transfers/index',
      deletedAt: null,
      hidden: false,
    },
    create: {
      id: 37,
      name: '库存调拨',
      path: '/transfers',
      icon: 'transfer',        // 调拨图标
      component: 'transfers/index',
      parentId: 30,
      order: 8,
      type: 'menu',
    },
  });

  const adjustmentMenu = await prisma.menu.upsert({
    where: { id: 38 },
    update: {
      parentId: 30,
      order: 9,
      component: 'adjustments/index',
      deletedAt: null,
      hidden: false,
    },
    create: {
      id: 38,
      name: '库存调整',
      path: '/adjustments',
      icon: 'adjust',          // 调整图标
      component: 'adjustments/index',
      parentId: 30,
      order: 9,
      type: 'menu',
    },
  });

  const inventoryLogMenu = await prisma.menu.upsert({
    where: { id: 39 },
    update: {
      parentId: 30,
      order: 10,
      component: 'inventory-logs/index',
      deletedAt: null,
      hidden: false,
    },
    create: {
      id: 39,
      name: '库存流水',
      path: '/inventory-logs',
      icon: 'log',             // 流水图标
      component: 'inventory-logs/index',
      parentId: 30,
      order: 10,
      type: 'menu',
    },
  });

  const cartMenu = await prisma.menu.upsert({
    where: { id: 41 },
    update: {
      order: 1,
      deletedAt: null,
      hidden: false,
    },
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

  const mallProductMenu = await prisma.menu.upsert({
    where: { id: 42 },
    update: {
      order: 2,
      deletedAt: null,
      hidden: false,
    },
    create: {
      id: 42,
      name: '商城商品',
      path: '/mall-products',
      icon: 'storefront',
      component: 'mall-products/index',
      parentId: 40,
      order: 2,
      type: 'menu',
    },
  });

  await prisma.menu.upsert({
    where: { id: 43 },
    update: {
      order: 6,
      deletedAt: null,
      hidden: false,
    },
    create: {
      id: 43,
      name: '轮播图管理',
      path: '/banners',
      icon: 'slideshow',
      component: 'banners/index',
      parentId: 40,
      order: 6,
      type: 'menu',
    },
  });

  await prisma.menu.upsert({
    where: { id: 47 },
    update: {
      name: '优惠券管理',
      path: '/coupons',
      icon: 'coupon',
      component: 'coupons/index',
      parentId: 40,
      order: 7,
      deletedAt: null,
      hidden: false,
      type: 'menu',
    },
    create: {
      id: 47,
      name: '优惠券管理',
      path: '/coupons',
      icon: 'coupon',
      component: 'coupons/index',
      parentId: 40,
      order: 7,
      type: 'menu',
    },
  });

  const balanceMenu = await prisma.menu.upsert({
    where: { id: 44 },
    update: {
      name: '余额管理',
      path: '/balances',
      icon: 'wallet',
      component: 'Layout',
      order: 6,
      deletedAt: null,
      hidden: false,
      type: 'menu',
    },
    create: {
      id: 44,
      name: '余额管理',
      path: '/balances',
      icon: 'wallet',
      component: 'Layout',
      order: 6,
      type: 'menu',
    },
  });

  await prisma.menu.upsert({
    where: { id: 45 },
    update: {
      name: '余额账户',
      path: '/balances/accounts',
      icon: 'wallet',
      component: 'balances/accounts',
      parentId: balanceMenu.id,
      order: 1,
      deletedAt: null,
      hidden: false,
      type: 'menu',
    },
    create: {
      id: 45,
      name: '余额账户',
      path: '/balances/accounts',
      icon: 'wallet',
      component: 'balances/accounts',
      parentId: balanceMenu.id,
      order: 1,
      type: 'menu',
    },
  });

  await prisma.menu.upsert({
    where: { id: 46 },
    update: {
      name: '余额流水',
      path: '/balances/logs',
      icon: 'wallet',
      component: 'balances/logs',
      parentId: balanceMenu.id,
      order: 2,
      deletedAt: null,
      hidden: false,
      type: 'menu',
    },
    create: {
      id: 46,
      name: '余额流水',
      path: '/balances/logs',
      icon: 'wallet',
      component: 'balances/logs',
      parentId: balanceMenu.id,
      order: 2,
      type: 'menu',
    },
  });

  // ==================== 5. 分配菜单给角色 ====================
  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      menus: {
        set: [
          { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }, // 系统管理
          { id: 10 }, { id: 11 }, { id: 12 }, { id: 13 },       // 基础数据
          { id: 14 }, { id: 15 }, { id: 16 },
          { id: 21 }, { id: 22 },                               // 进销存-商品档案/库存查询
          { id: 30 }, { id: 31 }, { id: 32 }, { id: 33 },       // 进销存-采购
          { id: 37 }, { id: 38 }, { id: 39 },                   // 进销存-库存管理（调拨、调整、流水）
          { id: 40 }, { id: 41 }, { id: 42 }, { id: 43 }, { id: 47 }, { id: 34 }, { id: 35 }, { id: 36 }, // 商城管理
          { id: 44 }, { id: 45 }, { id: 46 },                   // 余额管理
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

  const miniProgramAuthSetting = await prisma.systemSetting.findUnique({
    where: { key: 'mini-program.auth' },
  });

  if (!miniProgramAuthSetting) {
    await prisma.systemSetting.create({
      data: {
        key: 'mini-program.auth',
        category: 'mini-program',
        name: '小程序认证配置',
        description: '微信小程序服务端配置',
        value: {
          wechatAppId: process.env.WECHAT_APP_ID || '',
          wechatAppSecret: process.env.WECHAT_APP_SECRET || '',
        },
      },
    });
  }

  const wechatPaySetting = await prisma.systemSetting.findUnique({
    where: { key: 'wechat.pay' },
  });

  if (!wechatPaySetting) {
    await prisma.systemSetting.create({
      data: {
        key: 'wechat.pay',
        category: 'wechat',
        name: '微信支付配置',
        description: '微信支付商户参数配置',
        value: {
          mchId: '',
          mchSerialNo: '',
          apiV3Key: '',
          notifyUrl: '',
          privateKey: '',
          platformPublicKey: '',
          platformCertPath: '',
        },
      },
    });
  }

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
  const categoryContentMap = {
    ELEC: {
      subtitle: '数码潮品，随心选购',
      remark: '汇聚手机、电脑、智能配件等热门数码商品，适合商城首页重点展示。',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
    },
    PHONE: {
      subtitle: '热门机型，快速上新',
      remark: '覆盖主流品牌手机与配件，适合新品首发、爆款促销和日常零售场景。',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
    },
    COMPUTER: {
      subtitle: '办公娱乐，性能兼顾',
      remark: '包含笔记本、台式机及办公设备，适合企业采购与个人办公娱乐需求。',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80',
    },
    DAILY: {
      subtitle: '居家日常，一站备齐',
      remark: '涵盖清洁、收纳、个护等居家常用品，适合高频复购商品陈列。',
      image: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80',
    },
  } as const;

  const electronics = await prisma.category.upsert({
    where: { code: 'ELEC' },
    update: categoryContentMap.ELEC,
    create: {
      name: '电子产品',
      code: 'ELEC',
      ...categoryContentMap.ELEC,
      level: 1,
      sort: 1,
      isEnabled: true,
    },
  });

  const phone = await prisma.category.upsert({
    where: { code: 'PHONE' },
    update: {
      ...categoryContentMap.PHONE,
      parentId: electronics.id,
    },
    create: {
      name: '手机',
      code: 'PHONE',
      ...categoryContentMap.PHONE,
      parentId: electronics.id,
      level: 2,
      sort: 1,
      isEnabled: true,
    },
  });

  const computer = await prisma.category.upsert({
    where: { code: 'COMPUTER' },
    update: {
      ...categoryContentMap.COMPUTER,
      parentId: electronics.id,
    },
    create: {
      name: '电脑',
      code: 'COMPUTER',
      ...categoryContentMap.COMPUTER,
      parentId: electronics.id,
      level: 2,
      sort: 2,
      isEnabled: true,
    },
  });

  const daily = await prisma.category.upsert({
    where: { code: 'DAILY' },
    update: categoryContentMap.DAILY,
    create: {
      name: '日用百货',
      code: 'DAILY',
      ...categoryContentMap.DAILY,
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

  // ==================== 11. 小程序首页轮播图 ====================
  const homeBanners = [
    {
      title: 'Summer Sparkle',
      tag: 'New Arrival',
      subtitle: 'Up to 40% off on all rompers',
      image: 'https://images.unsplash.com/photo-1560506840-ec148e82a604?w=800&h=450&fit=crop',
      sort: 1,
      remark: '小程序首页轮播图',
      isEnabled: true,
      jumpEnabled: false,
      jumpPath: null,
    },
    {
      title: 'Organic Cotton',
      tag: 'Hot Sale',
      subtitle: 'Soft & safe for your baby',
      image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&h=450&fit=crop',
      sort: 2,
      remark: '小程序首页轮播图',
      isEnabled: true,
      jumpEnabled: false,
      jumpPath: null,
    },
    {
      title: 'Newborn Essentials',
      tag: 'Limited',
      subtitle: 'Everything you need',
      image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&h=450&fit=crop',
      sort: 3,
      remark: '小程序首页轮播图',
      isEnabled: true,
      jumpEnabled: false,
      jumpPath: null,
    },
  ];

  for (const banner of homeBanners) {
    const existingBanner = await prisma.banner.findFirst({
      where: {
        title: banner.title,
        deletedAt: null,
      },
    });

    if (existingBanner) {
      await prisma.banner.update({
        where: { id: existingBanner.id },
        data: banner,
      });
      continue;
    }

    await prisma.banner.create({
      data: banner,
    });
  }

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
  console.log('System Menus:', ['系统管理', '用户管理', '角色管理', '菜单管理', '系统设置']);
  console.log('-----------------------------------');
  console.log('Basic Data Menus:', ['基础数据', '计量单位', '商品分类', '品牌管理', '仓库管理', '供应商管理', '客户管理']);
  console.log('-----------------------------------');
  console.log('Product Menus:', ['进销存', '商品档案', '库存查询']);
  console.log('-----------------------------------');
  console.log('Inventory Menus:', ['库存调拨', '库存调整', '库存流水']);
  console.log('-----------------------------------');
  console.log('Balance Menus:', ['余额管理', '余额账户', '余额流水']);
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
  console.log('-----------------------------------');
  console.log('【可选】Home Banners:', homeBanners.map(item => item.title).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
