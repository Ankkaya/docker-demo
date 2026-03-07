<script lang="ts" setup>
import BaseLayout from '@/components/base/BaseLayout.vue'

const router = useRouter()
const route = useRoute()

const { activeTabbar, getTabbarItemValue, setTabbarItemActive, tabbarList } = useTabbar()

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

  nextTick(() => {
    if (route.name && route.name !== activeTabbar.value.name) {
      setTabbarItemActive(route.name)
    }
  })
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
  <wd-tabbar
    v-if="comShowTabbar" :model-value="activeTabbar.name" bordered safe-area-inset-bottom placeholder fixed
    @change="handleTabbarChange"
  >
    <wd-tabbar-item
      v-for="(item, index) in tabbarList" :key="index" :name="item.name"
      :value="getTabbarItemValue(item.name)" :title="item.title" :icon="item.icon"
    />
  </wd-tabbar>
</template>
