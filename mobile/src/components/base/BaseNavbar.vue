<script lang="ts">
import BaseStatusbar from '@/components/base/BaseStatusbar.vue'
import { TABBAR_ROUTE_NAMES } from '@/composables/useTabbar'

export default {
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
}
</script>

<script lang="ts" setup>
const route = useRoute()
const router = useRouter()
const { navigationBarHeight } = usePlatform()

const defaultNavbarStyle = {
  height: `${navigationBarHeight}px`,
}

const title = computed(() => route.style?.navigationBarTitleText || '')

const titleBarStyle = computed(() => ({
  ...defaultNavbarStyle,
}))

const iconColor = computed(() => route.baseNavbar?.iconColor || '#efb239')
const isTabbarPage = computed(() => TABBAR_ROUTE_NAMES.includes(String(route.name || '') as any))
const shouldGoHome = computed(() => {
  const pages = getCurrentPages()
  return pages.length <= 1 && !isTabbarPage.value
})

const showBackIcon = computed(() => {
  const pages = getCurrentPages()
  return pages.length > 1 || shouldGoHome.value
})

const statusBarStyle = computed(() => ({}))

function clickBack() {
  if (shouldGoHome.value) {
    router.replaceAll({ name: 'home' })
    return
  }

  uni.navigateBack()
}
</script>

<template>
  <view class="page-navbar">
    <base-statusbar :status-bar-style="statusBarStyle" />
    <view class="page-navbar__content" :style="[titleBarStyle]">
      <!-- <view class="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#efb239]/10 text-[#efb239]"
        @click="goBack">
        <wd-icon name="arrow-left" size="20" />
      </view> -->
      <view v-if="showBackIcon" class="page-navbar__content-left" @click="clickBack">
        <wd-icon name="arrow-left" size="25" :color="iconColor" />
      </view>
      <view class="page-navbar__content-center">
        <view class="page-navbar__content-center-title">
          {{ title }}
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-navbar {
  position: fixed;
  background-color: #fff;
  top: 0;
  left: 0;
  z-index: 999;
  width: 100%;

  .page-navbar__content {
    position: relative;
    padding: 0 10px;
    font-size: 12px;

    .page-navbar__content-left {
      width: 120rpx;
      height: 100%;
      display: flex;
      align-items: center;
    }

    .page-navbar__content-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translateX(-50%) translateY(-50%);

      .page-navbar__content-center-title {
        overflow: hidden;
        font-size: 32rpx;
      }
    }
  }
}
</style>
