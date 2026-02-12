import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
      redirect: '/system/role',
      meta: { title: '系统管理' },
      children: [
        {
          path: 'role',
          name: 'role-list',
          component: () => import('@/views/roles/RoleList.vue'),
          meta: { title: '角色管理' }
        },
        {
          path: 'menu',
          name: 'menu-list',
          component: () => import('@/views/menus/MenuList.vue'),
          meta: { title: '菜单列表' }
        },
        {
          path: 'user',
          name: 'user-list',
          component: () => import('@/views/users/UserList.vue'),
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
          name: 'unit-list',
          component: () => import('@/views/units/UnitList.vue'),
          meta: { title: '计量单位' }
        },
        {
          path: 'categories',
          name: 'category-list',
          component: () => import('@/views/categories/CategoryList.vue'),
          meta: { title: '商品分类' }
        },
        {
          path: 'brands',
          name: 'brand-list',
          component: () => import('@/views/brands/BrandList.vue'),
          meta: { title: '品牌管理' }
        },
        {
          path: 'warehouses',
          name: 'warehouse-list',
          component: () => import('@/views/warehouses/WarehouseList.vue'),
          meta: { title: '仓库管理' }
        },
        {
          path: 'suppliers',
          name: 'supplier-list',
          component: () => import('@/views/suppliers/SupplierList.vue'),
          meta: { title: '供应商管理' }
        },
        {
          path: 'customers',
          name: 'customer-list',
          component: () => import('@/views/customers/CustomerList.vue'),
          meta: { title: '客户管理' }
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
