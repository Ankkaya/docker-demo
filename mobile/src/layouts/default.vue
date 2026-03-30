<script lang="ts" setup>
import { computed, watch } from 'vue'
import AuthLoginSheet from '@/components/AuthLoginSheet.vue'
import BaseLayout from '@/components/base/BaseLayout.vue'

const router = useRouter()
const route = useRoute()

const { activeTabbar, getTabbarItemValue, setTabbarItemActive, tabbarList } = useTabbar()

const tabbarModelValue = computed(() => activeTabbar.value.name)
const tabbarRouteNames = computed(() => tabbarList.value.map(item => item.name))

function syncTabbarActiveByRoute(source: string) {
  const routeName = typeof route.name === 'string' ? route.name : ''
  if (!routeName || !tabbarRouteNames.value.includes(routeName)) {
    return
  }

  if (routeName !== activeTabbar.value.name) {
    setTabbarItemActive(routeName)
  }
}

watch(
  () => route.name,
  () => {
    syncTabbarActiveByRoute('watch:route.name')
  },
  { immediate: true },
)

function handleTabbarChange({ value }: { value: string }) {
  setTabbarItemActive(value)
  router.pushTab({ name: value })
}

const comShowTabbar = computed(() =>
  tabbarList.value.findIndex(item => item.name === route.name) !== -1,
)

onShow(() => {
  // #ifdef APP-PLUS
  uni.hideTabBar()
  // #endif

  syncTabbarActiveByRoute('onShow')
})
</script>

<script lang="ts">
export default {
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
}
</script>

<template>
  <base-layout>
    <slot />
  </base-layout>
  <AuthLoginSheet />
  <wd-tabbar
    v-if="comShowTabbar" :model-value="tabbarModelValue" bordered safe-area-inset-bottom placeholder fixed
    @change="handleTabbarChange"
  >
    <wd-tabbar-item
      v-for="(item, index) in tabbarList" :key="item.name" :name="item.name"
      :value="getTabbarItemValue(item.name)" :title="item.title" :icon="item.icon"
    >
      <template #icon="{ active }">
        <!-- 使用静态类名确保 UnoCSS 能正确扫描 -->
        <!-- i-material-symbols:house i-material-symbols:category-rounded i-material-symbols:shopping-cart i-material-symbols:account-circle -->
        <view
          class="size-5" :class="[
            item.name === 'home' ? 'i-material-symbols:house' : '',
            item.name === 'category' ? 'i-material-symbols:category-rounded' : '',
            item.name === 'cart' ? 'i-material-symbols:shopping-cart' : '',
            item.name === 'user' ? 'i-material-symbols:account-circle' : '',
            active ? 'text-primary' : 'text-slate-400',
          ]"
        />
      </template>
    </wd-tabbar-item>
  </wd-tabbar>
</template>
