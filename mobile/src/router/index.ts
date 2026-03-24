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

function isNavigationCancelled(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const routeError = error as { name?: string, message?: string }
  return routeError.name === 'NavigationCancelled' || routeError.message === 'NavigationCancelled'
}

const router = createRouter({
  routes: generateRoutes(),
})

const rawPush = router.push.bind(router)
router.push = async (to) => {
  try {
    return await rawPush(to)
  }
  catch (error) {
    if (isNavigationCancelled(error)) {
      return error
    }
    throw error
  }
}

const rawReplace = router.replace.bind(router)
router.replace = async (to) => {
  try {
    return await rawReplace(to)
  }
  catch (error) {
    if (isNavigationCancelled(error)) {
      return error
    }
    throw error
  }
}

const rawReplaceAll = router.replaceAll.bind(router)
router.replaceAll = async (to) => {
  try {
    return await rawReplaceAll(to)
  }
  catch (error) {
    if (isNavigationCancelled(error)) {
      return error
    }
    throw error
  }
}

const rawPushTab = router.pushTab.bind(router)
router.pushTab = async (to) => {
  try {
    return await rawPushTab(to)
  }
  catch (error) {
    if (isNavigationCancelled(error)) {
      return error
    }
    throw error
  }
}

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const { setTabbarItemActive } = useTabbar()
  const requiresAuth = Boolean((to as any).needLogin)

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
