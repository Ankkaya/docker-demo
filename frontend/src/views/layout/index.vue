<template>
  <div class="min-h-screen flex flex-col">
    <!-- 顶部导航 -->
    <header class="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10">
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-bold text-gray-800">Docker Demo Admin</h1>
      </div>
      <div class="flex items-center gap-4">
        <n-dropdown trigger="click" :options="dropdownOptions" @select="handleSelect">
          <div class="flex items-center gap-2 cursor-pointer">
            <n-avatar :size="32">
              <template #icon>
                <n-icon><person-outline /></n-icon>
              </template>
            </n-avatar>
            <span class="text-gray-700">{{ user?.name || user?.username }}</span>
            <n-icon><chevron-down-outline /></n-icon>
          </div>
        </n-dropdown>
      </div>
    </header>

    <!-- 主体区域 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 左侧菜单 -->
      <aside class="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <n-menu :value="activeMenu" :options="menuOptions" @update:value="handleMenuSelect" />
      </aside>

      <!-- 右侧内容 -->
      <main class="flex-1 overflow-y-auto p-6 bg-gray-50">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { PersonOutline, ChevronDownOutline, HomeOutline, MenuOutline } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import type { MenuOption } from 'naive-ui'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const activeMenu = computed(() => route.path)

// 图标渲染函数
const renderIcon = (icon: any) => {
  return () => h(NIcon, null, { default: () => h(icon) })
}

// 菜单选项
const menuOptions: MenuOption[] = [
  {
    label: '首页',
    key: '/dashboard',
    icon: renderIcon(HomeOutline)
  },
  {
    label: '用户管理',
    key: '/users/list',
    icon: renderIcon(PersonOutline)
  },
  {
    label: '菜单管理',
    key: '/menus/list',
    icon: renderIcon(MenuOutline)
  }
]

// 下拉选项
const dropdownOptions = [
  { label: '个人信息', key: 'profile' },
  { label: '退出登录', key: 'logout' }
]

const handleMenuSelect = (key: string) => {
  router.push(key)
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
