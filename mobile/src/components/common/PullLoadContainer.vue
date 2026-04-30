<script setup lang="ts">
type PullStatus = 'idle' | 'pulling' | 'ready' | 'refreshing'
type LoadMoreStatus = 'idle' | 'loading' | 'no-more'
type DisplayStatus = 'idle' | 'pulling' | 'ready' | 'refreshing'

interface ActionContext {
  done: () => void
}

interface Props {
  disabled?: boolean
  refreshing?: boolean
  loadingMore?: boolean
  hasMore?: boolean
  refreshThreshold?: number
  refreshHoldDistance?: number
  maxPullDistance?: number
  damping?: number
  lowerThreshold?: number
  scrollWithAnimation?: boolean
  headerVisibleHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  hasMore: true,
  refreshThreshold: 44,
  refreshHoldDistance: 44,
  maxPullDistance: 140,
  damping: 0.35,
  lowerThreshold: 80,
  scrollWithAnimation: false,
  headerVisibleHeight: 44,
})

const emit = defineEmits<{
  refresh: [ctx: ActionContext]
  loadMore: [ctx: ActionContext]
}>()

const pullDistance = ref(0)
const scrollTop = ref(0)
const touching = ref(false)
const pulling = ref(false)
const internalRefreshing = ref(false)
const internalLoadingMore = ref(false)
const restoringAfterRefresh = ref(false)
const restoringAfterRelease = ref(false)
const startY = ref(0)
const displayStatus = ref<DisplayStatus>('idle')
let refreshRestoreTimer: ReturnType<typeof setTimeout> | null = null
let releaseRestoreTimer: ReturnType<typeof setTimeout> | null = null

const isRefreshing = computed(() => props.refreshing ?? internalRefreshing.value)
const isLoadingMore = computed(() => props.loadingMore ?? internalLoadingMore.value)
const canPull = computed(() => !props.disabled && !isRefreshing.value)
const canLoadMore = computed(() => !props.disabled && props.hasMore && !isRefreshing.value && !isLoadingMore.value)

const pullProgress = computed(() => {
  if (!props.refreshThreshold) {
    return 0
  }

  return Math.min(1, pullDistance.value / props.refreshThreshold)
})

const pullStatus = computed<PullStatus>(() => {
  if (isRefreshing.value) {
    return 'refreshing'
  }
  if (pullDistance.value <= 0) {
    return 'idle'
  }
  if (pullDistance.value >= props.refreshThreshold) {
    return 'ready'
  }
  return 'pulling'
})

const loadMoreStatus = computed<LoadMoreStatus>(() => {
  if (isLoadingMore.value) {
    return 'loading'
  }
  if (!props.hasMore) {
    return 'no-more'
  }
  return 'idle'
})

const animated = computed(() => !touching.value)
const contentOffset = computed(() => (isRefreshing.value ? props.refreshHoldDistance : pullDistance.value))
const contentTransform = computed(() => ({
  transform: `translateY(${contentOffset.value}px)`,
  transition: animated.value ? 'transform 220ms ease' : 'none',
}))

const headerVisibleHeightPx = computed(() => props.headerVisibleHeight)
const headerOffset = computed(() => (isRefreshing.value ? 0 : contentOffset.value - headerVisibleHeightPx.value))

const headerStyle = computed(() => ({
  height: `${headerVisibleHeightPx.value}px`,
  transform: `translateY(${headerOffset.value}px)`,
  transition: animated.value ? 'transform 220ms ease, opacity 220ms ease' : 'none',
  opacity: contentOffset.value > 0 || isRefreshing.value ? 1 : 0,
}))

const isRestoring = computed(() => restoringAfterRefresh.value || restoringAfterRelease.value)
const showDefaultPullHint = computed(() => !isRestoring.value)

const footerHint = computed(() => {
  if (loadMoreStatus.value === 'loading') {
    return '正在加载更多...'
  }
  if (loadMoreStatus.value === 'no-more') {
    return '没有更多了'
  }
  return '上拉加载更多'
})

const pullHint = computed(() => {
  switch (displayStatus.value) {
    case 'ready':
      return '松手立即刷新'
    case 'refreshing':
      return '加载中...'
    case 'pulling':
      return '下拉刷新'
    default:
      return '下拉可刷新'
  }
})

function getTouchY(event: TouchEvent | any) {
  const touch = event?.touches?.[0] || event?.changedTouches?.[0]
  return typeof touch?.clientY === 'number' ? touch.clientY : 0
}

function getDampedDistance(deltaY: number) {
  if (deltaY <= 0) {
    return 0
  }

  const threshold = Math.max(props.refreshThreshold, 1)
  const damped = deltaY * props.damping

  if (damped <= threshold) {
    return Math.min(props.maxPullDistance, damped)
  }

  const extra = (damped - threshold) * 0.4
  return Math.min(props.maxPullDistance, threshold + extra)
}

function restorePull() {
  touching.value = false
  pulling.value = false
  pullDistance.value = 0
  restoringAfterRefresh.value = false
  restoringAfterRelease.value = false
  displayStatus.value = 'idle'
}

function clearReleaseRestoreTimer() {
  if (releaseRestoreTimer) {
    clearTimeout(releaseRestoreTimer)
    releaseRestoreTimer = null
  }
}

function startReleaseRestore() {
  clearReleaseRestoreTimer()
  restoringAfterRelease.value = true
  touching.value = false
  pulling.value = false
  pullDistance.value = 0

  releaseRestoreTimer = setTimeout(() => {
    restorePull()
    releaseRestoreTimer = null
  }, 220)
}

function startRefreshRestore() {
  restoringAfterRefresh.value = true
  internalRefreshing.value = false
  touching.value = false
  pulling.value = false
  pullDistance.value = 0

  refreshRestoreTimer = setTimeout(() => {
    restorePull()
    refreshRestoreTimer = null
  }, 220)
}

function finishRefresh() {
  if (refreshRestoreTimer) {
    clearTimeout(refreshRestoreTimer)
  }

  refreshRestoreTimer = setTimeout(() => {
    startRefreshRestore()
  }, 800)
}

function finishLoadMore() {
  internalLoadingMore.value = false
}

function handleTouchStart(event: TouchEvent | any) {
  if (props.disabled) {
    return
  }

  touching.value = true
  startY.value = getTouchY(event)
}

function handleTouchMove(event: TouchEvent | any) {
  if (!canPull.value) {
    return
  }

  const currentY = getTouchY(event)
  const deltaY = currentY - startY.value

  if (!pulling.value && (scrollTop.value > 0 || deltaY <= 0)) {
    return
  }

  if (deltaY <= 0) {
    pullDistance.value = 0
    pulling.value = false
    return
  }

  pulling.value = true
  pullDistance.value = getDampedDistance(deltaY)
  displayStatus.value = pullDistance.value >= props.refreshThreshold ? 'ready' : 'pulling'

  if (typeof event?.preventDefault === 'function') {
    event.preventDefault()
  }
}

function triggerRefresh() {
  internalRefreshing.value = true
  pullDistance.value = props.refreshHoldDistance
  displayStatus.value = 'refreshing'
  emit('refresh', { done: finishRefresh })
}

function handleTouchEnd() {
  touching.value = false

  if (!pulling.value) {
    return
  }

  if (pullDistance.value >= props.refreshThreshold) {
    triggerRefresh()
    pulling.value = false
    return
  }

  startReleaseRestore()
}

function handleScroll(event: any) {
  scrollTop.value = Number(event?.detail?.scrollTop ?? 0)
}

function triggerLoadMore() {
  internalLoadingMore.value = true
  emit('loadMore', { done: finishLoadMore })
}

function handleScrollToLower() {
  if (!canLoadMore.value) {
    return
  }

  triggerLoadMore()
}

watch(
  () => props.refreshing,
  (value, oldValue) => {
    if (value === true) {
      internalRefreshing.value = false
      pullDistance.value = props.refreshHoldDistance
      displayStatus.value = 'refreshing'
      return
    }

    if (oldValue === true && value === false) {
      finishRefresh()
    }
  },
)

watch(
  () => props.loadingMore,
  (value, oldValue) => {
    if (value === true) {
      internalLoadingMore.value = false
      return
    }

    if (oldValue === true && value === false) {
      finishLoadMore()
    }
  },
)

defineExpose({
  finishRefresh,
  finishLoadMore,
  restorePull,
})
</script>

<template>
  <view
    class="pull-load-container"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchEnd"
  >
    <view class="pull-load-header" :style="headerStyle">
      <slot
        name="pull"
        :distance="contentOffset"
        :progress="pullProgress"
        :status="pullStatus"
        :threshold="props.refreshThreshold"
        :maxDistance="props.maxPullDistance"
        :refreshing="isRefreshing"
      >
        <view v-if="showDefaultPullHint" class="pull-load-header__default">
          <wd-icon
            :name="displayStatus === 'ready' ? 'arrow-up' : displayStatus === 'refreshing' ? 'loading' : 'arrow-down'"
            size="16px"
            color="#b78a24"
            :class="{ 'pull-load-header__icon--spinning': displayStatus === 'refreshing' }"
          />
          <text class="pull-load-header__text">
            {{ pullHint }}
          </text>
        </view>
      </slot>
    </view>

    <scroll-view
      scroll-y
      class="pull-load-scroll"
      :scroll-with-animation="scrollWithAnimation"
      :lower-threshold="lowerThreshold"
      @scroll="handleScroll"
      @scrolltolower="handleScrollToLower"
    >
      <view class="pull-load-content" :style="contentTransform">
        <slot />
        <template v-if="!isRefreshing">
          <slot
            name="loadMore"
            :status="loadMoreStatus"
            :loadingMore="isLoadingMore"
            :hasMore="props.hasMore"
          >
            <view class="pull-load-footer">
              <wd-icon
                v-if="loadMoreStatus === 'loading'"
                name="loading"
                size="16px"
                color="#94a3b8"
                class="pull-load-header__icon--spinning"
              />
              <text class="pull-load-footer__text">
                {{ footerHint }}
              </text>
            </view>
          </slot>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.pull-load-container {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.pull-load-scroll {
  position: relative;
  z-index: 2;
  height: 100%;
}

.pull-load-content {
  min-height: 100%;
  will-change: transform;
}

.pull-load-header {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  width: 100%;
  overflow: hidden;
  pointer-events: none;
}

.pull-load-header__default {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  box-sizing: border-box;
  background: transparent;
}

.pull-load-header__text,
.pull-load-footer__text {
  font-size: 24rpx;
  color: #64748b;
  line-height: 1.4;
}

.pull-load-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 28rpx 0 36rpx;
}

.pull-load-header__icon--spinning {
  animation: pull-load-spin 0.9s linear infinite;
}

@keyframes pull-load-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
