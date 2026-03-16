// const SYSTEM_SETTING = uni.getSystemSetting()
// const DEVICE_INFO = uni.getDeviceInfo()
const WINDOW_INFO = uni.getWindowInfo()
// const APP_BASE_INFO = uni.getAppBaseInfo()

/**
 * 获取胶囊按钮信息
 * @returns 胶囊按钮信息
 */
function getCapsule() {
  // #ifdef MP
  let capsule = uni.getMenuButtonBoundingClientRect()
  if (!capsule) {
    capsule = {
      bottom: 56,
      height: 32,
      left: 278,
      right: 365,
      top: 24,
      width: 87,
    }
  }
  return capsule
  // #endif
}

/**
 * 获取导航栏高度
 * @returns 导航栏高度
 */
function getNavbar() {
  const capsule = getCapsule()
  return (capsule.top - WINDOW_INFO.statusBarHeight) * 2 + capsule.height
}

export function usePlatform() {
  const capsuleInfo = getCapsule()
  const navigationBarHeight = getNavbar()
  const topAreaHeight = navigationBarHeight + WINDOW_INFO.statusBarHeight
  return {
    capsuleInfo,
    navigationBarHeight,
    statusBarHeight: WINDOW_INFO.statusBarHeight,
    topAreaHeight,
    safeAreaInsetsBottom: WINDOW_INFO.safeAreaInsets.bottom,
  }
}
