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
      path: '/users',
      component: () => import('@/views/layout/index.vue'),
      redirect: '/users/list',
      meta: { title: '用户管理' },
      children: [
        {
          path: 'list',
          name: 'user-list',
          component: () => import('@/views/users/UserList.vue'),
          meta: { title: '用户列表' }
        }
      ]
    },
    {
      path: '/menus',
      component: () => import('@/views/layout/index.vue'),
      redirect: '/menus/list',
      meta: { title: '菜单管理' },
      children: [
        {
          path: 'list',
          name: 'menu-list',
          component: () => import('@/views/menus/MenuList.vue'),
          meta: { title: '菜单列表' }
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
