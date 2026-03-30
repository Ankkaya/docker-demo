<script setup lang="ts">
/**
 * 浏览历史页面 - 参考 Stitch 设计稿
 */

type MallBrowseHistoryItem = any

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
const historyList = ref<MallBrowseHistoryItem[]>([])
const loading = ref(false)

const historyGroups = computed(() => {
  const groups = new Map<string, Array<MallBrowseHistoryItem & { time: string, image: string, price: number }>>()

  for (const item of historyList.value) {
    const date = new Date(item.lastViewedAt)
    const label = getDateLabel(date)
    const groupItems = groups.get(label) || []
    groupItems.push({
      ...item,
      time: formatTime(date),
      image: item.mainImage || '',
      price: Number(item.minPrice || 0),
    })
    groups.set(label, groupItems)
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }))
})

function formatTime(date: Date) {
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${hours}:${minutes}`
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
}

function getDateLabel(date: Date) {
  const now = new Date()
  const yesterday = new Date()
  yesterday.setDate(now.getDate() - 1)

  if (isSameDay(date, now)) {
    return '今天'
  }
  if (isSameDay(date, yesterday)) {
    return '昨天'
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}-${day}`
}

async function loadHistories() {
  loading.value = true
  try {
    const result = await (Apis.general as any).MallBrowseHistoriesController_findHistories({
      params: {
        page: 1,
        pageSize: 100,
      },
    }).send()
    historyList.value = Array.isArray(result?.data) ? result.data : []
  }
  catch {
    historyList.value = []
  }
  finally {
    loading.value = false
  }
}

function getHistoryIconClass(name: string) {
  const map: Record<string, string> = {
    back: 'i-material-symbols:arrow-back',
    clear: 'i-material-symbols:delete-sweep',
    empty: 'i-material-symbols:history',
    close: 'i-material-symbols:close',
  }
  return map[name] || ''
}

function goBack() {
  router.back()
}

async function clearHistory() {
  try {
    await (Apis.general as any).MallBrowseHistoriesController_clearHistories({}).send()
    historyList.value = []
    uni.showToast({ title: '已清空历史', icon: 'none' })
  }
  catch {}
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
  loadHistories()
})
</script>

<template>
  <view class="history-page text-slate-900">
    <view class="sticky top-0 z-40 border-b border-[#efb239]/10 bg-white/92 backdrop-blur-md">
      <view class="flex items-center justify-end px-4 pb-2 pt-3">
        <view class="rounded-full bg-[#efb239]/10 px-3 py-1 text-xs text-[#c98500] font-semibold" @click="clearHistory">
          清空历史
        </view>
      </view>

      <view class="overflow-x-auto whitespace-nowrap px-4">
        <view class="flex gap-6 text-sm">
          <text class="pyy-3 border-b-2 border-[#efb239] text-[#efb239] font-bold">
            全部商品
          </text>
          <text class="pb-3 text-slate-500">
            童装
          </text>
          <text class="pb-3 text-slate-500">
            配饰
          </text>
          <text class="pb-3 text-slate-500">
            用品
          </text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="pb-20">
      <view class="px-4 pt-4">
        <view v-if="loading" class="mt-8 text-center text-sm text-slate-400">
          加载中...
        </view>

        <view
          v-if="historyGroups.length === 0"
          class="mt-10 border border-[#efb239]/10 rounded-3xl bg-white/70 px-6 py-12 text-center text-slate-400"
        >
          <text class="text-[40px] text-[#cbd5f5] leading-none" :class="getHistoryIconClass('empty')" />
          <text class="mt-3 text-sm">
            暂无浏览记录
          </text>
        </view>

        <view v-for="group in historyGroups" :key="group.label" class="mb-8">
          <view class="mb-4 flex items-center gap-2">
            <view class="size-2 rounded-full" :class="group.label === '今天' ? 'bg-[#efb239]' : 'bg-slate-300'" />
            <text class="block text-sm text-slate-900 font-bold">
              {{ group.label }}
            </text>
          </view>

          <view class="grid grid-cols-2 gap-4">
            <view
              v-for="item in group.items" :key="item.id" class="history-card overflow-hidden"
              @click="openProduct(item)"
            >
              <view class="relative">
                <image :src="item.image" class="history-image w-full rounded-2xl bg-[#f6efe0]" mode="aspectFill" />
                <view
                  class="absolute right-2 top-2 size-8 flex items-center justify-center rounded-full bg-white/92"
                  @click.stop="removeItem(item.id)"
                >
                  <text class="text-[16px] text-slate-400 leading-none" :class="getHistoryIconClass('close')" />
                </view>
              </view>
              <view class="px-1 pt-2">
                <text class="line-clamp-1 block text-sm font-semibold">
                  {{ item.name }}
                </text>
                <text class="mt-1 block text-sm text-[#efb239] font-bold">
                  ￥{{ item.price.toFixed(2) }}
                </text>
                <text class="mt-0.5 block text-xs text-slate-400">
                  浏览于 {{ item.time }} · {{ item.viewCount }} 次
                </text>
              </view>
            </view>
          </view>
        </view>

        <view class="mt-2 border border-[#efb239]/10 rounded-3xl bg-[#efb239]/5 px-5 py-6 text-center">
          <text class="text-sm text-slate-500 italic">
            把喜欢的风格留下，下次更快找到它
          </text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
.history-page {
  background:
    linear-gradient(180deg, #f8f7f6 0%, #f8f7f6 24%, #f2eee7 100%);
}

.history-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-image {
  aspect-ratio: 4 / 5;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
