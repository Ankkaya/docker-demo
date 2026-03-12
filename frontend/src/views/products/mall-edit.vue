<template>
  <div class="p-4">
    <n-card title="商城信息">
      <n-alert type="info" class="mb-4">
        这里维护商城展示信息。保存后，商城将优先使用这里的名称、详情、图片和价格，不再跟随进销存商品档案一起变化。
      </n-alert>

      <n-form :model="formData" label-placement="left" label-width="100">
        <n-grid :cols="3" :x-gap="24">
          <n-grid-item>
            <n-form-item label="商城上架">
              <n-switch v-model:value="formData.mallEnabled" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item span="2">
            <n-form-item label="商城名称">
              <n-input v-model:value="formData.name" placeholder="默认带出进销存商品名称" />
            </n-form-item>
          </n-grid-item>
        </n-grid>

        <n-form-item label="商城简述">
          <n-input v-model:value="formData.description" type="textarea" :rows="3" placeholder="默认带出商品描述" />
        </n-form-item>

        <n-grid :cols="3" :x-gap="24">
          <n-grid-item>
            <n-form-item label="商城主图">
              <n-upload
                v-model:file-list="mainImageList"
                list-type="image-card"
                :max="1"
                accept="image/*"
                :custom-request="handleMainImageUpload"
                @change="handleMainImageChange"
              >
                <n-button>上传主图</n-button>
              </n-upload>
            </n-form-item>
          </n-grid-item>
          <n-grid-item span="2">
            <n-form-item label="商城相册">
              <n-upload
                v-model:file-list="imagesList"
                list-type="image-card"
                :max="9"
                multiple
                accept="image/*"
                :custom-request="handleImagesUpload"
                @change="handleImagesChange"
              >
                <n-button>上传图片</n-button>
              </n-upload>
            </n-form-item>
          </n-grid-item>
        </n-grid>

        <n-form-item label="商城详情">
          <n-input v-model:value="formData.detail" type="textarea" :rows="10" placeholder="默认带出商品详情" />
        </n-form-item>
      </n-form>

      <n-card title="商城SKU价格" class="mt-4">
        <n-data-table :columns="skuColumns" :data="skuList" :pagination="false" />
      </n-card>

      <n-space justify="center" class="mt-6">
        <n-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</n-button>
        <n-button @click="router.back()">取消</n-button>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NImage, NInput, NInputNumber, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { getProductMallInfo, updateProductMallInfo } from '@/api/product'
import { uploadFile } from '@/api/file'
import type { Product, ProductSku } from '@/types/product'

interface MallSkuForm {
  skuId: number
  skuCode: string
  specs: ProductSku['specs']
  baseSalePrice: number
  baseMarketPrice?: number
  salePrice?: number
  marketPrice?: number
  image?: string
}

const route = useRoute()
const router = useRouter()
const message = useMessage()

const productId = computed(() => Number(route.params.id))
const submitLoading = ref(false)
const mainImageList = ref<any[]>([])
const imagesList = ref<any[]>([])
const skuList = reactive<MallSkuForm[]>([])

const formData = reactive({
  mallEnabled: false,
  name: '',
  description: '',
  detail: '',
  mainImage: '',
  images: [] as string[],
})

const skuColumns = computed<DataTableColumns<MallSkuForm>>(() => [
  {
    title: 'SKU编码',
    key: 'skuCode',
    width: 150,
  },
  {
    title: '规格',
    key: 'specs',
    render: (row) => row.specs?.map((s) => `${s.name}:${s.value}`).join(', ') || '-',
  },
  {
    title: '进销存售价',
    key: 'baseSalePrice',
    width: 110,
    render: (row) => `¥${Number(row.baseSalePrice || 0).toFixed(2)}`,
  },
  {
    title: '商城售价',
    key: 'salePrice',
    width: 130,
    render: (row) => h(NInputNumber, {
      value: row.salePrice,
      min: 0,
      precision: 2,
      placeholder: String(row.baseSalePrice ?? ''),
      onUpdateValue: (value: number | null) => {
        row.salePrice = value ?? undefined
      },
    }),
  },
  {
    title: '商城市场价',
    key: 'marketPrice',
    width: 150,
    render: (row) => h(NInputNumber, {
      value: row.marketPrice,
      min: 0,
      precision: 2,
      placeholder: String(row.baseMarketPrice ?? ''),
      onUpdateValue: (value: number | null) => {
        row.marketPrice = value ?? undefined
      },
    }),
  },
  {
    title: '商城图片',
    key: 'image',
    width: 100,
    render: (row) => h(NImage, {
      width: 48,
      height: 48,
      objectFit: 'cover',
      src: row.image || '/placeholder.png',
      fallbackSrc: '/placeholder.png',
    }),
  },
  {
    title: '图片地址',
    key: 'imageInput',
    width: 220,
    render: (row) => h(NInput, {
      value: row.image,
      placeholder: '留空则使用进销存SKU图片',
      onUpdateValue: (value: string) => {
        row.image = value || undefined
      },
    }),
  },
])

const handleMainImageUpload = async ({ file, onFinish, onError }: any) => {
  try {
    const result = await uploadFile(file.file, 'products/mall/main')
    file.url = result.url
    file.thumbnailUrl = result.url
    file.objectKey = result.objectKey
    onFinish({ url: result.url })
  } catch (error) {
    onError()
  }
}

const handleImagesUpload = async ({ file, onFinish, onError }: any) => {
  try {
    const result = await uploadFile(file.file, 'products/mall/gallery')
    file.url = result.url
    file.thumbnailUrl = result.url
    file.objectKey = result.objectKey
    onFinish({ url: result.url })
  } catch (error) {
    onError()
  }
}

const handleMainImageChange = (options: any) => {
  const file = options.fileList.find((f: any) => f.status === 'finished' && (f.objectKey || f.url))
  formData.mainImage = file ? (file.objectKey || file.url) : ''
}

const handleImagesChange = (options: any) => {
  formData.images = options.fileList
    .filter((f: any) => f.status === 'finished' && (f.objectKey || f.url))
    .map((f: any) => f.objectKey || f.url)
}

const loadProduct = async () => {
  const product: Product = await getProductMallInfo(productId.value)
  const mallInfo = product.mallInfo || {}

  formData.mallEnabled = product.mallEnabled
  formData.name = mallInfo.name || product.name || ''
  formData.description = mallInfo.description || product.description || ''
  formData.detail = mallInfo.detail || product.detail || ''
  formData.mainImage = mallInfo.mainImage || product.mainImage || ''
  formData.images = mallInfo.images?.length ? mallInfo.images : (product.images || [])

  mainImageList.value = formData.mainImage
    ? [{ id: 'mall-main', name: '商城主图', status: 'finished', url: formData.mainImage }]
    : []

  imagesList.value = formData.images.map((url, index) => ({
    id: `mall-image-${index}`,
    name: `商城图片${index + 1}`,
    status: 'finished',
    url,
  }))

  skuList.length = 0
  product.skus.forEach((sku) => {
    skuList.push({
      skuId: sku.id,
      skuCode: sku.skuCode,
      specs: sku.specs,
      baseSalePrice: sku.salePrice,
      baseMarketPrice: sku.marketPrice,
      salePrice: sku.mallInfo?.salePrice ?? sku.salePrice,
      marketPrice: sku.mallInfo?.marketPrice ?? sku.marketPrice,
      image: sku.mallInfo?.image ?? sku.image,
    })
  })
}

const handleSubmit = async () => {
  submitLoading.value = true
  try {
    await updateProductMallInfo(productId.value, {
      mallEnabled: formData.mallEnabled,
      name: formData.name,
      description: formData.description,
      detail: formData.detail,
      mainImage: formData.mainImage,
      images: formData.images,
      skuMallInfos: skuList.map((sku) => ({
        skuId: sku.skuId,
        salePrice: sku.salePrice,
        marketPrice: sku.marketPrice,
        image: sku.image,
      })),
    })
    message.success('商城信息已保存')
    router.push('/mall-products')
  } catch (error) {
    message.error('商城信息保存失败')
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  loadProduct().catch(() => {
    message.error('加载商城信息失败')
  })
})
</script>
