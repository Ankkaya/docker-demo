/// <reference types="@uni-helper/vite-plugin-uni-pages/client" />
import { pages, subPackages } from 'virtual:uni-pages'
import { TABBAR_ROUTE_NAMES } from '@/composables/useTabbar'
import { useUserStore } from '@/store/userStore'

function generateRoutes() {
  const routes = pages.map((page) => {
    const newPath = `/${page.path}`
    return { ...page, path: newPath }
  })
  if (subPackages && subPackages.length > 0) {
    subPackages.forEach((subPackage) => {
      const subRoutes = subPackage.pages.map((page: any) => {
        const newPath = `/${subPackage.root}/${page.path}`
        return { ...page, path: newPath }
      })
      routes.push(...subRoutes)
    })
  }
  return routes
}

const router = createRouter({
  routes: generateRoutes(),
})
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const { setTabbarItemActive } = useTabbar()
  const requiresAuth = Boolean((to as any).meta?.auth)

  if (requiresAuth && !userStore.isLoggedIn) {
    userStore.openAuthPopup({
      name: to.name ? String(to.name) : undefined,
      path: to.path,
      query: CommonUtil.isObj((to as any).query) ? { ...(to as any).query } : undefined,
      isTabbar: to.name ? TABBAR_ROUTE_NAMES.includes(String(to.name) as any) : false,
    })

    if (from?.name && TABBAR_ROUTE_NAMES.includes(String(from.name) as any)) {
      setTabbarItemActive(String(from.name))
    }

    next(false)
    return
  }

  next()
})

router.afterEach((to, from) => {
  if (to.path && from.path && import.meta.env.DEV) {
    console.log(`📄 页面切换完成: ${from.path} -> ${to.path}`)
  }
})

export default router
