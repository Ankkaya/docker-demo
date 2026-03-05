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
  baseFixedStyle?: {
    fixedBg?: Record<string, any>
  }
}

const props = withDefaults(defineProps<{
  navbarStyle?: NavbarStyle
}>(), {
  navbarStyle: () => ({}),
})

const { navigationBarHeight } = usePlatform()

const backIconColor = computed(() => props.navbarStyle?.backIconColor || '#000')
const title = computed(() => props.navbarStyle?.title || '未设置标题')
const showBackIcon = computed(() => props.navbarStyle?.showBackIcon || false)
const baseFixedStyle = computed(() => props.navbarStyle?.baseFixedStyle || {})
const titleBarStyle = computed(() => props.navbarStyle?.titleBarStyle || {})

function clickBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  }
  else {
    uni.reLaunch({
      url: '/pages/index/index',
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
          <uni-icons type="left" size="25" :color="backIconColor" />
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
