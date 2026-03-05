<script lang="ts">
export default {
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
}
</script>

<script setup lang="ts">
interface NavbarStyle {
  type?: 'default' | 'inner'
  titleBarStyle?: Record<string, any>
  statusBarStyle?: Record<string, any>
  backIconColor?: string
  title?: string
  showBackIcon?: boolean
}

const props = withDefaults(defineProps<{
  navbarStyle?: NavbarStyle
}>(), {
  navbarStyle: () => ({}),
})

const { navigationBarHeight, statusBarHeight } = usePlatform()

const navbarType = computed(() => props.navbarStyle?.type || 'default')

const spacerStyle = computed(() => ({
  paddingTop: `${navigationBarHeight + statusBarHeight}px`,
  position: 'relative' as const,
  zIndex: -2,
}))
</script>

<template>
  <view class="page-layout">
    <view class="page-main">
      <base-navbar v-if="navbarType === 'default'" :navbar-style="navbarStyle" />
      <view class="page-body">
        <inner-navbar v-if="navbarType === 'inner'" :navbar-style="navbarStyle" />
        <view :style="spacerStyle" class="page-spacer" />
        <slot />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-layout {
  width: 100%;
  height: 100vh;

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
