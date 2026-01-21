<template>
  <div class="min-h-screen flex flex-col">
    <!-- 顶部导航 -->
    <header class="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10">
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-bold text-gray-800">Docker Demo Admin</h1>
      </div>
      <div class="flex items-center gap-4">
        <el-dropdown trigger="click" @command="handleCommand">
          <span class="flex items-center gap-2 cursor-pointer">
            <el-avatar :size="32" :src="user?.avatar">
              <el-icon>
                <User />
              </el-icon>
            </el-avatar>
            <span class="text-gray-700">{{ user?.name || user?.username }}</span>
            <el-icon>
              <ArrowDown />
            </el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人信息</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- 主体区域 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 左侧菜单 -->
      <aside class="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <el-menu :default-active="activeMenu" :router="true" class="border-r-0">
          <el-menu-item index="/dashboard">
            <el-icon>
              <HomeFilled />
            </el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/users/list">
            <el-icon>
              <User />
            </el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/menus/list">
            <el-icon>
              <Menu />
            </el-icon>
            <span>菜单管理</span>
          </el-menu-item>
        </el-menu>
      </aside>

      <!-- 右侧内容 -->
      <main class="flex-1 overflow-y-auto p-6 bg-gray-50">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { User, ArrowDown, HomeFilled, Menu } from '@element-plus/icons-vue'

const route = useRoute()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const activeMenu = computed(() => route.path)

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      break
    case 'logout':
      authStore.logout()
      break
  }
}
</script>
