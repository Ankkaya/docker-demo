<script setup lang="ts">
/**
 * 商品详情页 - 参考 Stitch 设计稿
 */

definePage({
  name: 'product-detail',
  layout: 'default',
  style: {
    navigationBarTitleText: '商品详情',
    navigationStyle: 'custom',
  },
})

const router = useRouter()

const product = ref({
  id: 1,
  name: 'Honey Bear Organic Cotton Romper',
  price: 42,
  reviews: 128,
  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAWaIaKjBwQgnbqplCXR4IQaNVbY0Vo3c9uUBVT5LuEItWSV28FTXuLsiVMUAXu4uWDGXv3F84NECLPsn39bFAXUvZ6jUyrUSdqJ5BtPa48qrrn7gXXImrZoCExrvk4xVDi8KwNVvsqPJbPXWOvEZ_mHxPN_PUG7mdRgJcVt_HJd3lDUveM9HUWBsRQY9UZbgBI6AAMQB4u8ahwd1Tegb07jThalGq4Em-KrAeilUgvtiW-1CwPsZsCcJ274YVJ0Y5CsRKXadyY_xA',
  desc: 'Crafted from GOTS-certified 100% organic cotton, this breathable romper ensures your little one stays cozy all day. Featuring easy-snap buttons for quick changes and a dreamy hand-drawn honey bear print.',
})

const gallery = ref([
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBAWaIaKjBwQgnbqplCXR4IQaNVbY0Vo3c9uUBVT5LuEItWSV28FTXuLsiVMUAXu4uWDGXv3F84NECLPsn39bFAXUvZ6jUyrUSdqJ5BtPa48qrrn7gXXImrZoCExrvk4xVDi8KwNVvsqPJbPXWOvEZ_mHxPN_PUG7mdRgJcVt_HJd3lDUveM9HUWBsRQY9UZbgBI6AAMQB4u8ahwd1Tegb07jThalGq4Em-KrAeilUgvtiW-1CwPsZsCcJ274YVJ0Y5CsRKXadyY_xA',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCCqsSH1yxGDxm_7ntdANF_J8MqgdkM9OJ41mhSho-scPHH_X6oNPHkjzcPbLSwPiMcMI0g7AIA4qDtmlV5QCw01Iinfah-fmNaByoY_ckPPAirmHvWFc2uUG47FLr3XPXU2PaZY7C2gp09jp8CnGrLrOVw-Nr8wR-k0FSrMkugmhuUbSB1O2PCQ7DrWhyhbJZuSppth3ZaCskOXLT9FFIOYTx1fkAYJugA7HYPUSTNXDtbbsaNSxiJhK83OTpB86A45HeFCL2TN4zW',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAnbUqWacZuzAdhQaTDNQIPFCOQmDmxvCasJ3WAf-T1GGe-4iap9zN9rNBwwANgtoPhxxVranbxfO823RVrsOeIYCkQgVUnhZGLtS-ebIb6Q6zcieXcuwOW8Yckn53iF5Tc2YeJ1UcHuzpmMl8yPnD8vmvIyouBYdnGojnC0KyLHAT1PRyzqUrR3CikjxeBy8Si4oCJ5pRDeZt92m0ij7VnzHMLxCp0905o42jTHBQDffQp2JtFIfSxtgpmiL4GCjNOdFoHOJbE-WIt',
])

const currentImage = ref(0)
const liked = ref(true)

const colors = ref([
  { key: 'ochre', label: 'Soft Ochre', color: '#efb239' },
  { key: 'sage', label: 'Sage', color: '#d9e5d6' },
  { key: 'beige', label: 'Beige', color: '#e3dad5' },
  { key: 'blue', label: 'Dusty Blue', color: '#b8c0cc' },
])
const sizes = ref(['0-3m', '3-6m', '6-12m', '12-18m'])

const activeColor = ref('ochre')
const activeSize = ref('6-12m')

const relatedProducts = ref([
  {
    id: 101,
    name: 'Cozy Knit Bonnet',
    price: 18,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCqsSH1yxGDxm_7ntdANF_J8MqgdkM9OJ41mhSho-scPHH_X6oNPHkjzcPbLSwPiMcMI0g7AIA4qDtmlV5QCw01Iinfah-fmNaByoY_ckPPAirmHvWFc2uUG47FLr3XPXU2PaZY7C2gp09jp8CnGrLrOVw-Nr8wR-k0FSrMkugmhuUbSB1O2PCQ7DrWhyhbJZuSppth3ZaCskOXLT9FFIOYTx1fkAYJugA7HYPUSTNXDtbbsaNSxiJhK83OTpB86A45HeFCL2TN4zW',
  },
  {
    id: 102,
    name: 'Soft Leather Booties',
    price: 24,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnbUqWacZuzAdhQaTDNQIPFCOQmDmxvCasJ3WAf-T1GGe-4iap9zN9rNBwwANgtoPhxxVranbxfO823RVrsOeIYCkQgVUnhZGLtS-ebIb6Q6zcieXcuwOW8Yckn53iF5Tc2YeJ1UcHuzpmMl8yPnD8vmvIyouBYdnGojnC0KyLHAT1PRyzqUrR3CikjxeBy8Si4oCJ5pRDeZt92m0ij7VnzHMLxCp0905o42jTHBQDffQp2JtFIfSxtgpmiL4GCjNOdFoHOJbE-WIt',
  },
  {
    id: 103,
    name: 'Bear Face Bib',
    price: 12,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1ydsREgCbcVIB4u-A2UtFJNyTZknJmlBZfynjhbuSR0whp7yLu-xHa3xPJldrXgCafU4EtKtnCdrKN6uHOciQotpVRHXvk6VBbd2s6LqvKsuVETllub1LOxhUajfmtxu6R2lj4CzIlmiWXRkA2Fl8N8p86Kgwvth_OhDm3H3HkyOeOvBv5Cl1Rqd5By59un4wOIPFM0AUGN1QLyuGa_rg2xZk3aXb8VTKVZCa6jmjm5aP2jEX7WoGbPqGzvRuH1mwn7ozDEaS3k_K',
  },
])

onLoad((options) => {
  if (options?.name)
    product.value.name = String(options.name)
  if (options?.price) {
    const p = Number(options.price)
    if (!Number.isNaN(p))
      product.value.price = p
  }
  if (options?.image) {
    const img = decodeURIComponent(String(options.image))
    product.value.image = img
    gallery.value = [img, ...gallery.value.filter(url => url !== img)]
  }
})

function goBack() {
  router.back()
}

function goCart() {
  router.push({ name: 'cart' })
}

function onImageChange(e: any) {
  currentImage.value = e.detail.current
}

function toggleLike() {
  liked.value = !liked.value
}

function addToCart() {
  uni.showToast({ title: '已加入购物车', icon: 'success' })
}

function buyNow() {
  uni.showToast({ title: '立即购买开发中', icon: 'none' })
}

function openRelated(item: typeof relatedProducts.value[number]) {
  router.push({
    name: 'product-detail',
    query: {
      name: item.name,
      price: item.price.toFixed(2),
      image: encodeURIComponent(item.image),
    },
  })
}
</script>

<template>
  <view class="h-screen flex flex-col bg-[#f8f7f6] text-slate-900">

    <scroll-view scroll-y class="flex-1">
      <view class="pb-28">
        <view class="relative h-[640rpx] w-full overflow-hidden bg-[#efb239]/10">
          <swiper class="h-full w-full" :indicator-dots="false" :autoplay="false" :circular="true"
            @change="onImageChange">
            <swiper-item v-for="(img, idx) in gallery" :key="idx">
              <image :src="img" mode="aspectFill" class="h-full w-full" />
            </swiper-item>
          </swiper>

          <view class="absolute bottom-6 left-1/2 flex gap-2 -translate-x-1/2">
            <view v-for="(_, idx) in gallery" :key="idx" class="size-2 rounded-full"
              :class="idx === currentImage ? 'bg-[#efb239]' : 'bg-[#efb239]/30'" />
          </view>

          <view
            class="absolute right-4 top-6 size-10 flex items-center justify-center rounded-full bg-white/90 shadow-md"
            @click="toggleLike">
            <wd-icon :name="liked ? 'favorite' : 'favorite_border'" size="18" :color="liked ? '#f43f5e' : '#64748b'" />
          </view>
        </view>

        <view class="px-5 pt-6">
          <view class="mb-2 flex items-center gap-1">
            <view class="flex text-[#efb239]">
              <wd-icon v-for="n in 5" :key="n" name="star" size="14" color="#efb239" />
            </view>
            <text class="text-xs text-slate-500 font-medium">
              ({{ product.reviews }} Reviews)
            </text>
          </view>
          <text class="mb-2 block text-2xl text-slate-900 font-bold leading-tight">
            {{ product.name }}
          </text>
          <text class="text-3xl text-[#efb239] font-bold">
            ${{ product.price.toFixed(2) }}
          </text>
        </view>

        <view class="mt-8 px-5">
          <view class="mt-6">
            <text class="mb-3 block text-sm text-slate-600 font-bold uppercase">
              Color: <text class="text-slate-900">
                {{colors.find(c => c.key === activeColor)?.label}}
              </text>
            </text>
            <view class="flex gap-3">
              <view v-for="color in colors" :key="color.key" class="size-10 rounded-full"
                :style="`background-color:${color.color};`"
                :class="activeColor === color.key ? 'ring-2 ring-[#efb239] ring-offset-2' : ''"
                @click="activeColor = color.key" />
            </view>
          </view>

          <view>
            <view class="mb-3 flex items-center justify-between">
              <text class="text-sm text-slate-600 font-bold uppercase">
                Size: <text class="text-slate-900">
                  {{ activeSize }}
                </text>
              </text>
              <text class="text-xs text-[#efb239] font-bold underline">
                Size Guide
              </text>
            </view>
            <view class="grid grid-cols-4 gap-2">
              <view v-for="size in sizes" :key="size" class="border rounded-lg py-3 text-center text-sm font-medium"
                :class="activeSize === size ? 'border-2 border-[#efb239] bg-[#efb239]/10 text-slate-900 font-bold' : 'border-slate-200 bg-white text-slate-700'"
                @click="activeSize = size">
                {{ size }}
              </view>
            </view>
          </view>
        </view>

        <view class="mt-10 px-5">
          <view class="rounded-xl bg-[#efb239]/8 p-6">
            <view class="mb-3 flex items-center gap-2">
              <wd-icon name="description" size="20" color="#efb239" />
              <text class="text-lg text-slate-900 font-bold">
                The Details
              </text>
            </view>
            <text class="text-sm text-slate-600 leading-6">
              {{ product.desc }}
            </text>
            <view class="grid grid-cols-2 mt-4 gap-4 text-xs text-slate-700 font-medium">
              <view class="flex items-center gap-2">
                <wd-icon name="eco" size="16" color="#efb239" />
                100% Organic
              </view>
              <view class="flex items-center gap-2">
                <wd-icon name="local_laundry_service" size="16" color="#efb239" />
                Machine Washable
              </view>
            </view>
          </view>
        </view>

        <view class="mt-10 px-5">
          <view class="mb-4 flex items-end justify-between">
            <view>
              <text class="block text-xl text-slate-900 font-bold">
                Parent Reviews
              </text>
              <text class="text-sm text-slate-500">
                Based on {{ product.reviews }} verified buyers
              </text>
            </view>
            <text class="text-sm text-[#efb239] font-bold">
              See All
            </text>
          </view>
          <view class="border border-slate-100 rounded-xl bg-white p-4 shadow-sm">
            <view class="mb-2 flex items-center justify-between">
              <view class="flex items-center gap-2">
                <view
                  class="size-8 flex items-center justify-center rounded-full bg-[#efb239]/20 text-xs text-[#efb239] font-bold">
                  EL
                </view>
                <text class="text-sm text-slate-900 font-bold">
                  Emma L.
                </text>
              </view>
              <view class="flex">
                <wd-icon v-for="n in 5" :key="n" name="star" size="14" color="#efb239" />
              </view>
            </view>
            <text class="text-sm text-slate-600 leading-6">
              The softest fabric I have ever felt for my baby. It washes well and did not shrink at all.
            </text>
          </view>
        </view>

        <view class="mt-10">
          <text class="mb-4 block px-5 text-xl text-slate-900 font-bold">
            Complete the Look
          </text>
          <scroll-view scroll-x class="no-scrollbar w-full whitespace-nowrap px-5 pb-4">
            <view v-for="item in relatedProducts" :key="item.id" class="mr-4 inline-block w-[280rpx]"
              @click="openRelated(item)">
              <image :src="item.image" mode="aspectFill" class="h-[280rpx] w-[280rpx] rounded-lg bg-slate-200" />
              <text class="line-clamp-1 mt-2 block text-xs text-slate-900 font-bold">
                {{ item.name }}
              </text>
              <text class="text-sm text-[#efb239] font-bold">
                ${{ item.price.toFixed(2) }}
              </text>
            </view>
          </scroll-view>
        </view>
      </view>
    </scroll-view>

    <view
      class="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-4 border-t border-slate-100 bg-white/95 p-4 pb-6 backdrop-blur-md">
      <view class="flex flex-col items-center justify-center text-slate-500">
        <wd-icon name="support_agent" size="18" color="#64748b" />
        <text class="mt-1 text-[10px] font-bold">
          Help
        </text>
      </view>
      <view class="h-10 w-px bg-slate-200" />
      <view class="flex flex-1 gap-3">
        <view class="flex-1 border-2 border-[#efb239] rounded-xl py-3 text-center text-sm text-[#efb239] font-bold"
          @click="addToCart">
          Add to Cart
        </view>
        <view class="flex-[1.5] rounded-xl bg-[#efb239] py-3 text-center text-sm text-white font-bold" @click="buyNow">
          Buy Now
        </view>
      </view>
    </view>
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
