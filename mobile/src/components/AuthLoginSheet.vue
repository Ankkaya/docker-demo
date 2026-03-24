<script setup lang="ts">
import type { PendingRoute } from '@/store/userStore'
import { useUserStore } from '@/store/userStore'
import Apis from '@/api'

const router = useRouter()
const userStore = useUserStore()
const toast = useToast()
const { tabbarList, setTabbarItemActive } = useTabbar()

const isVisible = computed({
  get: () => userStore.authPopupVisible,
  set: (value: boolean) => {
    if (!value) {
      userStore.closeAuthPopup()
    }
  },
})

const loginForm = reactive({
  phone: '',
  password: '',
})

const isSubmitting = ref(false)

async function resumePendingRoute(target: PendingRoute | null) {
  if (!target) {
    return
  }

  if (target.name && tabbarList.value.some(item => item.name === target.name)) {
    setTabbarItemActive(target.name)
    await router.pushTab({ name: target.name })
    return
  }

  if (target.name) {
    await router.push({
      name: target.name,
      query: target.query,
    })
    return
  }

  if (target.path) {
    await router.push({
      path: target.path,
      query: target.query,
    })
  }
}

async function handlePhoneLogin() {
  const phone = loginForm.phone.trim()
  const password = loginForm.password.trim()

  if (!/^1\d{10}$/.test(phone)) {
    toast.show('请输入正确的手机号')
    return
  }

  if (!password) {
    toast.show('请输入登录密码')
    return
  }

  isSubmitting.value = true
  try {
    const loginResult = await (Apis.general as any).MallAuthController_login({
      data: {
        phone,
        password,
      },
    }).send()

    userStore.setSession({
      token: loginResult.token,
      refreshToken: loginResult.refreshToken,
    })

    const profile = await (Apis.general as any).MallAuthController_getProfile().send()
    userStore.setCurrentUser(profile)

    loginForm.password = ''

    const pendingRoute = userStore.consumePendingRoute()
    await resumePendingRoute(pendingRoute)
  }
  catch {
    userStore.logout()
  }
  finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  loginForm.password = ''
  userStore.consumePendingRoute()
  userStore.closeAuthPopup()
}
</script>

<script lang="ts">
export default {
  options: {
    virtualHost: true,
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<template>
  <wd-popup
    v-model="isVisible"
    position="bottom"
    safe-area-inset-bottom
    custom-class="auth-login-sheet"
    :close-on-click-modal="false"
    lock-scroll
    root-portal
    :z-index="2000"
  >
    <view class="auth-login-sheet__panel">
      <view class="auth-login-sheet__handle" />

      <view class="auth-login-sheet__hero">
        <view class="auth-login-sheet__badge">
          账号登录
        </view>
        <view class="auth-login-sheet__title">
          登录后解锁完整商城服务
        </view>
        <view class="auth-login-sheet__desc">
          购物车、订单、地址和评价等功能需要先完成登录。
        </view>
      </view>

      <view class="auth-login-sheet__benefits">
        <view class="auth-login-sheet__benefit">
          <text class="i-material-symbols:shopping-cart-checkout-rounded auth-login-sheet__benefit-icon" />
          <text>同步购物车与结算信息</text>
        </view>
        <view class="auth-login-sheet__benefit">
          <text class="i-material-symbols:receipt-long-rounded auth-login-sheet__benefit-icon" />
          <text>查看订单与售后进度</text>
        </view>
        <view class="auth-login-sheet__benefit">
          <text class="i-material-symbols:location-on-rounded auth-login-sheet__benefit-icon" />
          <text>管理收货地址与常用资料</text>
        </view>
      </view>

      <view class="auth-login-sheet__form">
        <view class="auth-login-sheet__field">
          <view class="auth-login-sheet__label">
            手机号
          </view>
          <wd-input
            v-model="loginForm.phone"
            clearable
            placeholder="请输入手机号"
            type="number"
          />
        </view>

        <view class="auth-login-sheet__field">
          <view class="auth-login-sheet__label">
            密码
          </view>
          <wd-input
            v-model="loginForm.password"
            clearable
            placeholder="请输入登录密码"
            type="password"
          />
        </view>
      </view>

      <view class="auth-login-sheet__actions">
        <wd-button block hairline @click="handleCancel">
          暂不登录
        </wd-button>
        <wd-button block type="primary" :loading="isSubmitting" @click="handlePhoneLogin">
          登录
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<style lang="scss" scoped>
:deep(.auth-login-sheet) {
  border-radius: 32rpx 32rpx 0 0;
  overflow: hidden;
}

.auth-login-sheet {
  &__panel {
    padding: 24rpx 28rpx 36rpx;
    background:
      radial-gradient(circle at top right, rgba(239, 178, 57, 0.18), transparent 34%),
      linear-gradient(180deg, #fffdf8 0%, #fff 100%);
  }

  &__handle {
    width: 88rpx;
    height: 8rpx;
    margin: 0 auto 28rpx;
    border-radius: 999rpx;
    background: rgba(148, 163, 184, 0.35);
  }

  &__hero {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }

  &__badge {
    width: fit-content;
    border-radius: 999rpx;
    background: rgba(239, 178, 57, 0.14);
    color: #c57d16;
    font-size: 22rpx;
    font-weight: 700;
    padding: 10rpx 18rpx;
  }

  &__title {
    color: #0f172a;
    font-size: 38rpx;
    font-weight: 700;
    line-height: 1.3;
  }

  &__desc {
    color: #64748b;
    font-size: 26rpx;
    line-height: 1.7;
  }

  &__benefits {
    margin-top: 28rpx;
    display: grid;
    gap: 18rpx;
  }

  &__benefit {
    display: flex;
    align-items: center;
    gap: 14rpx;
    border: 1px solid rgba(239, 178, 57, 0.12);
    border-radius: 24rpx;
    background: rgba(255, 255, 255, 0.88);
    color: #334155;
    font-size: 26rpx;
    padding: 22rpx 24rpx;
  }

  &__benefit-icon {
    color: #efb239;
    font-size: 36rpx;
    line-height: 1;
  }

  &__form {
    display: grid;
    gap: 18rpx;
    margin-top: 28rpx;
  }

  &__field {
    display: grid;
    gap: 14rpx;
  }

  &__label {
    color: #334155;
    font-size: 24rpx;
    font-weight: 600;
  }

  &__actions {
    display: grid;
    gap: 16rpx;
    margin-top: 32rpx;
  }
}
</style>
