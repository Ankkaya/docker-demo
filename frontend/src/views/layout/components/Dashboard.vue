<template>
  <div class="dashboard">
    <h2 class="text-2xl font-bold mb-6">欢迎回来，{{ user?.name || user?.username }}</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>用户统计</span>
          </div>
        </template>
        <div class="text-center text-4xl font-bold text-blue-500">{{ userCount }}</div>
      </el-card>
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>菜单统计</span>
          </div>
        </template>
        <div class="text-center text-4xl font-bold text-green-500">{{ menuCount }}</div>
      </el-card>
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>系统状态</span>
          </div>
        </template>
        <div class="flex items-center justify-center gap-2">
          <el-tag type="success" size="large">运行正常</el-tag>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getUsers } from '@/api/user'
import { getMenus } from '@/api/menu'

const authStore = useAuthStore()
const userCount = ref(0)
const menuCount = ref(0)
const user = computed(() => authStore.user)

onMounted(async () => {
  try {
    const usersRes = await getUsers({ pageSize: 1 })
    userCount.value = usersRes.total
    const menusRes = await getMenus()
    menuCount.value = menusRes.length
  } catch (error) {
    console.error('获取统计数据失败')
  }
})
</script>
