<script setup lang="ts">
import type { PendingRoute } from '@/store/userStore'
import type { MallProfilePayload } from '@/api/mall-auth'
import Apis from '@/api'
import { uploadAvatar } from '@/api/file'
import { mallWechatLogin, updateMallProfile } from '@/api/mall-auth'
import { authEnvConfig } from '@/config/auth'
import { useUserStore } from '@/store/userStore'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const toast = useToast()
const { tabbarList, setTabbarItemActive } = useTabbar()

const enabledLoginMethods = authEnvConfig.enabledLoginMethods
const showWechatLogin = enabledLoginMethods.includes('wechat')
const showPhoneLogin = enabledLoginMethods.includes('phone')

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
const profileDialogVisible = ref(false)
const profileSubmitting = ref(false)
const profileForm = reactive({
  nickname: '',
  avatarUrl: '',
})

function extractWechatProfile(source: any) {
  const userInfo = source?.userInfo || source || {}
  return {
    nickname: userInfo.nickName || userInfo.nickname || '',
    avatarUrl: userInfo.avatarUrl || userInfo.avatar || '',
  }
}

function buildRandomNickname() {
  return `微信用户${Math.random().toString(16).slice(2, 10).padEnd(8, '0')}`
}

function normalizeQueryValue(value: unknown) {
  if (value == null) {
    return ''
  }

  return String(value)
}

function isSameQuery(
  currentQuery: Record<string, any> | undefined,
  targetQuery: Record<string, any> | undefined,
) {
  const currentKeys = Object.keys(currentQuery || {}).sort()
  const targetKeys = Object.keys(targetQuery || {}).sort()

  if (currentKeys.length !== targetKeys.length) {
    return false
  }

  return currentKeys.every((key, index) => (
    key === targetKeys[index]
    && normalizeQueryValue(currentQuery?.[key]) === normalizeQueryValue(targetQuery?.[key])
  ))
}

function isCurrentPendingRoute(target: PendingRoute) {
  if (target.name && route.name && String(target.name) !== String(route.name)) {
    return false
  }

  if (target.path && route.path && String(target.path) !== String(route.path)) {
    return false
  }

  if (target.name && !route.name) {
    return false
  }

  if (target.path && !route.path) {
    return false
  }

  return isSameQuery((route.query || {}) as Record<string, any>, target.query)
}

function resetProfileForm() {
  profileForm.nickname = userStore.user?.name || userStore.profile.nickname || buildRandomNickname()
  profileForm.avatarUrl = userStore.user?.avatarUrl || userStore.profile.avatarUrl || authEnvConfig.defaultAvatarUrl || ''
}

function shouldPromptProfileCompletion(loginResult: any) {
  if (typeof loginResult?.profileCompleted === 'boolean') {
    return !loginResult.profileCompleted
  }

  const user = loginResult?.user || userStore.user
  const hasNickname = Boolean(user?.name || user?.username)
  const hasAvatar = Boolean(user?.avatarUrl)
  return !(hasNickname && hasAvatar)
}

async function resumePendingRoute(target: PendingRoute | null) {
  if (!target) {
    return
  }

  if (isCurrentPendingRoute(target)) {
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

async function finalizeLogin() {
  const pendingRoute = userStore.consumePendingRoute()
  await resumePendingRoute(pendingRoute)
}

async function syncCurrentProfile() {
  const profile = await (Apis.general as any).MallAuthController_getProfile().send()
  userStore.setCurrentUser(profile)
  return profile
}

async function handlePhoneLogin() {
  const phone = loginForm.phone.trim()
  const password = loginForm.password.trim()

  if (!/^1\d{10}$/.test(phone)) {
    toast.error('请输入正确的手机号')
    return
  }

  if (!password) {
    toast.error('请输入登录密码')
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

    await syncCurrentProfile()
    loginForm.password = ''
    await finalizeLogin()
  }
  catch {
    userStore.logout()
  }
  finally {
    isSubmitting.value = false
  }
}

async function requestWechatLoginCode() {
  return new Promise<string>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (result) => {
        if (result.code) {
          resolve(result.code)
          return
        }
        reject(new Error('未获取到微信登录 code'))
      },
      fail: reject,
    })
  })
}

async function handleWechatLogin(phoneCode?: string) {
  isSubmitting.value = true
  try {
    const code = await requestWechatLoginCode()
    const loginResult = await mallWechatLogin({
      code,
      phoneCode,
    }).send()

    userStore.setSession({
      token: loginResult.token,
      refreshToken: loginResult.refreshToken,
    })
    userStore.setCurrentUser(loginResult.user)

    if (shouldPromptProfileCompletion(loginResult)) {
      userStore.closeAuthPopup()
      resetProfileForm()
      profileDialogVisible.value = true
      return
    }

    await finalizeLogin()
  }
  catch {
    userStore.logout()
  }
  finally {
    isSubmitting.value = false
  }
}

async function handleWechatProfileFill() {
  const getUserProfile = (uni as any).getUserProfile || (typeof wx !== 'undefined' ? wx.getUserProfile : undefined)
  if (typeof getUserProfile !== 'function') {
    toast.info('当前环境暂不支持拉取微信资料')
    return
  }

  try {
    const result = await new Promise<any>((resolve, reject) => {
      getUserProfile({
        desc: '用于完善商城头像和昵称',
        success: resolve,
        fail: reject,
      })
    })

    const profile = extractWechatProfile(result)
    if (!profile.nickname && !profile.avatarUrl) {
      toast.error('未获取到微信头像昵称')
      return
    }

    profileForm.nickname = profile.nickname || profileForm.nickname
    profileForm.avatarUrl = profile.avatarUrl || profileForm.avatarUrl
  }
  catch {
    toast.error('未获取到微信资料')
  }
}

async function handleChooseAvatar() {
  try {
    const result = await new Promise<UniApp.ChooseImageSuccessCallbackResult>((resolve, reject) => {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: resolve,
        fail: reject,
      })
    })

    const selectedPath = result.tempFilePaths?.[0]
    if (!selectedPath) {
      return
    }

    const uploadResult = await uploadAvatar(selectedPath)
    profileForm.avatarUrl = uploadResult.url || uploadResult.objectKey
  }
  catch {
    toast.error('头像上传失败')
  }
}

async function handleWechatChooseAvatar(event: any) {
  const detail = unwrapButtonDetail<{ avatarUrl?: string }>(event)
  const selectedPath = detail?.avatarUrl || ''
  if (!selectedPath) {
    return
  }

  try {
    const uploadResult = await uploadAvatar(selectedPath)
    profileForm.avatarUrl = uploadResult.url || uploadResult.objectKey
  }
  catch {
    toast.error('头像上传失败')
  }
}

async function submitProfile(payload: MallProfilePayload) {
  profileSubmitting.value = true
  try {
    const profile = await updateMallProfile(payload).send()
    userStore.setCurrentUser(profile)
    profileDialogVisible.value = false
    await finalizeLogin()
  }
  finally {
    profileSubmitting.value = false
  }
}

async function handleSaveProfile() {
  const nickname = profileForm.nickname.trim() || buildRandomNickname()
  const avatarUrl = profileForm.avatarUrl || authEnvConfig.defaultAvatarUrl || ''
  await submitProfile({
    nickname,
    avatarUrl,
  })
}

async function handleSkipProfile() {
  await submitProfile({
    nickname: userStore.user?.name || buildRandomNickname(),
    avatarUrl: userStore.user?.avatarUrl || authEnvConfig.defaultAvatarUrl || '',
  })
}

function handleCancel() {
  loginForm.password = ''
  userStore.consumePendingRoute()
  userStore.closeAuthPopup()
}

function unwrapButtonDetail<T extends Record<string, any>>(event: T | { detail?: T } | undefined | null) {
  if (event && typeof event === 'object' && 'detail' in event) {
    return event.detail as T | undefined
  }

  return (event || undefined) as T | undefined
}

function handlePhoneNumberAuthorize(event: any) {
  const detail = unwrapButtonDetail<{ code?: string, errMsg?: string }>(event)
  const phoneCode = detail?.code
  const errMsg = detail?.errMsg || ''

  if (!phoneCode) {
    if (errMsg.includes('fail')) {
      toast.info('已取消手机号授权')
      handleCancel()
    }
    return
  }

  handleWechatLogin(phoneCode).catch(() => {})
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
    :z-index="2000"
  >
    <view class="auth-login-sheet__panel">
      <view class="auth-login-sheet__handle" />

      <view class="auth-login-sheet__hero">
        <view class="auth-login-sheet__badge">
          会员登录
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
          <text class="auth-login-sheet__benefit-icon i-material-symbols:shopping-cart-checkout-rounded" />
          <text>同步购物车与结算信息</text>
        </view>
        <view class="auth-login-sheet__benefit">
          <text class="auth-login-sheet__benefit-icon i-material-symbols:receipt-long-rounded" />
          <text>查看订单与售后进度</text>
        </view>
        <view class="auth-login-sheet__benefit">
          <text class="auth-login-sheet__benefit-icon i-material-symbols:location-on-rounded" />
          <text>管理收货地址与常用资料</text>
        </view>
      </view>

      <view v-if="showWechatLogin" class="auth-login-sheet__wechat">
        <view class="auth-login-sheet__section-title">
          微信快捷登录
        </view>
      </view>

      <view v-if="showPhoneLogin" class="auth-login-sheet__form">
        <view class="auth-login-sheet__section-title">
          手机号密码登录
        </view>
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

        <app-button block type="primary" :loading="isSubmitting" @click="handlePhoneLogin">
          登录
        </app-button>
      </view>

      <view class="auth-login-sheet__actions" :class="{ 'auth-login-sheet__actions--inline': showWechatLogin }">
        <!-- #ifdef MP-WEIXIN -->
        <app-button
          v-if="showWechatLogin"
          block
          type="primary"
          custom-class="auth-login-sheet__wechat-button auth-login-sheet__action-item"
          :loading="isSubmitting"
          open-type="getPhoneNumber"
          @getphonenumber="handlePhoneNumberAuthorize"
        >
          <view class="auth-login-sheet__button-content">
            <text class="i-carbon:logo-wechat text-[20px]" />
            <text>一键登录</text>
          </view>
        </app-button>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <app-button
          v-if="showWechatLogin"
          block
          type="primary"
          custom-class="auth-login-sheet__action-item"
          :loading="isSubmitting"
          @click="handleWechatLogin"
        >
          <view class="auth-login-sheet__button-content">
            <text class="i-carbon:logo-wechat text-[20px]" />
            <text>一键登录</text>
          </view>
        </app-button>
        <!-- #endif -->
        <app-button
          block
          type="info"
          custom-class="auth-login-sheet__action-item"
          @click="handleCancel"
        >
          暂不登录
        </app-button>
      </view>
    </view>
  </wd-popup>

  <wd-popup
    v-model="profileDialogVisible"
    position="bottom"
    safe-area-inset-bottom
    custom-class="auth-profile-sheet"
    :close-on-click-modal="false"
    lock-scroll
    :z-index="2100"
  >
    <view class="auth-profile-sheet__panel">
      <view class="auth-profile-sheet__handle" />
      <view class="auth-profile-sheet__title">
        完善头像和昵称
      </view>
      <view class="auth-profile-sheet__desc">
        请选择头像并填写昵称；跳过后会使用默认头像和随机昵称。
      </view>

      <!-- #ifdef MP-WEIXIN -->
      <app-button
        custom-class="auth-profile-sheet__avatar-button"
        custom-style="padding:0;border:0;background:transparent;min-width:0;height:auto;line-height:1;"
        open-type="chooseAvatar"
        @chooseavatar="handleWechatChooseAvatar"
      >
        <view class="auth-profile-sheet__avatar-wrap">
          <image v-if="profileForm.avatarUrl" :src="profileForm.avatarUrl" class="auth-profile-sheet__avatar" mode="aspectFill" />
          <view v-else class="auth-profile-sheet__avatar auth-profile-sheet__avatar--placeholder">
            <text class="i-material-symbols:account-circle text-[72px] text-slate-300" />
          </view>
        </view>
      </app-button>
      <!-- #endif -->
      <!-- #ifndef MP-WEIXIN -->
      <view class="auth-profile-sheet__avatar-wrap" @click="handleChooseAvatar">
        <image v-if="profileForm.avatarUrl" :src="profileForm.avatarUrl" class="auth-profile-sheet__avatar" mode="aspectFill" />
        <view v-else class="auth-profile-sheet__avatar auth-profile-sheet__avatar--placeholder">
          <text class="i-material-symbols:account-circle text-[72px] text-slate-300" />
        </view>
      </view>
      <!-- #endif -->
      <view class="auth-profile-sheet__avatar-tip">
        点击头像上传
      </view>

      <!-- #ifndef MP-WEIXIN -->
      <view class="auth-profile-sheet__avatar-actions">
        <app-button size="small" type="primary" plain @click="handleWechatProfileFill">
          使用微信头像昵称
        </app-button>
      </view>
      <!-- #endif -->

      <view class="auth-profile-sheet__field">
        <view class="auth-profile-sheet__label">
          昵称
        </view>
        <!-- #ifdef MP-WEIXIN -->
        <input
          v-model="profileForm.nickname"
          class="auth-profile-sheet__nickname-input"
          type="nickname"
          placeholder="请输入昵称"
        >
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <wd-input v-model="profileForm.nickname" clearable placeholder="请输入昵称" />
        <!-- #endif -->
      </view>

      <view class="auth-profile-sheet__actions auth-profile-sheet__actions--inline">
        <app-button block type="info" custom-class="auth-profile-sheet__action-item" @click="handleSkipProfile">
          跳过
        </app-button>
        <app-button
          block
          type="primary"
          custom-class="auth-profile-sheet__action-item"
          :loading="profileSubmitting"
          @click="handleSaveProfile"
        >
          保存资料
        </app-button>
      </view>
    </view>
  </wd-popup>
</template>

<style lang="scss" scoped>
:deep(.auth-login-sheet),
:deep(.auth-profile-sheet) {
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
    font-size: 34rpx;
  }

  &__section-title {
    color: #0f172a;
    font-size: 26rpx;
    font-weight: 700;
    margin-bottom: 16rpx;
  }

  &__wechat,
  &__form {
    margin-top: 28rpx;
  }

  &__wechat-button {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    border: 0;
    border-radius: 24rpx;
    background: var(--wot-color-theme, #efb239);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    font-size: 28rpx;
    font-weight: 700;
  }

  &__field {
    margin-bottom: 18rpx;
  }

  &__label {
    color: #334155;
    font-size: 24rpx;
    font-weight: 600;
    margin-bottom: 10rpx;
  }

  &__actions {
    margin-top: 24rpx;
    display: grid;
    gap: 16rpx;
  }

  &__actions--inline {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: stretch;
  }

  &__action-item {
    min-width: 0;
  }

  &__button-content {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
  }

  &__action-item--primary {
    --wot-button-primary-color: #fff;
  }
}

:deep(.auth-login-sheet__action-item) {
  box-sizing: border-box;
}

:deep(.auth-login-sheet__wechat-button .wd-button__content) {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.auth-login-sheet__wechat-button .wd-button__text) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.auth-profile-sheet__avatar-button) {
  width: 100%;
  display: flex;
  justify-content: center;
}

:deep(.auth-profile-sheet__avatar-button .wd-button__content) {
  width: 100%;
  display: flex;
  justify-content: center;
}

:deep(.auth-profile-sheet__avatar-button .wd-button__text) {
  width: 100%;
  display: flex;
  justify-content: center;
}

.auth-profile-sheet {
  background: linear-gradient(180deg, #ffffff 0%, #fff9ef 100%);
  &__panel {
    padding: 24rpx 28rpx 36rpx;
  }

  &__handle {
    width: 88rpx;
    height: 8rpx;
    margin: 0 auto 24rpx;
    border-radius: 999rpx;
    background: rgba(148, 163, 184, 0.35);
  }

  &__title {
    color: #0f172a;
    font-size: 34rpx;
    font-weight: 700;
  }

  &__desc {
    color: #64748b;
    font-size: 25rpx;
    line-height: 1.7;
    margin-top: 12rpx;
  }

  &__avatar-wrap {
    display: flex;
    justify-content: center;
    margin-top: 28rpx;
    cursor: pointer;
  }

  &__avatar-button {
    padding: 0;
    margin: 0;
    border: 0;
    background: transparent;
    line-height: 1;
  }

  &__avatar-button::after {
    border: 0;
  }

  &__avatar {
    width: 156rpx;
    height: 156rpx;
    border-radius: 999rpx;
    overflow: hidden;
    background: #fff;
    border: 6rpx solid rgba(239, 178, 57, 0.16);
  }

  &__avatar--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__avatar-tip {
    margin-top: 14rpx;
    text-align: center;
    color: #94a3b8;
    font-size: 22rpx;
  }

  &__avatar-actions {
    margin-top: 20rpx;
    display: flex;
    justify-content: center;
    gap: 16rpx;
  }

  &__field {
    margin-top: 28rpx;
  }

  &__label {
    color: #334155;
    font-size: 24rpx;
    font-weight: 600;
    margin-bottom: 10rpx;
  }

  &__nickname-input {
    width: 100%;
    box-sizing: border-box;
    border-radius: 24rpx;
    background: #fff;
    border: 2rpx solid rgba(148, 163, 184, 0.18);
    color: #0f172a;
    font-size: 28rpx;
    padding: 22rpx 24rpx;
    min-height: 88rpx;
  }

  &__actions {
    margin-top: 28rpx;
    display: grid;
    gap: 16rpx;
  }

  &__actions--inline {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: stretch;
  }

  &__action-item {
    min-width: 0;
  }
}
</style>
