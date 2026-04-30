<script setup lang="ts">
/**
 * 商品详情页 - 参考 Stitch 设计稿
 */

import { useCheckoutStore } from '@/store/checkoutStore'
import { useUserStore } from '@/store/userStore'
import { createQrMatrix } from '@/utils/qrcode/index'

definePage({
  name: 'product-detail',
  layout: 'default',
  style: {
    navigationBarTitleText: '商品详情',
    navigationStyle: 'custom',
  },
})

const router = useRouter()
const checkoutStore = useCheckoutStore()
const userStore = useUserStore()
const toast = useToast()

interface ProductOptionGroup {
  name: string
  values: string[]
}

interface ReviewPreview {
  id: number
  userName: string
  rating: number
  content: string | null
}

interface RelatedProduct {
  id: number
  name: string
  price: number
  image: string
}

interface NormalizedSku {
  id: number
  skuCode: string
  salePrice: number
  marketPrice: number
  image: string | null
  barcode: string | null
  isDefault: boolean
  totalStock: number
  specsMap: Record<string, string>
}

interface SkuOptionState {
  exists: boolean
  inStock: boolean
}

interface ProductHighlightItem {
  key: string
  label: string
  value: string
}

interface LoadProductDataOptions {
  preserveSelectedSpecs?: boolean
}

type QrMatrixCell = boolean

const routeProductId = ref<number | null>(null)
const loading = ref(false)
const productDetail = ref<MallProductDetailVo | null>(null)
const reviewStats = ref<{ totalCount?: number, avgRating?: number } | null>(null)
const reviewPreview = ref<ReviewPreview | null>(null)
const relatedProducts = ref<RelatedProduct[]>([])
const currentImage = ref(0)
const liked = ref(false)
const selectedSpecs = ref<Record<string, string>>({})
const lastLoadedProductId = ref<number | null>(null)
const addingToCart = ref(false)
const shareVisible = ref(false)
const savingPoster = ref(false)
const qrMatrix = ref<QrMatrixCell[][]>([])
const posterTempFilePath = ref('')
const posterCanvasWidth = 750
const posterCanvasHeight = 1180
const cartItemCount = ref(0)

const specGroups = computed<ProductOptionGroup[]>(() => {
  const list = productDetail.value?.specOptions
  return Array.isArray(list) ? list : []
})

function buildSkuSpecsMap(rawSpecs: unknown) {
  const list = Array.isArray(rawSpecs) ? rawSpecs : []
  return list.reduce((result: Record<string, string>, item: any) => {
    if (item?.name && item?.value) {
      result[item.name] = item.value
    }
    return result
  }, {})
}

function getNormalizedSkus(detail: MallProductDetailVo | null | undefined): NormalizedSku[] {
  const list = Array.isArray(detail?.skus) ? detail.skus : []
  return list.map((sku: any) => ({
    id: sku.id,
    skuCode: sku.skuCode,
    salePrice: Number(sku.salePrice || 0),
    marketPrice: Number(sku.marketPrice || 0),
    image: typeof sku.image === 'string' ? sku.image : null,
    barcode: typeof sku.barcode === 'string' ? sku.barcode : null,
    isDefault: Boolean(sku.isDefault),
    totalStock: Number(sku.totalStock || 0),
    specsMap: buildSkuSpecsMap(sku.specs),
  }))
}

const normalizedSkus = computed<NormalizedSku[]>(() => {
  return getNormalizedSkus(productDetail.value)
})

const firstSku = computed(() => normalizedSkus.value[0] || null)
const aggregateStock = computed(() => {
  return normalizedSkus.value.reduce((sum, sku) => sum + Number(sku.totalStock || 0), 0)
})

const hasSelectedAllSpecs = computed(() => {
  if (!specGroups.value.length) {
    return Boolean(firstSku.value)
  }

  return specGroups.value.every(group => Boolean(selectedSpecs.value[group.name]))
})

const gallery = computed(() => {
  const images = Array.isArray(productDetail.value?.images) ? productDetail.value?.images.filter(Boolean) : []
  if (images.length) {
    return images
  }
  if (typeof productDetail.value?.mainImage === 'string' && productDetail.value.mainImage) {
    return [productDetail.value.mainImage]
  }
  return []
})

const selectedSku = computed(() => {
  const skus = normalizedSkus.value
  if (!skus.length) {
    return null
  }

  if (!specGroups.value.length) {
    return firstSku.value
  }

  if (!hasSelectedAllSpecs.value) {
    return null
  }

  return skus.find((sku) => {
    return specGroups.value.every(group => selectedSpecs.value[group.name] === sku.specsMap[group.name])
  })
})

const displaySku = computed(() => selectedSku.value || firstSku.value)

const productName = computed(() => productDetail.value?.name || '商品详情')
const productPrice = computed(() => Number(displaySku.value?.salePrice ?? 0))
const productMarketPrice = computed(() => {
  const marketPrice = Number(displaySku.value?.marketPrice ?? 0)
  return Number.isFinite(marketPrice) && marketPrice > 0 ? marketPrice : null
})
const reviewCount = computed(() => Number(reviewStats.value?.totalCount ?? 0))
const avgRating = computed(() => Number(reviewStats.value?.avgRating ?? 5))
const totalStock = computed(() => {
  if (selectedSku.value) {
    return Number(selectedSku.value.totalStock ?? 0)
  }

  return Number(aggregateStock.value || 0)
})
const canSelectSku = computed(() => Boolean(selectedSku.value))
const hasStock = computed(() => totalStock.value > 0)
const specDisplayLabel = computed(() => (selectedSku.value ? '已选' : '默认'))
const selectedSpecSummary = computed(() => {
  if (!selectedSku.value && displaySku.value) {
    const values = specGroups.value
      .map(group => displaySku.value?.specsMap[group.name])
      .filter(Boolean)

    return values.length ? values.join(' / ') : '请选择规格'
  }

  const values = specGroups.value
    .map(group => selectedSpecs.value[group.name])
    .filter(Boolean)

  return values.length ? values.join(' / ') : '默认规格'
})
const hasReviews = computed(() => reviewCount.value > 0 && Boolean(reviewPreview.value))
const productDetailHtml = computed(() => {
  const detail = productDetail.value?.detail
  return typeof detail === 'string' && detail.trim() ? detail : ''
})
const productDescription = computed(() => {
  const description = productDetail.value?.description
  if (typeof description === 'string' && description.trim()) {
    return description.trim()
  }

  if (productDetailHtml.value) {
    return ''
  }

  return '暂无商品详情'
})
const sharePosterImage = computed(() => {
  return gallery.value[0] || productDetail.value?.mainImage || ''
})
const qrModuleCount = computed(() => qrMatrix.value.length || 1)
const qrModules = computed(() => qrMatrix.value.flat())
const cartBadgeText = computed(() => {
  const count = Number(cartItemCount.value || 0)
  if (count <= 0) {
    return ''
  }
  return count > 99 ? '99+' : String(count)
})
const productHighlights = computed(() => {
  const items: ProductHighlightItem[] = []

  if (productDetail.value?.brand?.name) {
    items.push({
      key: 'brand',
      label: '品牌',
      value: productDetail.value.brand.name,
    })
  }

  if (productDetail.value?.category?.name) {
    items.push({
      key: 'category',
      label: '分类',
      value: productDetail.value.category.name,
    })
  }

  if (productDetail.value?.unit?.name) {
    items.push({
      key: 'unit',
      label: '单位',
      value: productDetail.value.unit.name,
    })
  }

  items.push({
    key: 'stock',
    label: '库存',
    value: totalStock.value > 0 ? `${totalStock.value}` : '暂时缺货',
  })

  return items.slice(0, 4)
})

function getHighlightValueClass(item: ProductHighlightItem) {
  return 'text-slate-900'
}

function getHighlightIconClass(item: ProductHighlightItem) {
  switch (item.key) {
    case 'brand':
      return 'i-material-symbols:storefront-outline-rounded'
    case 'category':
      return 'i-material-symbols:grid-view-outline-rounded'
    case 'unit':
      return 'i-material-symbols:straighten-outline-rounded'
    case 'stock':
      return 'i-material-symbols:inventory-2-outline'
    default:
      return 'i-material-symbols:info-outline-rounded'
  }
}

function getReviewInitial(name: string) {
  const normalized = name.trim()
  if (!normalized) {
    return '匿'
  }

  return normalized.slice(0, 1).toUpperCase()
}

function resolveSharePath() {
  const productId = Number(routeProductId.value || productDetail.value?.id || 0)
  return `/pages/product-detail/index?id=${productId}`
}

function resolveShareQrContent() {
  const path = resolveSharePath()

  // H5 下优先生成可直接访问的完整链接，其余端退回页面路径文本。
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/#${path}`
  }

  return path
}

function buildQrMatrix(content: string) {
  return createQrMatrix(content) as QrMatrixCell[][]
}

function openSharePoster() {
  if (!routeProductId.value && !productDetail.value?.id) {
    return
  }

  qrMatrix.value = buildQrMatrix(resolveShareQrContent())
  shareVisible.value = true
}

function closeSharePoster() {
  shareVisible.value = false
}

function previewGalleryImage(index = 0) {
  if (!gallery.value.length) {
    return
  }

  const current = gallery.value[index] || gallery.value[0]
  uni.previewImage({
    urls: gallery.value,
    current,
  })
}

function drawRoundRectPath(
  ctx: UniApp.CanvasContext,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2))
  ctx.beginPath()
  ctx.moveTo(x + safeRadius, y)
  ctx.lineTo(x + width - safeRadius, y)
  ctx.arcTo(x + width, y, x + width, y + safeRadius, safeRadius)
  ctx.lineTo(x + width, y + height - safeRadius)
  ctx.arcTo(x + width, y + height, x + width - safeRadius, y + height, safeRadius)
  ctx.lineTo(x + safeRadius, y + height)
  ctx.arcTo(x, y + height, x, y + height - safeRadius, safeRadius)
  ctx.lineTo(x, y + safeRadius)
  ctx.arcTo(x, y, x + safeRadius, y, safeRadius)
  ctx.closePath()
}

function wrapCanvasText(
  ctx: UniApp.CanvasContext,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const content = text.trim()
  if (!content) {
    return []
  }

  const lines: string[] = []
  let current = ''

  for (const char of content) {
    const nextLine = `${current}${char}`
    if (ctx.measureText(nextLine).width <= maxWidth) {
      current = nextLine
      continue
    }

    if (current) {
      lines.push(current)
      current = char
    }
    else {
      lines.push(char)
      current = ''
    }

    if (lines.length >= maxLines) {
      break
    }
  }

  if (lines.length < maxLines && current) {
    lines.push(current)
  }

  if (lines.length > maxLines) {
    lines.length = maxLines
  }

  if (lines.length === maxLines && current) {
    const lastIndex = lines.length - 1
    let lastLine = lines[lastIndex]
    while (lastLine && ctx.measureText(`${lastLine}...`).width > maxWidth) {
      lastLine = lastLine.slice(0, -1)
    }
    lines[lastIndex] = `${lastLine || ''}...`
  }

  return lines
}

async function getLocalImagePath(src?: string | null) {
  if (!src) {
    return ''
  }

  if (!/^https?:\/\//i.test(src) && !/^wxfile:\/\//i.test(src) && !/^file:\/\//i.test(src) && !/^\//.test(src)) {
    return src
  }

  return await new Promise<string>((resolve) => {
    uni.getImageInfo({
      src,
      success: (res) => resolve(res.path),
      fail: () => resolve(src),
    })
  })
}

function drawQrMatrixToCanvas(
  ctx: UniApp.CanvasContext,
  matrix: QrMatrixCell[][],
  x: number,
  y: number,
  size: number,
) {
  const moduleCount = matrix.length
  if (!moduleCount) {
    return
  }

  const quietZone = 4
  const totalModules = moduleCount + quietZone * 2
  const moduleSize = size / totalModules

  ctx.setFillStyle('#ffffff')
  ctx.fillRect(x, y, size, size)

  ctx.setFillStyle('#111827')
  matrix.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (!cell) {
        return
      }

      ctx.fillRect(
        x + (colIndex + quietZone) * moduleSize,
        y + (rowIndex + quietZone) * moduleSize,
        Math.ceil(moduleSize),
        Math.ceil(moduleSize),
      )
    })
  })
}

async function createPosterTempFile() {
  if (!productDetail.value) {
    return ''
  }

  const instance = getCurrentInstance()
  const ctx = uni.createCanvasContext('product-share-poster-canvas', instance)
  const localImage = await getLocalImagePath(sharePosterImage.value)
  const posterNameLines = (() => {
    ctx.setFontSize(34)
    return wrapCanvasText(ctx, productName.value, 560, 2)
  })()

  ctx.setFillStyle('#f5f1e8')
  ctx.fillRect(0, 0, posterCanvasWidth, posterCanvasHeight)

  ctx.setFillStyle('#ffffff')
  drawRoundRectPath(ctx, 36, 36, 678, 1088, 32)
  ctx.fill()

  if (localImage) {
    ctx.save()
    drawRoundRectPath(ctx, 72, 72, 606, 606, 28)
    ctx.clip()
    ctx.drawImage(localImage, 72, 72, 606, 606)
    ctx.restore()
  }
  else {
    ctx.setFillStyle('#f6e8c9')
    drawRoundRectPath(ctx, 72, 72, 606, 606, 28)
    ctx.fill()
    ctx.setFillStyle('#d0a85b')
    ctx.setFontSize(40)
    ctx.fillText('商品图片', 290, 390)
  }

  ctx.setFillStyle('#0f172a')
  ctx.setFontSize(34)
  posterNameLines.forEach((line, index) => {
    ctx.fillText(line, 72, 740 + index * 48)
  })

  ctx.setFillStyle('#efb239')
  ctx.setFontSize(44)
  ctx.fillText(`¥${productPrice.value.toFixed(2)}`, 72, 860)

  ctx.setFillStyle('#94a3b8')
  ctx.setFontSize(24)
  ctx.fillText('长按识别二维码，查看商品详情', 72, 912)

  ctx.setFillStyle('#fffaf0')
  drawRoundRectPath(ctx, 72, 948, 606, 140, 24)
  ctx.fill()

  drawQrMatrixToCanvas(ctx, qrMatrix.value, 96, 972, 92)

  ctx.setFillStyle('#0f172a')
  ctx.setFontSize(26)
  ctx.fillText('BabyWhale Kids', 212, 1018)

  ctx.setFillStyle('#64748b')
  ctx.setFontSize(22)
  ctx.fillText('扫码打开当前商品页', 212, 1060)

  return await new Promise<string>((resolve, reject) => {
    ctx.draw(false, () => {
      uni.canvasToTempFilePath({
        canvasId: 'product-share-poster-canvas',
        width: posterCanvasWidth,
        height: posterCanvasHeight,
        destWidth: posterCanvasWidth,
        destHeight: posterCanvasHeight,
        success: (res) => resolve(res.tempFilePath),
        fail: reject,
      }, instance)
    })
  })
}

async function ensurePosterTempFile() {
  if (posterTempFilePath.value) {
    return posterTempFilePath.value
  }

  const tempFilePath = await createPosterTempFile()
  posterTempFilePath.value = tempFilePath
  return tempFilePath
}

async function savePosterToAlbum() {
  if (savingPoster.value) {
    return
  }

  savingPoster.value = true

  try {
    const filePath = await ensurePosterTempFile()

    await new Promise<void>((resolve, reject) => {
      uni.saveImageToPhotosAlbum({
        filePath,
        success: () => resolve(),
        fail: (error) => reject(error),
      })
    })

    toast.success('已保存到相册')
  }
  catch {
    uni.showModal({
      title: '保存失败',
      content: '请确认已授权保存到相册权限后重试',
      showCancel: false,
    })
  }
  finally {
    savingPoster.value = false
  }
}

function syncSelectedSpecs(
  detail: MallProductDetailVo,
  preferredSpecs: Record<string, string> = {},
) {
  const groups = Array.isArray(detail.specOptions) ? detail.specOptions : []
  const skus = getNormalizedSkus(detail)
  const preferredSku = skus.find((sku) => {
    return groups.every((group) => {
      const selectedValue = preferredSpecs[group.name]
      return selectedValue && sku.specsMap[group.name] === selectedValue
    })
  })

  if (preferredSku && preferredSku.totalStock > 0) {
    const nextSelected: Record<string, string> = {}
    for (const group of groups) {
      nextSelected[group.name] = preferredSku.specsMap[group.name] || group.values[0] || ''
    }
    selectedSpecs.value = nextSelected
    return
  }

  const fallbackSku = skus[0]
  if (!fallbackSku || fallbackSku.totalStock <= 0) {
    selectedSpecs.value = {}
    return
  }

  const nextSelected: Record<string, string> = {}

  for (const group of groups) {
    const fromSku = fallbackSku?.specsMap?.[group.name]
    nextSelected[group.name] = fromSku || group.values[0] || ''
  }

  selectedSpecs.value = nextSelected
}

function getCandidateSkus(groupName: string, value: string) {
  return normalizedSkus.value.filter((sku) => {
    if (sku.specsMap[groupName] !== value) {
      return false
    }

    return specGroups.value.every((group) => {
      if (group.name === groupName) {
        return true
      }

      const selectedValue = selectedSpecs.value[group.name]
      return !selectedValue || sku.specsMap[group.name] === selectedValue
    })
  })
}

function getOptionState(groupName: string, value: string): SkuOptionState {
  const candidates = getCandidateSkus(groupName, value)
  return {
    exists: candidates.length > 0,
    inStock: candidates.some(item => Number(item.totalStock || 0) > 0),
  }
}

async function loadReviewStats(productId: number) {
  try {
    const response = await (Apis.general as any).MallReviewsController_getProductReviewStats({
      pathParams: { id: productId },
    }).send()
    reviewStats.value = response || null
  }
  catch {
    reviewStats.value = null
  }
}

async function loadReviewPreview(productId: number) {
  try {
    const response = await (Apis.general as any).MallReviewsController_findProductReviews({
      pathParams: { id: productId },
      params: {
        page: 1,
        pageSize: 1,
      },
    }).send()

    const item = Array.isArray(response?.list) ? response.list[0] : null
    reviewPreview.value = item
      ? {
          id: item.id,
          userName: item.userName || '匿名用户',
          rating: Number(item.rating || 5),
          content: item.content || '用户暂无文字评价',
        }
      : null
  }
  catch {
    reviewPreview.value = null
  }
}

async function loadRelatedProducts(productId: number) {
  try {
    const response = await Apis.general.MallProductsController_findHotProducts({
      params: {
        limit: 6,
      },
    }).send()

    const list = Array.isArray(response?.list) ? response.list : []
    relatedProducts.value = list
      .filter(item => item.id !== productId)
      .slice(0, 4)
      .map(item => ({
        id: item.id,
        name: item.name,
        price: Number(item.minPrice || 0),
        image: typeof item.mainImage === 'string' ? item.mainImage : '',
      }))
  }
  catch {
    relatedProducts.value = []
  }
}

async function loadCartCount() {
  if (!userStore.isLoggedIn) {
    cartItemCount.value = 0
    return
  }

  try {
    const response = await (Apis.general as any).MallCartController_findCurrentUserCart({}).send()
    cartItemCount.value = Number(response?.stats?.totalCount || 0)
  }
  catch {
    cartItemCount.value = 0
  }
}

async function loadProductData(productId: number, options: LoadProductDataOptions = {}) {
  loading.value = true
  const previousSelectedSpecs = options.preserveSelectedSpecs
    ? { ...selectedSpecs.value }
    : {}

  try {
    const detail = await Apis.general.MallProductsController_findProductDetail({
      pathParams: {
        id: productId,
      },
    }).send()

    productDetail.value = detail
    liked.value = Boolean(detail?.isFavorite)
    syncSelectedSpecs(detail, previousSelectedSpecs)

    await Promise.all([
      loadReviewStats(productId),
      loadReviewPreview(productId),
      loadRelatedProducts(productId),
    ])
  }
  catch (error: any) {
    productDetail.value = null
    reviewStats.value = null
    reviewPreview.value = null
    relatedProducts.value = []
  }
  finally {
    loading.value = false
  }
}

function syncRouteState(options?: Record<string, any>, forceLoad = false) {
  const nextOptions = options || {}
  const nextProductId = nextOptions.id ? Number(nextOptions.id) : null
  routeProductId.value = nextProductId && !Number.isNaN(nextProductId) ? nextProductId : null

  if (!routeProductId.value) {
    return
  }

  if (forceLoad || lastLoadedProductId.value !== routeProductId.value || !productDetail.value) {
    lastLoadedProductId.value = routeProductId.value
    loadProductData(routeProductId.value)
  }
}

onLoad((options) => {
  syncRouteState(options as Record<string, any>, true)
})

function onImageChange(e: any) {
  currentImage.value = e.detail.current
}

function selectSpec(groupName: string, value: string) {
  const optionState = getOptionState(groupName, value)
  if (!optionState.exists || !optionState.inStock) {
    return
  }

  selectedSpecs.value = {
    ...selectedSpecs.value,
    [groupName]: value,
  }
}

function toggleLike() {
  if (!routeProductId.value) {
    return
  }

  if (!userStore.isLoggedIn) {
    userStore.openAuthPopup()
    return
  }

  const nextLiked = !liked.value
  liked.value = nextLiked

  const request = nextLiked
    ? (Apis.general as any).MallFavoritesController_createFavorite({
        data: { productId: routeProductId.value },
      })
    : (Apis.general as any).MallFavoritesController_removeFavorite({
        pathParams: { productId: routeProductId.value },
      })

  request.send()
    .then(() => {
      if (productDetail.value) {
        productDetail.value.isFavorite = nextLiked
      }
      toast.success(nextLiked ? '已收藏' : '已取消收藏')
    })
    .catch(() => {
      liked.value = !nextLiked
    })
}

async function addToCart() {
  if (!canSelectSku.value) {
    toast.info('请先选择规格')
    return
  }

  if (!hasStock.value) {
    toast.error('当前规格暂无库存')
    return
  }

  if (!userStore.isLoggedIn) {
    userStore.openAuthPopup()
    return
  }

  if (!selectedSku.value || addingToCart.value) {
    return
  }

  addingToCart.value = true
  try {
    await (Apis.general as any).MallCartController_addToCart({
      data: {
        skuId: selectedSku.value.id,
        quantity: 1,
      },
    }).send()
    await loadCartCount()
    if (routeProductId.value) {
      await loadProductData(routeProductId.value, { preserveSelectedSpecs: true })
    }
    toast.success('已加入购物车')
  }
  catch { }
  finally {
    addingToCart.value = false
  }
}

function openCart() {
  router.pushTab({
    name: 'cart',
  })
}

function buyNow() {
  if (!canSelectSku.value || !selectedSku.value) {
    toast.info('请先选择规格')
    return
  }

  if (!hasStock.value) {
    toast.error('当前规格暂不可购买')
    return
  }

  if (!userStore.isLoggedIn) {
    userStore.openAuthPopup()
    return
  }

  checkoutStore.setPayload({
    source: 'product-detail',
    items: [{
      productId: Number(routeProductId.value || productDetail.value?.id || 0),
      skuId: selectedSku.value.id,
      productName: productName.value,
      specText: selectedSpecSummary.value,
      image: selectedSku.value.image || gallery.value[0] || '',
      price: productPrice.value,
      quantity: 1,
    }],
    totalAmount: productPrice.value,
  })

  router.push({
    name: 'order-payment',
    query: {
      source: 'product-detail',
    },
  })
}

function openRelated(item: typeof relatedProducts.value[number]) {
  router.push({
    name: 'product-detail',
    params: {
      id: String(item.id),
    },
  })
}

function openReviewList() {
  if (!routeProductId.value) {
    return
  }

  router.push({
    name: 'review-list',
    params: {
      id: String(routeProductId.value),
    },
  })
}

watch(
  () => routeProductId.value,
  () => {
    posterTempFilePath.value = ''
    qrMatrix.value = []
  },
)

watch(
  [productName, productPrice, sharePosterImage],
  () => {
    posterTempFilePath.value = ''
  },
)

onShareAppMessage(() => ({
  title: productName.value || '商品详情',
  path: resolveSharePath(),
  imageUrl: sharePosterImage.value || undefined,
}))

onShow(() => {
  loadCartCount()
})

watch(
  () => userStore.isLoggedIn,
  (loggedIn) => {
    if (!loggedIn) {
      cartItemCount.value = 0
      return
    }

    loadCartCount()
  },
)
</script>

<template>
  <view class="flex flex-col bg-[#f8f7f6] text-slate-900">
    <scroll-view scroll-y class="flex-1">
      <view class="pb-28">
        <view class="relative h-[640rpx] w-full overflow-hidden bg-[#efb239]/10">
          <swiper
            class="h-full w-full" :indicator-dots="false" :autoplay="false" :circular="true"
            @change="onImageChange"
          >
            <swiper-item v-for="(img, idx) in gallery" :key="idx">
              <image :src="img" mode="aspectFill" class="h-full w-full" @click="previewGalleryImage(idx)" />
            </swiper-item>
          </swiper>

          <view class="absolute bottom-6 left-1/2 flex gap-2 -translate-x-1/2">
            <view
              v-for="(_, idx) in gallery" :key="idx" class="size-2 rounded-full"
              :class="idx === currentImage ? 'bg-[#efb239]' : 'bg-[#efb239]/30'"
            />
          </view>

          <view class="absolute right-4 top-6 flex flex-col gap-3">
            <view
              class="size-10 flex items-center justify-center rounded-full bg-white/90 shadow-md"
              @click="toggleLike"
            >
              <wd-icon :name="liked ? 'heart-filled' : 'heart'" size="18" :color="liked ? '#f43f5e' : '#64748b'" />
            </view>
            <view
              class="size-10 flex items-center justify-center rounded-full bg-white/90 shadow-md"
              @click="openSharePoster"
            >
              <wd-icon name="share" size="18" color="#64748b" />
            </view>
          </view>
        </view>

        <view class="px-5 pt-6">
          <view class="mb-2 flex items-center gap-1">
            <view class="flex text-[#efb239]">
              <wd-icon v-for="n in 5" :key="n" name="star" size="14" color="#efb239" />
            </view>
            <text class="text-xs text-slate-500 font-medium">
              （{{ reviewCount }} 条评价 · {{ avgRating.toFixed(1) }} 分）
            </text>
          </view>
          <text class="mb-2 block text-2xl text-slate-900 font-bold leading-tight">
            {{ productName }}
          </text>
          <view class="flex items-end gap-3">
            <text class="text-3xl text-[#efb239] font-bold">
              ¥{{ productPrice.toFixed(2) }}
            </text>
            <text v-if="productMarketPrice" class="pb-1 text-sm text-slate-400 line-through">
              ¥{{ productMarketPrice.toFixed(2) }}
            </text>
          </view>
          <view v-if="displaySku" class="mt-3 flex items-center gap-3 text-xs">
            <text v-if="canSelectSku" class="rounded-full bg-[#efb239]/10 px-3 py-1 text-[#c98500] font-semibold">
              {{ specDisplayLabel }} {{ selectedSpecSummary }}
            </text>
            <text :class="totalStock > 0 ? 'text-emerald-600' : 'text-rose-500'">
              {{ totalStock > 0 ? `库存 ${totalStock}` : '暂时缺货' }}
            </text>
            <text v-if="displaySku.barcode" class="text-slate-400">
              条码 {{ displaySku.barcode }}
            </text>
          </view>
        </view>

        <view v-if="specGroups.length" class="mt-8 px-5">
          <view v-for="group in specGroups" :key="group.name" class="mt-6">
            <text class="mb-3 block text-sm text-slate-600 font-bold uppercase">
              {{ group.name }}:
              <text class="text-slate-900">
                {{ selectedSpecs[group.name] || '请选择' }}
              </text>
            </text>
            <view class="flex flex-wrap gap-2">
              <template v-for="value in group.values" :key="`${group.name}-${value}`">
                <view
                  class="border rounded-lg px-4 py-3 text-center text-sm font-medium" :class="[
                    selectedSpecs[group.name] === value
                      ? 'border-2 border-[#efb239] bg-[#efb239]/10 text-slate-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-700',
                    !getOptionState(group.name, value).exists || !getOptionState(group.name, value).inStock
                      ? 'cursor-not-allowed opacity-35'
                      : '',
                  ]" @click="selectSpec(group.name, value)"
                >
                  {{ value }}
                </view>
              </template>
            </view>
          </view>
        </view>

        <view v-if="productHighlights.length" class="mt-10 px-5">
          <view class="mb-4 flex items-center gap-3">
            <view class="h-5 w-1 rounded-full bg-[#efb239]" />
            <text class="text-xl text-slate-900 font-bold tracking-[0.02em]">
              商品信息
            </text>
          </view>
          <view class="grid grid-cols-2 gap-3">
            <view
              v-for="item in productHighlights" :key="item.key"
              class="flex items-center gap-3 overflow-hidden rounded-2xl p-4 shadow-sm"
            >
              <view
                class="size-10 flex shrink-0 items-center justify-center rounded-full bg-[#efb239]/10 text-[#efb239]"
              >
                <view class="text-[20px]" :class="getHighlightIconClass(item)" />
              </view>
              <view class="min-w-0 flex-1">
                <text class="block text-xs text-slate-400 font-medium">
                  {{ item.label }}
                </text>
                <text
                  class="product-highlight-value mt-1 block text-sm font-bold leading-6"
                  :class="getHighlightValueClass(item)"
                >
                  {{ item.value }}
                </text>
              </view>
            </view>
          </view>
        </view>

        <view class="mt-10 px-5">
          <view class="mb-4 flex items-center gap-3">
            <view class="h-5 w-1 rounded-full bg-[#efb239]" />
            <text class="text-xl text-slate-900 font-bold tracking-[0.02em]">
              商品详情
            </text>
          </view>
          <view class="rounded-xl bg-[#efb239]/8 p-6">
            <text v-if="productDescription" class="mb-4 block text-sm text-slate-600 leading-6">
              {{ productDescription }}
            </text>
            <view v-if="productDetailHtml" class="overflow-hidden rounded-xl bg-[#efb239]/8">
              <mp-html :content="productDetailHtml" />
            </view>
          </view>
        </view>

        <view class="mt-10 px-5">
          <view class="mb-4">
            <view class="flex items-center justify-between">
              <view class="flex items-center gap-3">
                <view class="h-5 w-1 rounded-full bg-[#efb239]" />
                <text class="text-xl text-slate-900 font-bold tracking-[0.02em]">
                  商品评价
                </text>
              </view>
              <text class="text-sm text-[#efb239] font-bold" @click="openReviewList">
                查看全部
              </text>
            </view>
            <text class="mt-2 block text-sm text-slate-500">
              {{ reviewCount > 0 ? `来自 ${reviewCount} 位用户的真实评价` : '暂无用户评价' }}
            </text>
          </view>
          <view v-if="hasReviews" class="border border-slate-100 rounded-xl bg-white p-4 shadow-sm">
            <view class="mb-2 flex items-center justify-between">
              <view class="flex items-center gap-2">
                <view
                  class="size-8 flex items-center justify-center rounded-full bg-[#efb239]/20 text-xs text-[#efb239] font-bold"
                >
                  {{ getReviewInitial(reviewPreview?.userName || '匿名用户') }}
                </view>
                <text class="text-sm text-slate-900 font-bold">
                  {{ reviewPreview?.userName || '暂时还没有评价' }}
                </text>
              </view>
              <view class="flex">
                <wd-icon
                  v-for="n in 5" :key="n" name="star" size="14"
                  :color="n <= Number(reviewPreview?.rating || 5) ? '#efb239' : '#e2e8f0'"
                />
              </view>
            </view>
            <text class="text-sm text-slate-600 leading-6">
              {{ reviewPreview?.content || '当前商品还没有公开评价，欢迎成为第一位购买并评价的用户。' }}
            </text>
          </view>
          <view
            v-else
            class="border border-[#efb239]/30 rounded-xl border-dashed bg-white px-5 py-6 text-center shadow-sm"
          >
            <text class="block text-base text-slate-900 font-bold">
              暂无评价
            </text>
            <text class="mt-2 block text-sm text-slate-500 leading-6">
              还没有用户评价这件商品，欢迎购买后提交第一个真实评价。
            </text>
          </view>
        </view>

        <view v-if="relatedProducts.length" class="mt-10">
          <text class="mb-4 block px-5 text-xl text-slate-900 font-bold">
            相关推荐
          </text>
          <scroll-view scroll-x class="no-scrollbar box-border whitespace-nowrap px-5 pb-4">
            <view
              v-for="(item, index) in relatedProducts" :key="item.id"
              class="inline-block w-[280rpx]"
              :class="index === relatedProducts.length - 1 ? '' : 'mr-4'"
              @click="openRelated(item)"
            >
              <image :src="item.image" mode="aspectFill" class="h-[280rpx] w-[280rpx] rounded-lg bg-slate-200" />
              <text class="line-clamp-1 mt-2 block text-xs text-slate-900 font-bold">
                {{ item.name }}
              </text>
              <text class="text-sm text-[#efb239] font-bold">
                ¥{{ item.price.toFixed(2) }}
              </text>
            </view>
          </scroll-view>
        </view>
      </view>
    </scroll-view>

    <view
      class="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-4 border-t border-slate-100 bg-white/95 p-4 pb-6 backdrop-blur-md"
    >
      <view class="product-detail-cart-entry" @click="openCart">
        <view class="product-detail-cart-entry__icon-wrap">
          <text class="i-material-symbols:shopping-cart-outline-rounded product-detail-cart-entry__icon" />
          <view v-if="cartBadgeText" class="product-detail-cart-entry__badge">
            {{ cartBadgeText }}
          </view>
        </view>
        <text class="product-detail-cart-entry__label">
          购物车
        </text>
      </view>
      <view class="flex flex-1 gap-3">
        <view
          v-if="hasStock" class="flex-1 border-[3px] border-[#efb239] rounded-xl bg-white py-3 text-center text-sm text-[#efb239] font-bold shadow-[inset_0_0_0_1px_rgba(239,178,57,0.24)] transition"

          @click="addToCart"
        >
          {{ addingToCart ? '加入中...' : '加入购物车' }}
        </view>
        <view
          class="flex-[1.5] rounded-xl py-3 text-center text-sm font-bold transition"
          :class="hasStock ? 'bg-[#efb239] text-white' : 'bg-slate-200 text-slate-400'" @click="buyNow"
        >
          {{ hasStock ? '立即购买' : '暂无库存' }}
        </view>
      </view>
    </view>

    <view v-if="shareVisible" class="product-share-mask">
      <view class="product-share-mask__backdrop" @click="closeSharePoster" />
      <view class="product-share-mask__body">
        <view class="product-share-poster">
          <view class="product-share-poster__image">
            <image v-if="sharePosterImage" :src="sharePosterImage" mode="aspectFill" class="h-full w-full" />
            <view v-else class="product-share-poster__image-placeholder">
              <wd-icon name="picture" size="40" color="#c5a35c" />
            </view>
          </view>
          <view class="product-share-poster__content">
            <text class="product-share-poster__name">
              {{ productName }}
            </text>
            <text class="product-share-poster__price">
              ¥{{ productPrice.toFixed(2) }}
            </text>
          </view>
          <view class="product-share-poster__footer">
            <view
              class="product-share-poster__qr"
              :style="{ gridTemplateColumns: `repeat(${qrModuleCount}, 1fr)` }"
            >
              <view
                v-for="(cell, index) in qrModules"
                :key="index"
                class="product-share-poster__qr-cell"
                :class="cell ? 'product-share-poster__qr-cell--dark' : 'product-share-poster__qr-cell--light'"
              />
            </view>
            <view class="product-share-poster__tips">
              <text class="product-share-poster__brand">BabyWhale Kids</text>
              <text class="product-share-poster__tip">扫码查看该商品页面</text>
            </view>
          </view>
        </view>
      </view>
      <view class="product-share-actions">
        <!-- #ifdef MP-WEIXIN -->
        <button class="product-share-actions__item product-share-actions__item--button" open-type="share">
          <view class="product-share-actions__icon product-share-actions__icon--primary">
            <wd-icon name="share" size="22" color="#ffffff" />
          </view>
          <text class="product-share-actions__label">
            转发
          </text>
        </button>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <button class="product-share-actions__item product-share-actions__item--button" @click="toast.info('当前环境暂不支持微信转发')">
          <view class="product-share-actions__icon product-share-actions__icon--primary">
            <wd-icon name="share" size="22" color="#ffffff" />
          </view>
          <text class="product-share-actions__label">
            转发
          </text>
        </button>
        <!-- #endif -->
        <button class="product-share-actions__item product-share-actions__item--button" @click="savePosterToAlbum">
          <view class="product-share-actions__icon">
            <wd-icon :name="savingPoster ? 'loading' : 'download'" size="22" color="#475569" :class="{ 'product-share-actions__icon--spinning': savingPoster }" />
          </view>
          <text class="product-share-actions__label">
            {{ savingPoster ? '保存中' : '保存' }}
          </text>
        </button>
        <button class="product-share-actions__item product-share-actions__item--button" @click="closeSharePoster">
          <view class="product-share-actions__icon">
            <wd-icon name="close" size="22" color="#475569" />
          </view>
          <text class="product-share-actions__label">
            取消
          </text>
        </button>
      </view>
      <canvas
        canvas-id="product-share-poster-canvas"
        class="product-share-poster__canvas"
        :style="{ width: `${posterCanvasWidth}px`, height: `${posterCanvasHeight}px` }"
      />
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

.product-highlight-value {
  display: -webkit-box;
  overflow: hidden;
  word-break: break-all;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.product-detail-cart-entry {
  display: flex;
  width: 108rpx;
  flex: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.product-detail-cart-entry__icon-wrap {
  position: relative;
  display: flex;
  height: 76rpx;
  width: 76rpx;
  align-items: center;
  justify-content: center;
}

.product-detail-cart-entry__icon {
  color: #334155;
  font-size: 46rpx;
  line-height: 1;
}

.product-detail-cart-entry__badge {
  position: absolute;
  top: -6rpx;
  right: -10rpx;
  min-width: 34rpx;
  padding: 0 8rpx;
  border-radius: 9999rpx;
  background: #ef4444;
  box-shadow: 0 6rpx 18rpx rgba(239, 68, 68, 0.24);
  color: #fff;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 34rpx;
  text-align: center;
}

.product-detail-cart-entry__label {
  color: #475569;
  font-size: 22rpx;
  line-height: 1.2;
}

.product-share-mask {
  position: fixed;
  inset: 0;
  z-index: 140;
}

.product-share-mask__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.58);
}

.product-share-mask__body {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 220rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 72rpx 40rpx 32rpx;
}

.product-share-poster {
  width: 620rpx;
  max-width: 100%;
  overflow: hidden;
  border-radius: 36rpx;
  background: #fff;
  box-shadow: 0 24rpx 80rpx rgba(15, 23, 42, 0.2);
}

.product-share-poster__image {
  height: 620rpx;
  overflow: hidden;
  background: linear-gradient(135deg, #fff5df 0%, #f7e2b1 100%);
}

.product-share-poster__image-placeholder {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
}

.product-share-poster__content {
  padding: 32rpx 32rpx 16rpx;
}

.product-share-poster__name {
  display: -webkit-box;
  overflow: hidden;
  color: #0f172a;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.product-share-poster__price {
  margin-top: 18rpx;
  display: block;
  color: #efb239;
  font-size: 42rpx;
  font-weight: 700;
}

.product-share-poster__footer {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin: 0 32rpx 32rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: #fff9ef;
}

.product-share-poster__qr {
  display: grid;
  flex: none;
  width: 168rpx;
  height: 168rpx;
  padding: 12rpx;
  box-sizing: border-box;
  background: #fff;
}

.product-share-poster__qr-cell {
  width: 100%;
  height: 100%;
}

.product-share-poster__qr-cell--dark {
  background: #111827;
}

.product-share-poster__qr-cell--light {
  background: #fff;
}

.product-share-poster__tips {
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10rpx;
}

.product-share-poster__brand {
  color: #0f172a;
  font-size: 30rpx;
  font-weight: 700;
}

.product-share-poster__tip {
  color: #64748b;
  font-size: 24rpx;
  line-height: 1.5;
}

.product-share-actions {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 48rpx;
  z-index: 2;
  display: flex;
  justify-content: center;
  gap: 44rpx;
  padding: 0 40rpx;
}

.product-share-actions__item {
  display: flex;
  min-width: 120rpx;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
  border: 0;
  background: transparent;
  padding: 0;
}

.product-share-actions__item--button::after {
  border: 0;
}

.product-share-actions__icon {
  display: flex;
  height: 92rpx;
  width: 92rpx;
  align-items: center;
  justify-content: center;
  border-radius: 9999rpx;
  background: #fff;
  box-shadow: 0 12rpx 32rpx rgba(15, 23, 42, 0.14);
}

.product-share-actions__icon--primary {
  background: #efb239;
}

.product-share-actions__label {
  color: #fff;
  font-size: 24rpx;
  font-weight: 600;
  line-height: 1.4;
}

.product-share-actions__icon--spinning {
  animation: product-share-spin 0.9s linear infinite;
}

.product-share-poster__canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  opacity: 0;
  pointer-events: none;
}

@keyframes product-share-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
