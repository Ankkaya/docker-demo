<template>
  <div class="tab-bar bg-container border-b border-gray-200 dark:border-gray-700 transition-theme">
    <div class="tab-list flex items-center px-2 h-10 overflow-x-auto scrollbar-thin">
      <div
        v-for="tab in tabStore.tabs"
        :key="tab.key"
        :class="[
          'tab-item flex items-center gap-2 px-3 py-1.5 mr-1 rounded cursor-pointer text-sm select-none whitespace-nowrap transition-all',
          tab.key === tabStore.activeTab
            ? 'bg-primary text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        ]"
        @click="handleClick(tab)"
        @contextmenu.prevent="handleContextMenu($event, tab)"
      >
        <span>{{ tab.title }}</span>
        <n-icon
          v-if="!tab.fixed"
          class="close-icon opacity-60 hover:opacity-100"
          :class="{ 'opacity-100': tab.key === tabStore.activeTab }"
          @click.stop="handleClose(tab)"
        >
          <close-outline />
        </n-icon>
      </div>
    </div>

    <!-- 右键菜单 -->
    <n-dropdown
      :show="showContextMenu"
      :options="contextMenuOptions"
      :x="contextMenuX"
      :y="contextMenuY"
      trigger="manual"
      placement="bottom-start"
      @clickoutside="showContextMenu = false"
      @select="handleContextMenuSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, h, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTabStore } from '@/store/modules/tab'
import { CloseOutline, RefreshOutline, CloseCircleOutline, CloseAllOutline, ArrowForwardOutline } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import type { DropdownOption } from 'naive-ui'
import type { Tab } from '@/store/modules/tab'

const router = useRouter()
const tabStore = useTabStore()

// 右键菜单
const showContextMenu = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextTab = ref<Tab | null>(null)

const renderIcon = (icon: any) => {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const contextMenuOptions = ref<DropdownOption[]>([
  {
    key: 'refresh',
    label: '刷新当前',
    icon: renderIcon(RefreshOutline),
    disabled: false
  },
  {
    key: 'close',
    label: '关闭当前',
    icon: renderIcon(CloseCircleOutline),
    disabled: false
  },
  {
    key: 'closeOthers',
    label: '关闭其他',
    icon: renderIcon(CloseOutline),
    disabled: false
  },
  {
    key: 'closeRight',
    label: '关闭右侧',
    icon: renderIcon(ArrowForwardOutline),
    disabled: false
  }
])

// 点击标签切换路由
const handleClick = (tab: Tab) => {
  if (tab.key !== tabStore.activeTab) {
    tabStore.activateTab(tab.key)
    router.push({
      path: tab.key,
      query: tab.query,
      params: tab.params
    })
  }
}

// 关闭标签
const handleClose = (tab: Tab) => {
  if (tab.fixed) return
  tabStore.removeTab(tab.key)
  // 如果关闭后需要跳转
  if (tab.key === tabStore.activeTab) {
    const active = tabStore.tabs.find(t => t.key === tabStore.activeTab)
    if (active) {
      router.push({
        path: active.key,
        query: active.query,
        params: active.params
      })
    }
  }
}

// 右键菜单
const handleContextMenu = (e: MouseEvent, tab: Tab) => {
  e.preventDefault()
  contextTab.value = tab
  showContextMenu.value = false
  
  // 更新菜单禁用状态
  contextMenuOptions.value = [
    {
      key: 'refresh',
      label: '刷新当前',
      icon: renderIcon(RefreshOutline),
      disabled: tab.fixed
    },
    {
      key: 'close',
      label: '关闭当前',
      icon: renderIcon(CloseCircleOutline),
      disabled: tab.fixed
    },
    {
      key: 'closeOthers',
      label: '关闭其他',
      icon: renderIcon(CloseOutline),
      disabled: tabStore.tabs.length <= 1
    },
    {
      key: 'closeRight',
      label: '关闭右侧',
      icon: renderIcon(ArrowForwardOutline),
      disabled: tabStore.tabs.findIndex(t => t.key === tab.key) >= tabStore.tabs.length - 1
    }
  ]
  
  nextTick(() => {
    contextMenuX.value = e.clientX
    contextMenuY.value = e.clientY
    showContextMenu.value = true
  })
}

// 右键菜单选择
const handleContextMenuSelect = (key: string) => {
  showContextMenu.value = false
  if (!contextTab.value) return

  switch (key) {
    case 'refresh':
      // 刷新当前标签页
      if (contextTab.value.key !== tabStore.activeTab) {
        // 如果刷新的不是当前激活的标签，先激活它
        tabStore.activateTab(contextTab.value.key)
      }
      // 从缓存中移除该组件，然后通过 redirect 重新加载
      tabStore.refreshTab(contextTab.value.key)
      router.replace({
        path: '/redirect',
        query: { to: contextTab.value.key }
      }).catch(() => {
        // 如果失败，直接刷新页面
        window.location.reload()
      })
      break
    case 'close':
      handleClose(contextTab.value)
      break
    case 'closeOthers':
      tabStore.closeOthers(contextTab.value.key)
      if (contextTab.value.key !== tabStore.activeTab) {
        router.push({
          path: contextTab.value.key,
          query: contextTab.value.query,
          params: contextTab.value.params
        })
      }
      break
    case 'closeRight':
      tabStore.closeRight(contextTab.value.key)
      // 如果当前激活的标签在右侧被关闭了，跳转到当前标签
      if (!tabStore.tabs.find(t => t.key === tabStore.activeTab)) {
        router.push({
          path: contextTab.value.key,
          query: contextTab.value.query,
          params: contextTab.value.params
        })
      }
      break
  }
}
</script>

<style scoped>
.tab-bar {
  flex-shrink: 0;
  height: 40px; /* 固定高度 */
  min-height: 40px;
  max-height: 40px;
}

.tab-list {
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
  /* 防止标签被压缩 */
  flex-wrap: nowrap;
}

/* 可选：hover 时显示滚动条 */
.tab-list:hover {
  scrollbar-width: thin;
  -ms-overflow-style: auto;
}

.tab-list:hover::-webkit-scrollbar {
  display: block;
  height: 3px;
}

.tab-list::-webkit-scrollbar {
  display: none; /* Chrome Safari */
  height: 3px;
}

.tab-list::-webkit-scrollbar-track {
  background: transparent;
}

.tab-list::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

.dark .tab-list::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.15);
}

.tab-item {
  position: relative;
  flex-shrink: 0; /* 防止标签被压缩 */
}

.close-icon {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-icon:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.dark .close-icon:hover {
  background-color: rgba(0, 0, 0, 0.3);
}
</style>
