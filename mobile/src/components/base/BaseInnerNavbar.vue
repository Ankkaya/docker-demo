<script lang="ts">
import BaseFixed from '@/components/base/BaseFixed.vue'
import BaseStatusbar from '@/components/base/BaseStatusbar.vue'

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
const { navigationBarHeight } = usePlatform()

const iconColor = computed(() => route.baseNavbar?.iconColor || '#000')
const title = computed(() => route.style?.navigationBarTitleText || '')
const showBackIcon = computed(() => {
  // 获取页面栈
  const pages = getCurrentPages()
  // 如果当前页面是第一个页面，不显示返回按钮
  return pages.length > 1
})
const baseFixedStyle = computed(() => ({}))
const titleBarStyle = computed(() => ({}))

function clickBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  }
  else {
    uni.reLaunch({
      url: '/pages/home/index',
    })
  }
}
</script>

<template>
  <base-fixed :base-fixed-style="baseFixedStyle">
    <view class="base-inner-navbar">
      <base-statusbar />
      <view class="navbar-content" :style="[{ height: `${navigationBarHeight}px` }]">
        <view v-if="showBackIcon" class="page-navbar__content-left" @click="clickBack">
          <wd-icon name="left" size="25" :color="iconColor" />
        </view>
        <view class="page-navbar__content-center">
          <view class="page-navbar__content-center-title" :style="[titleBarStyle]">
            {{ title }}
          </view>
        </view>
      </view>
    </view>
  </base-fixed>
</template>

<style lang="scss" scoped>
.base-inner-navbar {
  width: 100%;
  background: transparent;

  .navbar-content {
    position: relative;
    z-index: 2;
    padding: 0 10px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;

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
        color: '#000'
      }
    }
  }
}
</style>
