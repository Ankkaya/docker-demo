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

const draftNickname = computed({
  get: () => userStore.draftProfile.nickname,
  set: (value: string) => userStore.updateDraftProfile({ nickname: value }),
})

const draftAvatar = computed(() => userStore.draftProfile.avatarUrl)
const isSubmitting = ref(false)

async function handleAuthorize() {
  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined' && typeof wx.getUserProfile === 'function') {
    try {
      const loginResult = await new Promise<any>((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject,
        })
      })
      const code = loginResult?.code
      if (!code) {
        toast.show('未获取到微信登录凭证')
        return
      }

      const profile = await new Promise<any>((resolve, reject) => {
        wx.getUserProfile({
          desc: '用于完善会员资料',
          success: resolve,
          fail: reject,
        })
      })

      const nickname = profile?.userInfo?.nickName || ''
      const avatarUrl = profile?.userInfo?.avatarUrl || ''

      const result = await Apis.general.MallAuthController_wechatLogin({
        data: {
          code,
          nickname: nickname || undefined,
        },
      }).send()

      userStore.setSession({
        token: result.token,
        user: result.user,
        nickname: result.user?.name || nickname,
        avatarUrl,
        keepPopupOpen: true,
      })

      userStore.applyWechatProfile({
        nickname: result.user?.name || nickname,
        avatarUrl,
      })
      return
    }
    catch (error: any) {
      toast.show(error?.message || '未完成微信授权，无法继续登录')
      return
    }
  }
  // #endif

  toast.show('当前环境暂不支持微信授权登录')
}

function handleChooseAvatar(event: any) {
  const avatarUrl = event?.detail?.avatarUrl || ''
  if (avatarUrl) {
    userStore.updateDraftProfile({ avatarUrl })
  }
}

async function handleChooseAvatarFallback() {
  try {
    const result = await uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
    })
    const avatarUrl = result.tempFilePaths?.[0] || ''
    if (avatarUrl) {
      userStore.updateDraftProfile({ avatarUrl })
    }
  }
  catch {
    toast.show('未选择头像')
  }
}

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

async function handleConfirmProfile() {
  if (!draftNickname.value.trim()) {
    toast.show('请输入昵称')
    return
  }

  isSubmitting.value = true
  try {
    userStore.completeLogin()
    const pendingRoute = userStore.consumePendingRoute()
    await resumePendingRoute(pendingRoute)
  }
  finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
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
  >
    <view class="auth-login-sheet__panel">
      <view class="auth-login-sheet__handle" />
      <template v-if="userStore.authStep === 'prompt'">
        <view class="auth-login-sheet__hero">
          <view class="auth-login-sheet__badge">
            微信授权
          </view>
          <view class="auth-login-sheet__title">
            登录后解锁完整商城服务
          </view>
          <view class="auth-login-sheet__desc">
            购物车、订单、地址和收藏等功能需要先完成微信授权。
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
        <view class="auth-login-sheet__actions">
          <wd-button block hairline @click="handleCancel">
            暂不登录
          </wd-button>
          <wd-button block type="primary" @click="handleAuthorize">
            微信授权登录
          </wd-button>
        </view>
      </template>

      <template v-else>
        <view class="auth-login-sheet__profile">
          <view class="auth-login-sheet__title">
            完善头像与昵称
          </view>
          <view class="auth-login-sheet__desc">
            已优先读取微信资料，你可以继续调整后完成登录。
          </view>

          <view class="auth-login-sheet__avatar-row">
            <view class="auth-login-sheet__avatar-preview">
              <image
                v-if="draftAvatar"
                :src="draftAvatar"
                mode="aspectFill"
                class="auth-login-sheet__avatar-image"
              />
              <text
                v-else
                class="i-material-symbols:account-circle auth-login-sheet__avatar-placeholder"
              />
            </view>
            <!-- #ifdef MP-WEIXIN -->
            <button
              class="auth-login-sheet__avatar-button"
              open-type="chooseAvatar"
              @chooseavatar="handleChooseAvatar"
            >
              更换头像
            </button>
            <!-- #endif -->
            <!-- #ifndef MP-WEIXIN -->
            <button class="auth-login-sheet__avatar-button" @click="handleChooseAvatarFallback">
              选择头像
            </button>
            <!-- #endif -->
          </view>

          <view class="auth-login-sheet__field">
            <view class="auth-login-sheet__label">
              昵称
            </view>
            <wd-input
              v-model="draftNickname"
              clearable
              placeholder="请输入昵称"
            />
          </view>

          <view class="auth-login-sheet__actions">
            <wd-button block hairline @click="handleCancel">
              稍后设置
            </wd-button>
            <wd-button block type="primary" :loading="isSubmitting" @click="handleConfirmProfile">
              完成登录
            </wd-button>
          </view>
        </view>
      </template>
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

  &__hero,
  &__profile {
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

  &__actions {
    display: grid;
    gap: 16rpx;
    margin-top: 32rpx;
  }

  &__avatar-row {
    display: flex;
    align-items: center;
    gap: 24rpx;
    margin-top: 12rpx;
  }

  &__avatar-preview {
    width: 132rpx;
    height: 132rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999rpx;
    background: linear-gradient(135deg, rgba(239, 178, 57, 0.2), rgba(251, 146, 60, 0.1));
    overflow: hidden;
    flex-shrink: 0;
  }

  &__avatar-image {
    width: 100%;
    height: 100%;
  }

  &__avatar-placeholder {
    color: #efb239;
    font-size: 84rpx;
    line-height: 1;
  }

  &__avatar-button {
    border: none;
    border-radius: 999rpx;
    background: #0f172a;
    color: #fff;
    font-size: 26rpx;
    font-weight: 600;
    line-height: 1;
    padding: 22rpx 28rpx;
    margin: 0;
  }

  &__avatar-button::after {
    border: none;
  }

  &__field {
    display: grid;
    gap: 14rpx;
    margin-top: 8rpx;
  }

  &__label {
    color: #334155;
    font-size: 24rpx;
    font-weight: 600;
  }
}
</style>
