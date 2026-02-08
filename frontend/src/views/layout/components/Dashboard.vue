<template>
  <div class="dashboard">
    <h2 class="text-2xl font-bold mb-6 text-base-text">欢迎回来，{{ user?.name || user?.username }}</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <n-card title="用户统计" class="bg-container transition-theme">
        <div class="text-center text-4xl font-bold text-primary">{{ userCount }}</div>
      </n-card>
      <n-card title="菜单统计" class="bg-container transition-theme">
        <div class="text-center text-4xl font-bold text-success">{{ menuCount }}</div>
      </n-card>
      <n-card title="系统状态" class="bg-container transition-theme">
        <div class="flex items-center justify-center gap-2">
          <n-tag type="success" size="large">运行正常</n-tag>
        </div>
      </n-card>
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
