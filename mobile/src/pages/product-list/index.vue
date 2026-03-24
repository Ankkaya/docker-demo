<script setup lang="ts">
/**
 * 商品列表页 - 参考 Stitch 设计稿
 */

definePage({
  name: 'product-list',
  layout: 'default',
  style: {
    navigationBarTitleText: '商品列表',
    navigationStyle: 'custom',
  },
})

const router = useRouter()

const pageTitle = ref('Onesies & Bodysuits')
const activeFilter = ref('recommended')

const filters = [
  { key: 'recommended', label: 'Recommended', sort: true },
  { key: 'sales', label: 'Sales', sort: false },
  { key: 'price', label: 'Price', sort: true },
  { key: 'new', label: 'New', sort: false },
]

const products = ref([
  {
    id: 1,
    name: 'Organic Cotton Onesie',
    price: 24,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl8d--agawjMT10fLz9P-MYMct9fh-tdwZJqASgjI7C5EonkcXkFchIfK6uur136QDkpWhCAtR5OaePOrktxvcLG7OWvsC7710vlEr0RTI7YXIhLETl9sYF6SvgfiraJ4FGiqWiXweDGHI9QwhFDVhjEYRWPG6s6OU8E29_8aQRzdQCakd3DVcEzFVsexHL7uEzE-zpp7rJjYyeHEX7wW7tZLEl2LAWa6PV6EysS_Y6VhemwfFEt25Yk74j4QgJXHl_MSFqJho8S_x',
    ratio: '3/4.5',
    offset: '',
  },
  {
    id: 2,
    name: 'Ribbed Bodysuit',
    price: 18,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDI9oLaAp9j4ZCr4y28nVdulMZhdzq6IZwU1VOfHljRaUDJoes34va-2HTbMGtbYusV1w5ghoYg3H2b7Yy4lq0mnS7zLO-z7kzq4UY5VM_BP3QwleyM3XIYlOIosfzMGTdi-HYDeIdiAarcXmleLnZkuu5gGnTtHD5qO4prfyGEGnow87zskQd612Y88iWmbeqLpM3lX9GHVoGsaSFPaUxG_EjZlq1g84XVbnAOP-zyAxwcK_QpZldk3cKQMXOhlZDAX8zrzqLy_D1T',
    ratio: '3/3.5',
    offset: 'pt-8',
  },
  {
    id: 3,
    name: 'Linen Blend Romper',
    price: 32,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLeTAH4g-5sjUNE4V0TzcjKjOyrjpxnLbvpxAwNsfd1Of85-0Uq9TbCrPYqc4O-B4R2wy33VmPABvpld9qsc6Q-DNG8YRgdhxAOafqdHW7sBBj5RmsYZAz-yzFBF6EZEtMBkCFi4ioSHA6icmptck9bpUhIV-Z8DSDlhmI6eAUUbdd3woAfr76vSlOEwRhI7VawqmszUo3wcfSOXA9R2EQKrdYd-o68xZsnbTcVC5xgirfrTJW3NS7NyEDg39AI55IJpseikU6EnZT',
    ratio: '3/3.8',
    offset: '-mt-4',
  },
  {
    id: 4,
    name: 'Quilted Sleep Suit',
    price: 45,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDeG1V5VAFIdNkM68-XowYvabFHjQG3XH27EqaJ4pdYg674mXxUdTm8xqaLLY_iNZFewa937hHjt_gTxgVCIkh_K4PnbHTdo--RKDEVTNCe2DDgZSYDnOkC9CSYUN0YwBIVTd8vGqbLLpwFCENnBKceLeX4fQvj5K6FLEZE-xg6f1IAhGamXsqcfyoccNSS4d5OPCTRHGPqIC1DIh6IhlONf6JqWw-Iuzco-PZZXtruzgscOcoYSuvPsb2LdpwGl-0IQHyEi2kBkfM4',
    ratio: '3/4.2',
    offset: '',
  },
  {
    id: 5,
    name: 'Knitted Wool Suit',
    price: 52,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATLUeSEperzYujCBv50PBwKJmWHGOfV7jMUcymGqfvP6SQizLSheMMXXCg6SYUajxafpcv6G80R6Lk5jf-iUTckvBwEUDXMqjvMIEj1jyj75d767cNGivoF5EBJWa2kiMS5vTF06Jo-GN9vrylgmgasv4iaQQLHeUH9Tm0ljBrW5InsVHyoefCUPQX907pzJvdcwTVf4dUfXTEikeKvCqrPahZjLveCRPi_k7UZEaEJS892z3-DzRWPUIo4zkXpR1Yp6OQswCtL3ds',
    ratio: '1/1',
    offset: '-mt-6',
  },
])

onLoad((options) => {
  if (options?.title) {
    pageTitle.value = String(options.title)
  }
})

function setFilter(key: string) {
  activeFilter.value = key
}

function goBack() {
  router.back()
}

function goSearch() {
  router.push({ name: 'search' })
}

function onProductClick(product: typeof products.value[number]) {
  router.push({
    name: 'product-detail',
    query: {
      id: String(product.id),
    },
  })
}

function addToCart(product: typeof products.value[number]) {
  uni.showToast({
    title: `已加入购物车: ${product.name}`,
    icon: 'success',
  })
}
</script>

<template>
  <view class="h-screen flex flex-col bg-[#f8f7f6]">
    <view class="sticky top-0 z-20 flex items-center justify-between bg-[#f8f7f6]/90 px-4 py-4 backdrop-blur-md">
      <view class="size-10 flex items-center justify-center rounded-full bg-white shadow-sm" @click="goBack">
        <wd-icon name="arrow-left" size="18" color="#334155" />
      </view>
      <text class="max-w-[220px] truncate text-lg text-slate-900 font-bold">
        {{ pageTitle }}
      </text>
      <view class="size-10 flex items-center justify-center rounded-full bg-white shadow-sm" @click="goSearch">
        <wd-icon name="search" size="18" color="#334155" />
      </view>
    </view>

    <scroll-view scroll-y class="flex-1">
      <view class="no-scrollbar flex gap-3 overflow-x-auto px-4 py-3">
        <view
          v-for="item in filters"
          :key="item.key"
          class="h-9 flex shrink-0 items-center gap-1 border rounded-full px-4"
          :class="activeFilter === item.key
            ? 'border-[#efb239] bg-[#efb239] text-white'
            : 'border-slate-200 bg-white text-slate-600'"
          @click="setFilter(item.key)"
        >
          <text class="text-sm" :class="activeFilter === item.key ? 'font-semibold' : 'font-medium'">
            {{ item.label }}
          </text>
          <wd-icon
            v-if="item.sort"
            :name="activeFilter === item.key ? 'arrow-down' : 'switch-horizontal'"
            size="14"
            :color="activeFilter === item.key ? '#fff' : '#64748b'"
          />
        </view>
      </view>

      <view class="grid grid-cols-2 gap-4 px-4 pb-24">
        <view
          v-for="product in products"
          :key="product.id"
          class="flex flex-col gap-2"
          :class="product.offset"
          @click="onProductClick(product)"
        >
          <view
            class="relative overflow-hidden border border-slate-100 rounded-2xl bg-slate-200 shadow-sm"
            :style="`aspect-ratio:${product.ratio}`"
          >
            <image :src="product.image" mode="aspectFill" class="h-full w-full" />
            <view
              class="absolute bottom-3 right-3 size-10 flex items-center justify-center rounded-full bg-[#efb239] shadow-lg"
              @click.stop="addToCart(product)"
            >
              <wd-icon name="cart" size="16" color="#fff" />
            </view>
          </view>
          <view class="px-1">
            <text class="line-clamp-1 block text-sm text-slate-800 font-semibold">
              {{ product.name }}
            </text>
            <text class="text-base text-[#efb239] font-bold">
              ${{ product.price.toFixed(2) }}
            </text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
