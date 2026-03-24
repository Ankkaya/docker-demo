<script setup lang="ts">
/**
 * 浏览历史页面 - 参考 Stitch 设计稿
 */

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

const historyGroups = ref([
  {
    label: '今天',
    items: [
      {
        id: 1,
        name: 'Petal Floral Dress',
        time: '10:32',
        price: 189,
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
      },
      {
        id: 2,
        name: 'Cotton Bib Set (3pc)',
        time: '09:15',
        price: 79,
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop',
      },
    ],
  },
  {
    label: '昨天',
    items: [
      {
        id: 3,
        name: 'Soft Leather Booties',
        time: '21:08',
        price: 128,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnbUqWacZuzAdhQaTDNQIPFCOQmDmxvCasJ3WAf-T1GGe-4iap9zN9rNBwwANgtoPhxxVranbxfO823RVrsOeIYCkQgVUnhZGLtS-ebIb6Q6zcieXcuwOW8Yckn53iF5Tc2YeJ1UcHuzpmMl8yPnD8vmvIyouBYdnGojnC0KyLHAT1PRyzqUrR3CikjxeBy8Si4oCJ5pRDeZt92m0ij7VnzHMLxCp0905o42jTHBQDffQp2JtFIfSxtgpmiL4GCjNOdFoHOJbE-WIt',
      },
      {
        id: 4,
        name: 'Knit Comfort Sweater',
        time: '18:44',
        price: 229,
        image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&h=400&fit=crop',
      },
    ],
  },
])

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

function clearHistory() {
  historyGroups.value = []
  uni.showToast({ title: '已清空历史', icon: 'none' })
}

function openProduct(item: { id: number; name: string; price: number; image: string }) {
  router.push({
    name: 'product-detail',
    query: {
      name: item.name,
      price: item.price.toFixed(2),
      image: encodeURIComponent(item.image),
    },
  })
}

function removeItem(id: number) {
  historyGroups.value = historyGroups.value
    .map(group => ({
      ...group,
      items: group.items.filter(item => item.id !== id),
    }))
    .filter(group => group.items.length > 0)
}
</script>

<template>
  <view class="history-page text-slate-900">
    <view class="sticky top-0 z-40 border-b border-[#efb239]/10 bg-white/92 backdrop-blur-md">

      <view class="overflow-x-auto px-4 whitespace-nowrap">
        <view class="flex gap-6 text-sm">
          <text class="border-b-2 border-[#efb239] pyy-3 text-[#efb239] font-bold">
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
        <view v-if="historyGroups.length === 0"
          class="mt-10 rounded-3xl border border-[#efb239]/10 bg-white/70 px-6 py-12 text-center text-slate-400">
          <text class="text-[40px] text-[#cbd5f5] leading-none" :class="getHistoryIconClass('empty')" />
          <text class="mt-3 text-sm">
            暂无浏览记录
          </text>
        </view>

        <view v-for="group in historyGroups" :key="group.label" class="mb-8">
          <view class="mb-4 flex items-center gap-2">
            <view class="size-2 rounded-full" :class="group.label === '今天' ? 'bg-[#efb239]' : 'bg-slate-300'" />
            <text class="block text-sm font-bold text-slate-900">
              {{ group.label }}
            </text>
          </view>

          <view class="grid grid-cols-2 gap-4">
            <view v-for="item in group.items" :key="item.id" class="history-card overflow-hidden"
              @click="openProduct(item)">
              <view class="relative">
                <image :src="item.image" class="history-image w-full rounded-2xl bg-[#f6efe0]" mode="aspectFill" />
                <view class="absolute right-2 top-2 size-8 flex items-center justify-center rounded-full bg-white/92"
                  @click.stop="removeItem(item.id)">
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
                  浏览于 {{ item.time }}
                </text>
              </view>
            </view>
          </view>
        </view>

        <view class="mt-2 rounded-3xl border border-[#efb239]/10 bg-[#efb239]/5 px-5 py-6 text-center">
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
