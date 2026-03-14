<template>
  <div class="h-screen flex flex-col overflow-hidden bg-layout transition-theme">
    <!-- 顶部导航 -->
    <header class="bg-container shadow-header h-16 flex items-center justify-between px-6 z-10 transition-theme">
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-bold text-base-text">Docker Demo Admin</h1>
      </div>
      <div class="flex items-center gap-4">
        <!-- 主题切换按钮 -->
        <ThemeSchemaSwitch :theme-scheme="themeStore.themeScheme" @switch="themeStore.toggleThemeScheme" />

        <n-dropdown trigger="click" :options="dropdownOptions" @select="handleSelect">
          <div class="flex items-center gap-2 cursor-pointer">
            <n-avatar :size="32">
              <template #icon>
                <n-icon><person-outline /></n-icon>
              </template>
            </n-avatar>
            <span class="text-base-text">{{ user?.name || user?.username }}</span>
            <n-icon><chevron-down-outline /></n-icon>
          </div>
        </n-dropdown>
      </div>
    </header>

    <!-- 主体区域 -->
    <div class="flex-1 flex min-h-0 overflow-hidden">
      <!-- 左侧菜单 -->
      <aside
        class="layout-scrollbar w-64 shrink-0 overflow-y-auto bg-container border-r border-gray-200 dark:border-gray-700 shadow-sider transition-theme">
        <div class="min-h-full py-3">
          <n-menu :value="activeMenu" :options="menuOptions" @update:value="handleMenuSelect" />
        </div>
      </aside>

      <!-- 右侧内容 -->
      <main class="flex-1 flex min-h-0 flex-col overflow-hidden bg-layout transition-theme">
        <!-- 选项卡栏 -->
        <TabBar />

        <!-- 页面内容 -->
        <div class="layout-scrollbar flex-1 overflow-y-auto">
          <router-view v-slot="{ Component, route }">
            <keep-alive :include="cachedViews">
              <component :is="Component" :key="route.fullPath" />
            </keep-alive>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store'
import { useThemeStore } from '@/store/modules/theme'
import {
  PersonOutline,
  ChevronDownOutline,
  HomeOutline,
  MenuOutline,
  SettingsOutline,
  PeopleOutline,
  CubeOutline,
  ScaleOutline,
  GridOutline,
  RibbonOutline,
  BusinessOutline,
  BriefcaseOutline,
  PeopleCircleOutline,
  BagOutline,
  BagCheckOutline,
  BarcodeOutline,
  AppsOutline,
  LayersOutline,
  // 进销存模块图标
  CartOutline,          // 采购订单
  DownloadOutline,      // 采购入库
  ReturnUpBackOutline,  // 采购退货
  DocumentTextOutline,  // 进销存父菜单
  // 库存管理模块图标
  RepeatOutline,        // 调拨
  OptionsOutline,       // 调整
  TimeOutline,          // 流水
  PrintOutline          // 打印
} from '@vicons/ionicons5'
import { NIcon, useMessage } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import AppIcon from '@/components/common/AppIcon.vue'
import ThemeSchemaSwitch from '@/components/common/ThemeSchemaSwitch.vue'
import TabBar from '@/components/TabBar/index.vue'
import { useTabStore } from '@/store/modules/tab'
import type { Menu } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const tabStore = useTabStore()
const message = useMessage()

// 页面缓存列表
const cachedViews = computed(() => tabStore.cachedViews)

// 监听路由变化，添加标签
watch(
  () => route.fullPath,
  () => {
    tabStore.addTab(route)
  },
  { immediate: true }
)

const user = computed(() => authStore.user)
const activeMenu = computed(() => route.path)

// 图标映射
const iconMap: Record<string, any> = {
  'home': HomeOutline,
  'setting': SettingsOutline,
  'user': PersonOutline,
  'peoples': PeopleOutline,
  'menu': MenuOutline,
  'database': CubeOutline,
  'measurement': ScaleOutline,
  'category': GridOutline,
  'brand': RibbonOutline,
  'warehouse': BusinessOutline,
  'supplier': BriefcaseOutline,
  'customer': PeopleCircleOutline,
  // 商品管理模块图标
  'shopping': BagOutline,           // 购物袋 - 商品管理主菜单
  'goods': BagCheckOutline,         // 带勾选购物袋 - 商品列表
  'inventory': LayersOutline,       // 层叠 - 库存查询
  'sku': BarcodeOutline,            // 条形码 - SKU管理
  'product': AppsOutline,           // 应用网格 - 商品分类
  // 进销存模块图标
  'purchase': DocumentTextOutline,  // 进销存父菜单
  'inventory-2': LayersOutline,     // 进销存主菜单（使用与库存相同的图标）
  'order': CartOutline,             // 购物车 - 采购订单
  'inbound': DownloadOutline,       // 下载 - 采购入库
  'return': ReturnUpBackOutline,    // 返回 - 采购退货
  // 库存管理模块图标
  'transfer': RepeatOutline,        // 循环 - 调拨
  'adjust': OptionsOutline,         // 选项 - 调整
  'log': TimeOutline,               // 时间 - 流水
  'print-template': PrintOutline,   // 打印模板
  'printer': PrintOutline,          // 打印机
  'printer-config': SettingsOutline // 打印机配置
}

// 图标渲染函数
const renderIcon = (menu?: Pick<Menu, 'icon' | 'iconUrl'>) => {
  if (menu?.iconUrl) {
    return () => h(AppIcon, { iconUrl: menu.iconUrl, size: 18, alt: menu.icon })
  }
  if (!menu?.icon) return undefined
  const icon = iconMap[menu.icon] || MenuOutline
  return () => h(NIcon, null, { default: () => h(icon) })
}

// 将后端菜单转换为 Naive UI 菜单选项
const mapMenuToOption = (menu: Menu): MenuOption => {
  return {
    label: menu.name,
    key: menu.path || String(menu.id),
    icon: renderIcon(menu),
    children: menu.children?.map(mapMenuToOption)
  }
}

// 动态菜单选项
const menuOptions = computed<MenuOption[]>(() => {
  const dashboardOption: MenuOption = {
    label: '首页',
    key: '/dashboard',
    icon: renderIcon({ icon: 'home' })
  }

  console.log('Raw menus from store:', authStore.menus)

  const dynamicOptions = authStore.menus
    .filter(menu => !menu.hidden)
    .map(mapMenuToOption)

  console.log('Processed menu options:', dynamicOptions)

  return [dashboardOption, ...dynamicOptions]
})

// 下拉选项
const dropdownOptions = [
  { label: '个人信息', key: 'profile' },
  { label: '退出登录', key: 'logout' }
]

const handleMenuSelect = (key: string, item: MenuOption) => {
  console.log('Menu clicked:', key, 'Item:', item)
  if (!key) {
    console.warn('Menu key is empty')
    return
  }
  // 检查是否有子菜单，有子菜单则不跳转
  if (item.children && item.children.length > 0) {
    console.log('Menu has children, expanding only')
    return
  }
  router.push(key).then(() => {
    console.log('Navigation successful:', key)
  }).catch(err => {
    console.error('Navigation failed:', err.message)
    message.error('页面跳转失败: ' + err.message)
  })
}

const handleSelect = (key: string) => {
  switch (key) {
    case 'profile':
      break
    case 'logout':
      authStore.logout()
      break
  }
}
</script>
