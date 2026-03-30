<script lang="ts">
import InnerNavbar from '@/components/base/BaseInnerNavbar.vue'
import BaseNavbar from '@/components/base/BaseNavbar.vue'
import { TABBAR_ROUTE_NAMES } from '@/composables/useTabbar'

export default {
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
}
</script>

<script setup lang="ts">
const route = useRoute()
const { navigationBarHeight, statusBarHeight, safeAreaInsetsBottom } = usePlatform()
const navbarType = computed(() => route.baseNavbar?.type || 'default')
const hasTabbar = computed(() => TABBAR_ROUTE_NAMES.includes(route.name as (typeof TABBAR_ROUTE_NAMES)[number]))
const topOffset = computed(() => navbarType.value === 'default' ? navigationBarHeight + statusBarHeight : 0)
const bottomOffset = computed(() => hasTabbar.value ? safeAreaInsetsBottom + 50 : 0)

const spacerStyle = computed(() => ({
  paddingTop: `${topOffset.value}px`,
  position: 'relative' as const,
  zIndex: -2,
}))

const comLayoutHeight = computed(() => {
  return `calc(100vh - ${bottomOffset.value}px)`
})
</script>

<template>
  <view class="page-layout">
    <view class="page-main">
      <base-navbar v-if="navbarType === 'default'" />
      <view class="page-body" :style="{ height: comLayoutHeight }">
        <inner-navbar v-if="navbarType === 'inner'" />
        <view :style="spacerStyle" class="page-spacer" />
        <slot />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-layout {
  width: 100%;

  .page-main {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .page-body {
    position: relative;
    overflow: auto;
    z-index: 1;
    width: 100%;
  }

  .page-spacer {
    pointer-events: none;
  }
}
</style>
