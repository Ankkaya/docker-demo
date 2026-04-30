<script setup lang="ts">
/**
 * 浏览历史页面
 */
import PullLoadContainer from '@/components/common/PullLoadContainer.vue'

definePage({
  name: 'history',
  layout: 'default',
  style: {
    navigationBarTitleText: '浏览历史',
    navigationStyle: 'custom',
  },
  needLogin: true,
})

const router = useRouter()
const toast = useToast()
const { topAreaHeight, safeAreaInsetsBottom } = usePlatform()

type MallBrowseHistoryItem = any & {
  ratio?: string
  estimatedHeight?: number
}

const DEFAULT_HISTORY_TABS_HEIGHT = 52

const historyList = ref<MallBrowseHistoryItem[]>([])
const loading = ref(false)
const clearingHistory = ref(false)
const historyTabsHeight = ref(DEFAULT_HISTORY_TABS_HEIGHT)

const historyCount = computed(() => historyList.value.length)
const pageContentHeight = computed(() => `calc(100vh - ${topAreaHeight}px - ${safeAreaInsetsBottom}px)`)
const listAreaStyle = computed(() => ({
  height: `calc(${pageContentHeight.value} - ${historyTabsHeight.value}px)`,
}))

function measureHistoryTabsHeight() {
  nextTick(() => {
    const query = uni.createSelectorQuery()
    query
      .select('.history-tabs')
      .boundingClientRect((rect) => {
        if (rect?.height) {
          historyTabsHeight.value = Math.ceil(rect.height)
        }
      })
      .exec()
  })
}

function getCardRatio(index: number) {
  const ratios = ['3/3.9', '3/3.1', '3/3.5', '1/1', '3/3.2', '3/3.7']
  return ratios[index % ratios.length]
}

function getDisplayImage(item: MallBrowseHistoryItem) {
  if (typeof item?.mainImage === 'string' && item.mainImage) {
    return item.mainImage
  }

  if (Array.isArray(item?.images) && typeof item.images[0] === 'string' && item.images[0]) {
    return item.images[0]
  }

  const skus = Array.isArray(item?.skus) ? item.skus : []
  const defaultSku = skus.find((sku: any) => sku.isDefault) || skus[0] || null
  if (typeof defaultSku?.image === 'string' && defaultSku.image) {
    return defaultSku.image
  }

  return ''
}

function getPrice(item: MallBrowseHistoryItem) {
  const skus = Array.isArray(item?.skus) ? item.skus : []
  const defaultSku = skus.find((sku: any) => sku.isDefault) || skus[0] || null
  const price = Number(defaultSku?.salePrice ?? item?.minPrice ?? 0)
  return Number.isFinite(price) ? price : 0
}

function formatViewedLabel(value: unknown) {
  const date = value ? new Date(value as string) : null
  if (!date || Number.isNaN(date.getTime())) {
    return '最近浏览'
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

function getEstimatedHistoryHeight(item: MallBrowseHistoryItem) {
  const ratio = typeof item?.ratio === 'string' && item.ratio ? item.ratio : '3/3.6'
  const name = typeof item?.name === 'string' ? item.name : ''
  const viewedLabel = formatViewedLabel(item?.lastViewedAt)
  const [width, height] = ratio.split('/').map(value => Number(value))
  const safeWidth = width > 0 ? width : 1
  const safeHeight = height > 0 ? height : 1
  const imageHeight = (safeHeight / safeWidth) * 180
  const nameLines = Math.min(2, Math.max(1, Math.ceil(name.length / 9)))
  const infoLines = Math.min(2, Math.max(1, Math.ceil(viewedLabel.length / 16)))

  return imageHeight + nameLines * 22 + infoLines * 16 + 104
}

function normalizeHistoryItem(item: MallBrowseHistoryItem, index: number): MallBrowseHistoryItem {
  const ratio = getCardRatio(index)

  return {
    ...item,
    ratio,
    estimatedHeight: getEstimatedHistoryHeight({
      ...item,
      ratio,
    }),
  }
}

const waterfallColumns = computed(() => {
  const left: MallBrowseHistoryItem[] = []
  const right: MallBrowseHistoryItem[] = []
  let leftHeight = 0
  let rightHeight = 0

  historyList.value.forEach((item) => {
    const estimatedHeight = item.estimatedHeight || getEstimatedHistoryHeight(item)

    if (leftHeight <= rightHeight) {
      left.push(item)
      leftHeight += estimatedHeight
    }
    else {
      right.push(item)
      rightHeight += estimatedHeight
    }
  })

  return { left, right }
})

const leftColumnHistory = computed(() => waterfallColumns.value.left)
const rightColumnHistory = computed(() => waterfallColumns.value.right)

async function loadHistories() {
  loading.value = true
  try {
    const result = await (Apis.general as any).MallBrowseHistoriesController_findHistories({
      params: {
        page: 1,
        pageSize: 100,
      },
    }).send()
    const list = Array.isArray(result?.data) ? result.data : []
    historyList.value = list.map((item, index) => normalizeHistoryItem(item, index))
  }
  catch {
    historyList.value = []
  }
  finally {
    loading.value = false
  }
}

async function handleRefresh(ctx?: { done: () => void }) {
  try {
    await loadHistories()
  }
  finally {
    ctx?.done()
  }
}

function getHistoryIconClass(name: string) {
  const map: Record<string, string> = {
    empty: 'i-material-symbols:history',
    close: 'i-material-symbols:close',
  }
  return map[name] || ''
}

async function clearHistory() {
  if (!historyCount.value || clearingHistory.value) {
    return
  }

  const { confirm } = await uni.showModal({
    title: '清空历史',
    content: '确定清空全部浏览历史吗？',
    confirmText: '清空',
    confirmColor: '#efb239',
  })

  if (!confirm) {
    return
  }

  clearingHistory.value = true
  try {
    await (Apis.general as any).MallBrowseHistoriesController_clearHistories({}).send()
    historyList.value = []
    toast.success('已清空历史')
  }
  catch {
    toast.error('清空失败，请稍后重试')
  }
  finally {
    clearingHistory.value = false
  }
}

function openProduct(item: { id: number }) {
  router.push({
    name: 'product-detail',
    query: {
      id: String(item.id),
    },
  })
}

async function removeItem(id: number) {
  try {
    await (Apis.general as any).MallBrowseHistoriesController_removeHistory({
      pathParams: { productId: id },
    }).send()
    historyList.value = historyList.value.filter(item => item.id !== id)
  }
  catch {}
}

onShow(() => {
  measureHistoryTabsHeight()
  loadHistories()
})
</script>

<template>
  <view class="history-page flex flex-col overflow-hidden bg-[#f8f7f6] text-slate-900" :style="{ height: pageContentHeight }">
    <view class="history-tabs z-40 mt-px bg-white px-4 pt-3">
      <view class="history-toolbar__inner">
        <view class="history-toolbar__summary">
          <text class="history-toolbar__title">
            浏览历史
          </text>
          <text class="history-toolbar__count">
            {{ historyCount }} 件商品
          </text>
        </view>
        <view class="history-toolbar__actions">
          <view
            v-if="historyCount > 0"
            class="history-toolbar__clear"
            :class="{ 'history-toolbar__clear--disabled': clearingHistory }"
            @click="clearHistory"
          >
            {{ clearingHistory ? '清空中...' : '清空历史' }}
          </view>
        </view>
      </view>
    </view>

    <view class="min-h-0 mt-px flex-1 overflow-hidden bg-white" :style="listAreaStyle">
      <PullLoadContainer
        class="h-full"
        :loading-more="false"
        :has-more="false"
        @refresh="handleRefresh"
      >
        <template #loadMore="{ status }">
          <view v-if="historyCount > 0" class="py-6 text-center text-xs text-slate-400">
            {{ status === 'no-more' ? '没有更多了' : '上拉加载更多' }}
          </view>
        </template>

        <view class="px-4 pt-4">
          <view
            v-if="historyCount === 0"
            class="history-empty-state mt-6 border border-[#efb239]/10 rounded-3xl bg-white/80 px-6 py-12 text-center text-slate-400"
          >
            <text class="text-[40px] text-[#cbd5f5] leading-none" :class="getHistoryIconClass('empty')" />
            <text class="mt-3 block text-sm">
              暂无浏览记录
            </text>
          </view>

          <template v-else>
            <view class="flex items-start gap-3">
              <view class="min-w-0 flex flex-1 flex-col gap-4">
                <view
                  v-for="item in leftColumnHistory" :key="item.id"
                  class="history-card overflow-hidden border border-[#efb239]/8 rounded-[28rpx] bg-[linear-gradient(180deg,#fffdf9_0%,#fff8ee_100%)]"
                  @click="openProduct(item)"
                >
                  <view
                    class="history-card__image-wrap"
                    :style="`aspect-ratio:${item.ratio || '3/3.6'}`"
                  >
                    <image
                      v-if="getDisplayImage(item)"
                      :src="getDisplayImage(item)"
                      class="history-card__image"
                      mode="aspectFill"
                    />
                    <view v-else class="history-card__image-placeholder">
                      <wd-icon name="picture" size="28" color="#c7a96b" />
                    </view>
                    <view
                      class="history-card__close"
                      @click.stop="removeItem(item.id)"
                    >
                      <text class="text-[14px] text-slate-400 leading-none" :class="getHistoryIconClass('close')" />
                    </view>
                  </view>
                  <view class="p-4 pt-3">
                    <text class="line-clamp-2 block text-[28rpx] font-bold leading-[1.4]">
                      {{ item.name }}
                    </text>
                    <view class="mt-3 flex items-center gap-2">
                      <text class="text-[34rpx] text-[#efb239] font-bold leading-none">
                        ￥{{ getPrice(item).toFixed(2) }}
                      </text>
                    </view>
                    <text class="mt-2 block text-xs text-slate-400 leading-[1.5]">
                      浏览于 {{ formatViewedLabel(item.lastViewedAt) }} · {{ item.viewCount || 1 }} 次
                    </text>
                  </view>
                </view>
              </view>
              <view class="min-w-0 flex flex-1 flex-col gap-4">
                <view
                  v-for="item in rightColumnHistory" :key="item.id"
                  class="history-card overflow-hidden border border-[#efb239]/8 rounded-[28rpx] bg-[linear-gradient(180deg,#fffdf9_0%,#fff8ee_100%)]"
                  @click="openProduct(item)"
                >
                  <view
                    class="history-card__image-wrap"
                    :style="`aspect-ratio:${item.ratio || '3/3.6'}`"
                  >
                    <image
                      v-if="getDisplayImage(item)"
                      :src="getDisplayImage(item)"
                      class="history-card__image"
                      mode="aspectFill"
                    />
                    <view v-else class="history-card__image-placeholder">
                      <wd-icon name="picture" size="28" color="#c7a96b" />
                    </view>
                    <view
                      class="history-card__close"
                      @click.stop="removeItem(item.id)"
                    >
                      <text class="text-[14px] text-slate-400 leading-none" :class="getHistoryIconClass('close')" />
                    </view>
                  </view>
                  <view class="p-4 pt-3">
                    <text class="line-clamp-2 block text-[28rpx] font-bold leading-[1.4]">
                      {{ item.name }}
                    </text>
                    <view class="mt-3 flex items-center gap-2">
                      <text class="text-[34rpx] text-[#efb239] font-bold leading-none">
                        ￥{{ getPrice(item).toFixed(2) }}
                      </text>
                    </view>
                    <text class="mt-2 block text-xs text-slate-400 leading-[1.5]">
                      浏览于 {{ formatViewedLabel(item.lastViewedAt) }} · {{ item.viewCount || 1 }} 次
                    </text>
                  </view>
                </view>
              </view>
            </view>
          </template>
        </view>
      </PullLoadContainer>
    </view>
  </view>
</template>

<style scoped>
.history-page {
  background: #f8f7f6;
}

.history-toolbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding-bottom: 18rpx;
}

.history-toolbar__summary {
  min-width: 0;
  flex: 1;
}

.history-toolbar__title {
  color: #0f172a;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1;
}

.history-toolbar__count {
  margin-left: 12rpx;
  color: #64748b;
  font-size: 24rpx;
  line-height: 1.4;
}

.history-toolbar__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.history-toolbar__clear {
  color: #d69411;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1.4;
}

.history-toolbar__clear--disabled {
  opacity: 0.7;
}

.history-card {
  box-shadow:
    0 18px 36px rgba(120, 93, 47, 0.12),
    0 6px 14px rgba(120, 93, 47, 0.08);
}

.history-card__image-wrap {
  position: relative;
  width: 100%;
  height: auto;
  overflow: hidden;
  border-radius: 0;
  background: linear-gradient(135deg, #f6efe0 0%, #efe4ce 100%);
}

.history-card__image {
  display: block;
  width: 100%;
  height: 100%;
}

.history-card__image-placeholder {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5efe5 0%, #efe7d8 100%);
}

.history-card__close {
  position: absolute;
  right: 16rpx;
  top: 16rpx;
  display: flex;
  width: 52rpx;
  height: 52rpx;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 9999rpx;
  background: rgba(255, 255, 255, 0.92);
}

.history-empty-state {
  box-shadow: inset 0 0 0 1px rgba(239, 178, 57, 0.04);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
