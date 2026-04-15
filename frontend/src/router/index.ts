import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/index.vue'),
      meta: { public: true }
    },
    {
      path: '/',
      component: () => import('@/views/layout/index.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/layout/components/Dashboard.vue'),
          meta: { title: '首页' }
        }
      ]
    },
    {
      path: '/system',
      component: () => import('@/views/layout/index.vue'),
      redirect: '/system/roles',
      meta: { title: '系统管理' },
      children: [
        {
          path: 'roles',
          name: 'system-roles',
          component: () => import('@/views/roles/index.vue'),
          meta: { title: '角色管理' }
        },
        {
          path: 'menus',
          name: 'system-menus',
          component: () => import('@/views/menus/index.vue'),
          meta: { title: '菜单列表' }
        },
        {
          path: 'users',
          name: 'system-users',
          component: () => import('@/views/users/index.vue'),
          meta: { title: '用户列表' }
        },
        {
          path: 'print-templates',
          name: 'system-print-templates',
          component: () => import('@/views/print-templates/index.vue'),
          meta: { title: '打印模板' }
        },
        {
          path: 'printers',
          name: 'system-printers',
          component: () => import('@/views/printers/index.vue'),
          meta: { title: '打印机管理' }
        },
        {
          path: 'printer-configs',
          name: 'system-printer-configs',
          component: () => import('@/views/printer-configs/index.vue'),
          meta: { title: '打印机配置' }
        },
        {
          path: 'settings',
          name: 'system-settings',
          component: () => import('@/views/system-settings/index.vue'),
          meta: { title: '系统设置' }
        }
      ]
    },
    // ==================== 基础数据模块 ====================
    {
      path: '/basic',
      component: () => import('@/views/layout/index.vue'),
      redirect: '/basic/units',
      meta: { title: '基础数据' },
      children: [
        {
          path: 'units',
          name: 'basic-units',
          component: () => import('@/views/units/index.vue'),
          meta: { title: '计量单位' }
        },
        {
          path: 'categories',
          name: 'basic-categories',
          component: () => import('@/views/categories/index.vue'),
          meta: { title: '商品分类' }
        },
        {
          path: 'brands',
          name: 'basic-brands',
          component: () => import('@/views/brands/index.vue'),
          meta: { title: '品牌管理' }
        },
        {
          path: 'warehouses',
          name: 'basic-warehouses',
          component: () => import('@/views/warehouses/index.vue'),
          meta: { title: '仓库管理' }
        },
        {
          path: 'suppliers',
          name: 'basic-suppliers',
          component: () => import('@/views/suppliers/index.vue'),
          meta: { title: '供应商管理' }
        },
        {
          path: 'customers',
          name: 'basic-customers',
          component: () => import('@/views/customers/index.vue'),
          meta: { title: '客户管理' }
        }
      ]
    },
    // ==================== 商品档案模块 ====================
    {
      path: '/products',
      component: () => import('@/views/layout/index.vue'),
      redirect: '/products/list',
      meta: { title: '商品档案' },
      children: [
        {
          path: 'list',
          name: 'product-list',
          component: () => import('@/views/products/index.vue'),
          meta: { title: '商品档案' }
        },
        {
          path: 'create',
          name: 'product-create',
          component: () => import('@/views/products/edit.vue'),
          meta: { title: '新增商品' }
        },
        {
          path: 'edit/:id',
          name: 'product-edit',
          component: () => import('@/views/products/edit.vue'),
          meta: { title: '编辑商品' }
        },
        {
          path: 'mall-edit/:id',
          name: 'product-mall-edit',
          component: () => import('@/views/products/mall-edit.vue'),
          meta: { title: '商城信息' }
        }
      ]
    },
    {
      path: '/inventories',
      component: () => import('@/views/layout/index.vue'),
      meta: { title: '库存查询' },
      children: [
        {
          path: '',
          name: 'basic-inventories',
          component: () => import('@/views/inventories/index.vue'),
          meta: { title: '库存查询' }
        }
      ]
    },
    {
      path: '/transfers',
      component: () => import('@/views/layout/index.vue'),
      meta: { title: '库存调拨' },
      children: [
        {
          path: '',
          name: 'inventory-transfer',
          component: () => import('@/views/transfers/index.vue'),
          meta: { title: '库存调拨' }
        }
      ]
    },
    {
      path: '/adjustments',
      component: () => import('@/views/layout/index.vue'),
      meta: { title: '库存调整' },
      children: [
        {
          path: '',
          name: 'inventory-adjustment',
          component: () => import('@/views/adjustments/index.vue'),
          meta: { title: '库存调整' }
        }
      ]
    },
    {
      path: '/inventory-logs',
      component: () => import('@/views/layout/index.vue'),
      meta: { title: '库存流水' },
      children: [
        {
          path: '',
          name: 'inventory-logs',
          component: () => import('@/views/inventory-logs/index.vue'),
          meta: { title: '库存流水' }
        }
      ]
    },
    // ==================== 进销存模块 ====================
    {
      path: '/purchases',
      component: () => import('@/views/layout/index.vue'),
      meta: { title: '采购订单' },
      children: [
        {
          path: '',
          name: 'purchase-list',
          component: () => import('@/views/purchases/index.vue'),
          meta: { title: '采购订单' }
        }
      ]
    },
    {
      path: '/purchase-receipts',
      component: () => import('@/views/layout/index.vue'),
      meta: { title: '采购入库' },
      children: [
        {
          path: '',
          name: 'purchase-receipt-list',
          component: () => import('@/views/purchase-receipts/index.vue'),
          meta: { title: '采购入库' }
        }
      ]
    },
    {
      path: '/purchase-returns',
      component: () => import('@/views/layout/index.vue'),
      meta: { title: '采购退货' },
      children: [
        {
          path: '',
          name: 'purchase-return-list',
          component: () => import('@/views/purchase-returns/index.vue'),
          meta: { title: '采购退货' }
        }
      ]
    },
    {
      path: '/orders',
      component: () => import('@/views/layout/index.vue'),
      meta: { title: '销售订单' },
      children: [
        {
          path: '',
          name: 'order-list',
          component: () => import('@/views/orders/index.vue'),
          meta: { title: '销售订单' }
        }
      ]
    },
    {
      path: '/shipments',
      component: () => import('@/views/layout/index.vue'),
      meta: { title: '发货管理' },
      children: [
        {
          path: '',
          name: 'shipment-list',
          component: () => import('@/views/shipments/index.vue'),
          meta: { title: '发货管理' }
        }
      ]
    },
    {
      path: '/sale-returns',
      component: () => import('@/views/layout/index.vue'),
      meta: { title: '销售退货' },
      children: [
        {
          path: '',
          name: 'sale-return-list',
          component: () => import('@/views/sale-returns/index.vue'),
          meta: { title: '销售退货' }
        }
      ]
    },
    // ==================== 商城管理模块 ====================
    {
      path: '/carts',
      component: () => import('@/views/layout/index.vue'),
      meta: { title: '购物车管理' },
      children: [
        {
          path: '',
          name: 'cart-list',
          component: () => import('@/views/carts/index.vue'),
          meta: { title: '购物车管理' }
        }
      ]
    },
    {
      path: '/payments',
      component: () => import('@/views/layout/index.vue'),
      meta: { title: '收款记录' },
      children: [
        {
          path: '',
          name: 'payment-list',
          component: () => import('@/views/payments/index.vue'),
          meta: { title: '收款记录' }
        }
      ]
    },
    {
      path: '/mall-products',
      component: () => import('@/views/layout/index.vue'),
      meta: { title: '商城商品' },
      children: [
        {
          path: '',
          name: 'mall-product-list',
          component: () => import('@/views/mall-products/index.vue'),
          meta: { title: '商城商品' }
        }
      ]
    },
    {
      path: '/banners',
      component: () => import('@/views/layout/index.vue'),
      meta: { title: '轮播图管理' },
      children: [
        {
          path: '',
          name: 'banner-list',
          component: () => import('@/views/banners/index.vue'),
          meta: { title: '轮播图管理' }
        }
      ]
    },
    {
      path: '/coupons',
      component: () => import('@/views/layout/index.vue'),
      meta: { title: '优惠券管理' },
      children: [
        {
          path: '',
          name: 'coupon-list',
          component: () => import('@/views/coupons/index.vue'),
          meta: { title: '优惠券管理' }
        }
      ]
    },
    {
      path: '/balances',
      component: () => import('@/views/layout/index.vue'),
      redirect: '/balances/accounts',
      meta: { title: '余额管理' },
      children: [
        {
          path: 'accounts',
          name: 'balance-accounts',
          component: () => import('@/views/balances/accounts.vue'),
          meta: { title: '余额账户' }
        },
        {
          path: 'logs',
          name: 'balance-logs',
          component: () => import('@/views/balances/logs.vue'),
          meta: { title: '余额流水' }
        },
        {
          path: 'recharges',
          name: 'balance-recharges',
          component: () => import('@/views/balances/recharges.vue'),
          meta: { title: '余额充值单' }
        }
      ]
    },
    {
      path: '/redirect',
      component: () => import('@/views/layout/index.vue'),
      meta: { hidden: true },
      children: [
        {
          path: '',
          component: () => import('@/views/layout/components/Redirect.vue'),
          meta: { hidden: true }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard'
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.public) {
    next()
    return
  }

  if (!authStore.isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (!authStore.user) {
    try {
      await authStore.init()
    } catch (error) {
      next({ name: 'login' })
      return
    }
  }

  next()
})

export default router
