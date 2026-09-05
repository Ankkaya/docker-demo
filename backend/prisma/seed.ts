import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import '../load-env';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const mallHotSearchKeywordModel = (prisma as any).mallHotSearchKeyword;

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

  // ==================== 2. 创建菜单（数据驱动）====================
  // 顶层分组：基础数据(10) → 商品中心(60) → 采购管理(61) → 销售管理(62) →
  //          库存管理(30) → 商城运营(40) → 财务中心(63) → 打印中心(64) → 系统管理(1)
  // 父菜单先于子菜单声明，避免外键失败。
  type MenuSeed = {
    id: number;
    name: string;
    path?: string | null;
    icon?: string;
    component?: string;
    permission?: string;
    redirect?: string | null;
    parentId?: number | null;
    order: number;
    type?: 'menu' | 'button' | 'iframe';
    hidden?: boolean;
    alwaysShow?: boolean;
  };

  const menuSeeds: MenuSeed[] = [
    // 1. 基础数据
    { id: 10, name: '基础数据', path: '/basic', icon: 'database', component: 'Layout', order: 1 },
    { id: 11, name: '计量单位', path: '/basic/units', icon: 'measurement', component: 'basic/unit/index', parentId: 10, order: 1 },
    { id: 12, name: '商品分类', path: '/basic/categories', icon: 'category', component: 'basic/category/index', parentId: 10, order: 2 },
    { id: 13, name: '品牌管理', path: '/basic/brands', icon: 'brand', component: 'basic/brand/index', parentId: 10, order: 3 },
    { id: 14, name: '仓库管理', path: '/basic/warehouses', icon: 'warehouse', component: 'basic/warehouse/index', parentId: 10, order: 4 },
    { id: 15, name: '供应商管理', path: '/basic/suppliers', icon: 'supplier', component: 'basic/supplier/index', parentId: 10, order: 5, hidden: true },
    { id: 16, name: '客户管理', path: '/basic/customers', icon: 'customer', component: 'basic/customer/index', parentId: 10, order: 6 },

    // 2. 商品中心
    { id: 60, name: '商品中心', path: '/product-center', icon: 'shopping', component: 'Layout', order: 2 },
    { id: 21, name: '商品资料', path: '/products/list', icon: 'goods', component: 'products/index', parentId: 60, order: 1 },
    { id: 42, name: '商城上架', path: '/mall-products', icon: 'storefront', component: 'mall-products/index', parentId: 60, order: 2 },
    { id: 49, name: '评价管理', path: '/reviews', icon: 'material-symbols:rate-review-outline', component: 'reviews/index', parentId: 60, order: 3 },

    // 3. 采购管理
    { id: 61, name: '采购管理', path: '/purchase-mgmt', icon: 'inbound', component: 'Layout', order: 3, hidden: true },
    { id: 31, name: '采购订单', path: '/purchases', icon: 'order', component: 'purchases/index', parentId: 61, order: 1, hidden: true },
    { id: 32, name: '采购入库', path: '/purchase-receipts', icon: 'inbound', component: 'purchase-receipts/index', parentId: 61, order: 2, hidden: true },
    { id: 33, name: '采购退货', path: '/purchase-returns', icon: 'return', component: 'purchase-returns/index', parentId: 61, order: 3, hidden: true },

    // 4. 销售管理
    { id: 62, name: '销售管理', path: '/sale-mgmt', icon: 'shipment', component: 'Layout', order: 4 },
    { id: 34, name: '销售订单', path: '/orders', icon: 'order', component: 'orders/index', parentId: 62, order: 1, hidden: true },
    { id: 35, name: '发货管理', path: '/shipments', icon: 'shipment', component: 'shipments/index', parentId: 62, order: 2 },
    { id: 36, name: '销售退货', path: '/sale-returns', icon: 'return', component: 'sale-returns/index', parentId: 62, order: 3 },
    { id: 41, name: '购物车管理', path: '/carts', icon: 'cart', component: 'carts/index', parentId: 40, order: 6 },

    // 5. 库存管理（复用 id=30，原"进销存"）
    { id: 30, name: '库存管理', path: '/inventory-mgmt', icon: 'inventory-2', component: 'Layout', order: 5 },
    { id: 22, name: '库存查询', path: '/inventories', icon: 'inventory', component: 'inventories/index', parentId: 30, order: 1 },
    { id: 37, name: '库存调拨', path: '/transfers', icon: 'transfer', component: 'transfers/index', parentId: 30, order: 2, hidden: true },
    { id: 38, name: '库存调整', path: '/adjustments', icon: 'adjust', component: 'adjustments/index', parentId: 30, order: 3, hidden: true },
    { id: 39, name: '库存流水', path: '/inventory-logs', icon: 'log', component: 'inventory-logs/index', parentId: 30, order: 4, hidden: true },

    // 6. 商城中心：只承载 C 端运营与交易，进销存能力保持在独立菜单中
    { id: 40, name: '商城中心', path: '/mall', icon: 'shopping-cart', component: 'Layout', order: 6 },
    { id: 65, name: '商城订单', path: '/mall/orders', icon: 'order', component: 'orders/index', parentId: 40, order: 1 },
    { id: 43, name: '轮播图管理', path: '/banners', icon: 'slideshow', component: 'banners/index', parentId: 40, order: 2 },
    { id: 47, name: '优惠券管理', path: '/coupons', icon: 'coupon', component: 'coupons/index', parentId: 40, order: 3 },
    { id: 54, name: '充值套餐', path: '/mall-recharge-packages', icon: 'material-symbols:redeem', component: 'mall-recharge-packages/index', parentId: 40, order: 4 },
    { id: 55, name: '充值活动', path: '/mall-recharge-activities', icon: 'coupon', component: 'mall-recharge-activities/index', parentId: 40, order: 5 },
    { id: 48, name: '热搜词', path: '/mall-config', icon: 'search', component: 'mall-config/index', parentId: 40, order: 6 },

    // 7. 财务中心（合并原"支付中心 50" + "余额管理 44"）
    { id: 63, name: '财务中心', path: '/finance', icon: 'material-symbols:payments-outline', component: 'Layout', order: 7, alwaysShow: true },
    { id: 51, name: '支付记录', path: '/payments', icon: 'material-symbols:receipt-long-outline', component: 'payments/index', parentId: 63, order: 1 },
    { id: 52, name: '退款记录', path: '/payment-refunds', icon: 'return', component: 'payment-refunds/index', parentId: 63, order: 2 },
    { id: 45, name: '余额账户', path: '/balances/accounts', icon: 'wallet', component: 'balances/accounts', parentId: 63, order: 3 },
    { id: 46, name: '余额流水', path: '/balances/logs', icon: 'wallet', component: 'balances/logs', parentId: 63, order: 4 },
    { id: 53, name: '充值记录', path: '/balances/recharges', icon: 'material-symbols:account-balance-wallet-outline', component: 'balances/recharges', parentId: 63, order: 5 },

    // 8. 打印中心（从"系统管理"中拆出）
    { id: 64, name: '打印中心', path: '/print-center', icon: 'print-template', component: 'Layout', order: 8, hidden: true },
    { id: 5, name: '打印模板', path: '/system/print-templates', icon: 'print-template', component: 'print-templates/index', parentId: 64, order: 1, hidden: true },
    { id: 6, name: '打印机管理', path: '/system/printers', icon: 'printer', component: 'printers/index', parentId: 64, order: 2, hidden: true },
    { id: 7, name: '打印机配置', path: '/system/printer-configs', icon: 'printer-config', component: 'printer-configs/index', parentId: 64, order: 3, hidden: true },

    // 9. 系统管理
    { id: 1, name: '系统管理', path: '/system', icon: 'setting', component: 'Layout', order: 9 },
    { id: 2, name: '用户管理', path: '/system/users', icon: 'user', component: 'system/user/index', parentId: 1, order: 1 },
    { id: 3, name: '角色管理', path: '/system/roles', icon: 'peoples', component: 'system/role/index', parentId: 1, order: 2 },
    { id: 4, name: '菜单管理', path: '/system/menus', icon: 'menu', component: 'system/menu/index', parentId: 1, order: 3 },
    { id: 8, name: '系统设置', path: '/system/settings', icon: 'setting', component: 'system-settings/index', parentId: 1, order: 4 },
    { id: 9, name: '系统日志', path: '/system/system-logs', icon: 'log', component: 'system-logs/index', parentId: 1, order: 5 },
    { id: 59, name: '上传记录', path: '/system/upload-records', icon: 'upload', component: 'upload-records/index', parentId: 1, order: 6 },

    // 按钮权限：菜单树中可分配，侧边栏不会展示 button 类型节点
    { id: 101, name: '新增商品', parentId: 21, order: 10, type: 'button', permission: 'product:spu:create' },
    { id: 102, name: '编辑商品', parentId: 21, order: 11, type: 'button', permission: 'product:spu:update' },
    { id: 103, name: '删除商品', parentId: 21, order: 12, type: 'button', permission: 'product:spu:delete' },
    { id: 104, name: '编辑商城信息', parentId: 42, order: 10, type: 'button', permission: 'product:spu:update' },
    { id: 105, name: '审核评价', parentId: 49, order: 10, type: 'button', permission: 'product:comment:audit' },
    { id: 106, name: '回复评价', parentId: 49, order: 11, type: 'button', permission: 'product:comment:reply' },
    { id: 107, name: '删除评价', parentId: 49, order: 12, type: 'button', permission: 'product:comment:delete' },
    { id: 111, name: '新增销售订单', parentId: 34, order: 10, type: 'button', permission: 'sale:order:create' },
    { id: 112, name: '编辑销售订单', parentId: 34, order: 11, type: 'button', permission: 'sale:order:update' },
    { id: 113, name: '确认销售订单', parentId: 34, order: 12, type: 'button', permission: 'sale:order:confirm' },
    { id: 114, name: '取消销售订单', parentId: 34, order: 13, type: 'button', permission: 'sale:order:cancel' },
    { id: 115, name: '删除销售订单', parentId: 34, order: 14, type: 'button', permission: 'sale:order:delete' },
    { id: 121, name: '创建发货单', parentId: 35, order: 10, type: 'button', permission: 'trade:shipment:create' },
    { id: 122, name: '确认发货', parentId: 35, order: 11, type: 'button', permission: 'trade:shipment:ship' },
    { id: 123, name: '确认收货', parentId: 35, order: 12, type: 'button', permission: 'trade:shipment:receive' },
    { id: 124, name: '删除发货单', parentId: 35, order: 13, type: 'button', permission: 'trade:shipment:delete' },
    { id: 131, name: '新增优惠券', parentId: 47, order: 10, type: 'button', permission: 'promotion:coupon:create' },
    { id: 132, name: '编辑优惠券', parentId: 47, order: 11, type: 'button', permission: 'promotion:coupon:update' },
    { id: 133, name: '发放优惠券', parentId: 47, order: 12, type: 'button', permission: 'promotion:coupon:send' },
    { id: 134, name: '生成兑换码', parentId: 47, order: 13, type: 'button', permission: 'promotion:coupon:exchange-code' },
    { id: 135, name: '删除优惠券', parentId: 47, order: 14, type: 'button', permission: 'promotion:coupon:delete' },
    { id: 141, name: '开通余额账户', parentId: 45, order: 10, type: 'button', permission: 'member:balance:create' },
    { id: 142, name: '余额调账', parentId: 45, order: 11, type: 'button', permission: 'member:balance:adjust' },
    { id: 151, name: '发起退款', parentId: 52, order: 10, type: 'button', permission: 'finance:refund:create' },
    { id: 152, name: '确认收付款', parentId: 51, order: 10, type: 'button', permission: 'finance:payment:confirm' },
  ];

  // 第一遍：先 upsert 所有顶层节点（parentId 为空），再 upsert 子节点，避免 FK 顺序问题
  const sortedSeeds = [...menuSeeds].sort((a, b) => {
    const ap = a.parentId ?? 0;
    const bp = b.parentId ?? 0;
    return ap - bp;
  });

  for (const m of sortedSeeds) {
    const data = {
      name: m.name,
      path: m.path ?? null,
      icon: m.icon ?? null,
      component: m.component ?? null,
      permission: m.permission ?? null,
      redirect: m.redirect ?? null,
      parentId: m.parentId ?? null,
      order: m.order,
      hidden: m.hidden ?? false,
      alwaysShow: m.alwaysShow ?? false,
      type: (m.type ?? 'menu') as any,
      deletedAt: null,
    };
    await prisma.menu.upsert({
      where: { id: m.id },
      update: data,
      create: { id: m.id, ...data },
    });
  }

  // 硬删除已废弃的旧菜单：商品管理(20) / 余额管理(44) / 支付中心(50)
  // 它们的子菜单已在上面的 upsert 中迁移到新父分组
  const obsoleteMenuIds = [20, 44, 50];

  // 防御性：把任何仍以这些 ID 为父的菜单（例如运营手动新增的自定义节点）置为顶层，避免外键失败
  await prisma.menu.updateMany({
    where: { parentId: { in: obsoleteMenuIds } },
    data: { parentId: null },
  });

  // 解绑角色-菜单关联（M2M 的 set:[] 会清掉中间表行）
  for (const id of obsoleteMenuIds) {
    await prisma.menu
      .update({ where: { id }, data: { roles: { set: [] } } })
      .catch(() => undefined); // 不存在则忽略
  }

  // 硬删除（已无 FK 引用 + 已无角色绑定）
  await prisma.menu.deleteMany({
    where: { id: { in: obsoleteMenuIds } },
  });

  // ==================== 3. 分配菜单给角色 ====================
  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      menus: {
        set: menuSeeds.map((m) => ({ id: m.id })),
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

  const defaultHotKeywords = [
    { keyword: '夏季新品', sort: 1 },
    { keyword: '婴儿连体衣', sort: 2 },
    { keyword: '纯棉套装', sort: 3 },
    { keyword: '宝宝裙装', sort: 4 },
    { keyword: '口水巾', sort: 5 },
    { keyword: '新生儿礼盒', sort: 6 },
  ];

  for (const item of defaultHotKeywords) {
    await mallHotSearchKeywordModel.upsert({
      where: { keyword: item.keyword },
      update: {
        sort: item.sort,
        isEnabled: true,
        deletedAt: null,
      },
      create: {
        keyword: item.keyword,
        sort: item.sort,
        isEnabled: true,
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
  console.log('基础数据:', ['计量单位', '商品分类', '品牌管理', '仓库管理', '供应商管理', '客户管理']);
  console.log('-----------------------------------');
  console.log('商品中心:', ['商品资料', '商城上架', '评价管理']);
  console.log('-----------------------------------');
  console.log('采购管理:', ['采购订单', '采购入库', '采购退货']);
  console.log('-----------------------------------');
  console.log('销售管理:', ['销售订单', '发货管理', '销售退货']);
  console.log('-----------------------------------');
  console.log('库存管理:', ['库存查询', '库存调拨', '库存调整', '库存流水']);
  console.log('-----------------------------------');
  console.log('商城中心:', ['商城订单', '轮播图管理', '优惠券管理', '充值套餐', '充值活动', '热搜词', '购物车管理']);
  console.log('-----------------------------------');
  console.log('财务中心:', ['支付记录', '退款记录', '余额账户', '余额流水', '充值记录']);
  console.log('-----------------------------------');
  console.log('打印中心:', ['打印模板', '打印机管理', '打印机配置']);
  console.log('-----------------------------------');
  console.log('系统管理:', ['用户管理', '角色管理', '菜单管理', '系统设置', '系统日志', '上传记录']);
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
