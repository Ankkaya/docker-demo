<template>
  <div class="min-h-screen flex flex-col bg-layout transition-theme">
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
    <div class="flex-1 flex overflow-hidden">
      <!-- 左侧菜单 -->
      <aside class="w-64 bg-container border-r border-gray-200 dark:border-gray-700 overflow-y-auto shadow-sider transition-theme">
        <n-menu 
          :value="activeMenu" 
          :options="menuOptions" 
          @update:value="handleMenuSelect"
        />
      </aside>

      <!-- 右侧内容 -->
      <main class="flex-1 overflow-y-auto p-6 bg-layout transition-theme">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
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
  DocumentTextOutline   // 进销存父菜单
} from '@vicons/ionicons5'
import { NIcon, useMessage } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import ThemeSchemaSwitch from '@/components/common/ThemeSchemaSwitch.vue'
import type { Menu } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const message = useMessage()

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
  'return': ReturnUpBackOutline     // 返回 - 采购退货
}

// 图标渲染函数
const renderIcon = (iconName?: string) => {
  if (!iconName) return undefined
  const icon = iconMap[iconName] || MenuOutline
  return () => h(NIcon, null, { default: () => h(icon) })
}

// 将后端菜单转换为 Naive UI 菜单选项
const mapMenuToOption = (menu: Menu): MenuOption => {
  return {
    label: menu.name,
    key: menu.path || String(menu.id),
    icon: renderIcon(menu.icon),
    children: menu.children?.map(mapMenuToOption)
  }
}

// 动态菜单选项
const menuOptions = computed<MenuOption[]>(() => {
  const dashboardOption: MenuOption = {
    label: '首页',
    key: '/dashboard',
    icon: renderIcon('home')
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
