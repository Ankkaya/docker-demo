<script lang="ts">
import InnerNavbar from '@/components/base/BaseInnerNavbar.vue'
import BaseNavbar from '@/components/base/BaseNavbar.vue'

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
const { navigationBarHeight, statusBarHeight } = usePlatform()

const spacerStyle = computed(() => ({
  paddingTop: `${navigationBarHeight + statusBarHeight}px`,
  position: 'relative' as const,
  zIndex: -2,
}))

const navbarType = computed(() => route.baseNavbar?.type || 'default')
</script>

<template>
  <view class="page-layout">
    <view class="page-main">
      <base-navbar v-if="navbarType === 'default'" />
      <view class="page-body">
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
  height: calc(100vh - 84px);

  .page-main {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .page-body {
    position: relative;
    z-index: 1;
    flex: 1;
    width: 100%;
  }

  .page-spacer {
    pointer-events: none;
  }
}
</style>
