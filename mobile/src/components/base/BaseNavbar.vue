<script lang="ts">
export default {
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
}
</script>

<script lang="ts" setup>
interface NavbarStyle {
  titleBarStyle?: Record<string, any>
  statusBarStyle?: Record<string, any>
  backIconColor?: string
  title?: string
  showBackIcon?: boolean
}

const props = defineProps<{
  navbarStyle?: NavbarStyle
}>()

const { navigationBarHeight } = usePlatform()

const defaultNavbarStyle = {
  height: `${navigationBarHeight}px`,
}

const titleBarStyle = computed(() => ({
  ...defaultNavbarStyle,
  ...props.navbarStyle?.titleBarStyle,
}))

const statusBarStyle = computed(() => ({
  ...props.navbarStyle?.statusBarStyle,
}))

const backIconColor = computed(() => props.navbarStyle?.backIconColor || '#000')
const title = computed(() => props.navbarStyle?.title)
const showBackIcon = computed(() => props.navbarStyle?.showBackIcon || false)

function clickBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="page-navbar">
    <base-statusbar :status-bar-style="statusBarStyle" />
    <view class="page-navbar__content" :style="[titleBarStyle]">
      <view v-if="showBackIcon" class="page-navbar__content-left" @click="clickBack">
        <uni-icons type="left" size="25" :color="backIconColor" />
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
