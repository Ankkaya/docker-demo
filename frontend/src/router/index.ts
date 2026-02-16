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
    // ==================== 商品管理模块 ====================
    {
      path: '/products',
      component: () => import('@/views/layout/index.vue'),
      redirect: '/products/list',
      meta: { title: '商品管理' },
      children: [
        {
          path: 'list',
          name: 'product-list',
          component: () => import('@/views/products/index.vue'),
          meta: { title: '商品列表' }
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
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard'
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  void from
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
