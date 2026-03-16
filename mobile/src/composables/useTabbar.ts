export interface TabbarItem {
  name: string
  value: number | null
  active: boolean
  title: string
  icon?: string
  iconUrl?: string | null
}

export const TABBAR_ROUTE_NAMES = ['home', 'category', 'cart', 'user'] as const

const tabbarItems = ref<TabbarItem[]>([
  { name: 'home', value: null, active: false, title: '首页', icon: 'i-material-symbols:house' },
  { name: 'category', value: null, active: false, title: '分类', icon: 'i-material-symbols:category-rounded' },
  { name: 'cart', value: null, active: false, title: '购物车', icon: 'i-material-symbols:shopping-cart' },
  { name: 'user', value: null, active: false, title: '我的', icon: 'i-material-symbols:account-circle' },
])

export function useTabbar() {
  const tabbarList = computed(() => tabbarItems.value)

  const activeTabbar = computed(() => {
    const item = tabbarItems.value.find(item => item.active)
    return item || tabbarItems.value[0]
  })

  const getTabbarItemValue = (name: string) => {
    const item = tabbarItems.value.find(item => item.name === name)
    return item && item.value ? item.value : null
  }

  const setTabbarItem = (name: string, value: number) => {
    const tabbarItem = tabbarItems.value.find(item => item.name === name)
    if (tabbarItem) {
      tabbarItem.value = value
    }
  }

  const setTabbarItemActive = (name: string) => {
    tabbarItems.value.forEach((item) => {
      if (item.name === name) {
        item.active = true
      }
      else {
        item.active = false
      }
    })
  }

  return {
    tabbarList,
    activeTabbar,
    getTabbarItemValue,
    setTabbarItem,
    setTabbarItemActive,
  }
}
