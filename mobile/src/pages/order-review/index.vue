<script setup lang="ts">
/**
 * 多商品订单评价页
 */
import { uploadReviewImage } from '@/api/file'

definePage({
  name: 'order-review',
  layout: 'default',
  style: {
    navigationBarTitleText: '订单评价',
    navigationStyle: 'custom',
  },
  needLogin: true,
})

interface ReviewFormItem {
  orderItemId: number
  productId: number
  name: string
  spec: string
  image: string
  rating: number
  content: string
  isAnonymous: boolean
  images: Array<{
    key: string
    url: string
  }>
  uploading: boolean
}

const router = useRouter()
const toast = useToast()
const routeOrderId = ref(0)
const loading = ref(false)
const submitting = ref(false)
const orderNo = ref('')
const items = ref<ReviewFormItem[]>([])
const loadError = ref('')

const canSubmit = computed(() => {
  return items.value.length > 0 && items.value.every(item => item.rating >= 1 && !item.uploading)
})

function formatSpecs(specs: Record<string, string> | Array<{ name?: string, value?: string }>) {
  if (Array.isArray(specs)) {
    const values = specs
      .map((item) => {
        if (!item?.name || !item?.value) {
          return ''
        }
        return `${item.name}: ${item.value}`
      })
      .filter(Boolean)

    return values.length ? values.join(' / ') : '默认规格'
  }

  const entries = Object.entries(specs || {})
  if (!entries.length) {
    return '默认规格'
  }
  return entries.map(([key, value]) => `${key}: ${value}`).join(' / ')
}

function goBack() {
  router.back()
}

async function loadOrder() {
  if (!routeOrderId.value) {
    return
  }

  loading.value = true
  loadError.value = ''

  try {
    const detail = await (Apis.general as any).MallOrdersController_findOrderDetail({
      pathParams: { id: routeOrderId.value },
    }).send()

    orderNo.value = detail?.orderNo || ''
    const pendingItems = Array.isArray(detail?.items)
      ? detail.items.filter((item: any) => item?.canReview)
      : []

    items.value = pendingItems.map((item: any) => ({
      orderItemId: Number(item.orderItemId || 0),
      productId: Number(item.productId || 0),
      name: item.productName || '未命名商品',
      spec: formatSpecs(item.specs || {}),
      image: item.image || '',
      rating: 5,
      content: '',
      isAnonymous: false,
      images: [],
      uploading: false,
    }))

    if (!items.value.length) {
      loadError.value = '当前订单没有待评价商品'
    }
  }
  catch (error: any) {
    loadError.value = error?.message || '加载订单失败'
  }
  finally {
    loading.value = false
  }
}

function setRating(item: ReviewFormItem, rating: number) {
  item.rating = rating
}

async function chooseImages(item: ReviewFormItem) {
  if (item.uploading) {
    return
  }

  const remain = 9 - item.images.length
  if (remain <= 0) {
    toast.error('最多上传9张图片')
    return
  }

  try {
    const result = await new Promise<UniApp.ChooseImageSuccessCallbackResult>((resolve, reject) => {
      uni.chooseImage({
        count: remain,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: resolve,
        fail: reject,
      })
    })

    const filePaths = result.tempFilePaths || []
    if (!filePaths.length) {
      return
    }

    item.uploading = true
    uni.showLoading({ title: '上传中...', mask: true })
    const uploaded = await Promise.all(filePaths.map(path => uploadReviewImage(path)))
    item.images = [
      ...item.images,
      ...uploaded.map(file => ({
        key: file.objectKey || file.url,
        url: file.url,
      })),
    ].slice(0, 9)
  }
  catch (error: any) {
    const errMsg = String(error?.errMsg || error?.message || '')
    if (!errMsg.includes('cancel')) {
      toast.error(error?.message || '图片上传失败')
    }
  }
  finally {
    item.uploading = false
    uni.hideLoading()
  }
}

function removeImage(item: ReviewFormItem, index: number) {
  item.images.splice(index, 1)
}

function previewImages(images: string[], current: string) {
  if (!images.length) {
    return
  }

  uni.previewImage({
    urls: images,
    current,
  })
}

function previewUploadedImages(images: ReviewFormItem['images'], current: string) {
  const urls = images.map(item => item.url).filter(Boolean)
  if (!urls.length) {
    return
  }

  previewImages(urls, current)
}

async function submitReviews() {
  if (!routeOrderId.value || !canSubmit.value || submitting.value) {
    return
  }

  submitting.value = true
  try {
    await alovaInstance.Post('/mall/reviews', {
      items: items.value.map(item => ({
        orderItemId: item.orderItemId,
        rating: item.rating,
        content: item.content.trim() || undefined,
        images: item.images.map(image => image.key),
        isAnonymous: item.isAnonymous,
      })),
    }).send()

    toast.success('评价提交成功')
    setTimeout(() => {
      router.replace({
        name: 'order-detail',
        params: { id: String(routeOrderId.value) },
      })
    }, 500)
  }
  catch {
  }
  finally {
    submitting.value = false
  }
}

onLoad((options) => {
  routeOrderId.value = Number(options?.id || 0)
  if (!routeOrderId.value) {
    loadError.value = '缺少订单ID'
    return
  }

  loadOrder()
})
</script>

<template>
  <view class="min-h-screen bg-[#f8f7f6] text-slate-900">
    <scroll-view scroll-y class="h-screen">
      <view class="px-4 pb-36 pt-4">
        <view class="rounded-[28rpx] from-[#efb239]/12 to-white bg-gradient-to-b p-5">
          <text class="block text-[38rpx] font-bold">
            订单评价
          </text>
          <text class="mt-2 block text-[24rpx] text-slate-500">
            {{ orderNo ? `订单号 ${orderNo}` : '请对本次购买的商品进行评价' }}
          </text>
        </view>

        <view v-if="loading" class="mt-4 rounded-3xl bg-white px-6 py-16 text-center text-sm text-slate-400">
          正在加载订单信息...
        </view>

        <view v-else-if="loadError" class="mt-4 rounded-3xl bg-white px-6 py-16 text-center">
          <text class="block text-base font-bold">
            暂无法评价
          </text>
          <text class="mt-2 block text-sm text-slate-500 leading-6">
            {{ loadError }}
          </text>
          <view class="mt-5 inline-flex rounded-full bg-[#efb239] px-5 py-2 text-sm text-white font-semibold" @click="goBack">
            返回订单
          </view>
        </view>

        <view v-else class="mt-4 space-y-4">
          <view v-for="item in items" :key="item.orderItemId" class="rounded-3xl bg-white p-4 shadow-sm">
            <view class="flex gap-3">
              <image :src="item.image" class="size-20 shrink-0 rounded-2xl bg-[#f5efe5]" mode="aspectFill" />
              <view class="min-w-0 flex-1">
                <text class="line-clamp-2 block text-sm font-semibold">
                  {{ item.name }}
                </text>
                <text class="mt-1 block text-xs text-slate-400">
                  {{ item.spec }}
                </text>

                <view class="mt-3 flex items-center gap-1">
                  <text class="mr-2 text-xs text-slate-500">
                    商品评分
                  </text>
                  <wd-icon
                    v-for="star in 5" :key="star" name="star" size="18"
                    :color="star <= item.rating ? '#efb239' : '#e2e8f0'"
                    @click="setRating(item, star)"
                  />
                </view>
              </view>
            </view>

            <view class="mt-4 rounded-2xl bg-[#faf8f4] px-4 py-3">
              <textarea
                v-model="item.content"
                class="h-[160rpx] w-full text-sm text-slate-700 leading-6"
                maxlength="1000"
                placeholder="分享商品是否符合预期、物流体验、使用感受等"
              />
              <view class="mt-2 text-right text-[22rpx] text-slate-400">
                {{ item.content.length }}/1000
              </view>
            </view>

            <view class="mt-4">
              <view class="mb-2 flex items-center justify-between">
                <text class="text-xs text-slate-500 font-semibold">
                  晒图评价
                </text>
                <text class="text-[22rpx] text-slate-400">
                  最多 9 张
                </text>
              </view>

              <view class="flex flex-wrap gap-2">
                <view
                  v-for="(image, index) in item.images" :key="`${image.key}-${index}`"
                  class="relative h-[160rpx] w-[160rpx] overflow-hidden rounded-2xl bg-slate-100"
                >
                  <image :src="image.url" mode="aspectFill" class="h-full w-full" @click="previewUploadedImages(item.images, image.url)" />
                  <view
                    class="absolute right-2 top-2 size-6 flex items-center justify-center rounded-full bg-black/55 text-white"
                    @click.stop="removeImage(item, index)"
                  >
                    <text class="i-material-symbols:close text-[14px]" />
                  </view>
                </view>

                <view
                  v-if="item.images.length < 9"
                  class="h-[160rpx] w-[160rpx] flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#efb239]/30 bg-[#fffaf2] text-[#c98500]"
                  @click="chooseImages(item)"
                >
                  <text class="i-material-symbols:add-a-photo-outline-rounded text-[26px]" />
                  <text class="mt-1 text-[22rpx]">
                    {{ item.uploading ? '上传中...' : '添加图片' }}
                  </text>
                </view>
              </view>
            </view>

            <view class="mt-4 flex items-center justify-between rounded-2xl bg-[#faf8f4] px-4 py-3">
              <text class="text-sm text-slate-600">
                匿名评价
              </text>
              <wd-switch v-model="item.isAnonymous" active-color="#efb239" />
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="!loading && items.length > 0 && !loadError" class="fixed bottom-0 left-0 right-0 z-30 border-t border-[#efb239]/10 bg-white/95 px-4 pb-6 pt-3 backdrop-blur-md">
      <view class="mb-2 flex items-center justify-between text-xs text-slate-500">
        <text>共 {{ items.length }} 件待评价商品</text>
        <text>提交后需后台审核公开</text>
      </view>
      <view
        class="rounded-full py-3 text-center text-base font-bold"
        :class="canSubmit ? 'bg-[#efb239] text-slate-900 shadow-[0_14px_28px_rgba(239,178,57,0.2)]' : 'bg-slate-200 text-slate-400'"
        @click="submitReviews"
      >
        {{ submitting ? '提交中...' : '提交评价' }}
      </view>
    </view>
  </view>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
