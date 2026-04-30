<template>
  <div class="dashboard p-4 space-y-4">
    <!-- 欢迎横幅 -->
    <n-card class="welcome-banner bg-container transition-theme" :bordered="false">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-base-text mb-1">
            {{ greeting }}，{{ user?.name || user?.username }}
          </h2>
          <p class="text-sm text-base-text-secondary">
            {{ today }} · 祝您今天经营顺利，销量长虹
          </p>
        </div>
        <div class="flex items-center gap-2">
          <n-tag :bordered="false" type="success" round>
            <template #icon>
              <AppIcon icon="mdi:check-circle" :size="14" />
            </template>
            系统运行正常
          </n-tag>
        </div>
      </div>
    </n-card>

    <!-- 核心 KPI 指标 -->
    <n-grid :x-gap="16" :y-gap="16" cols="2 s:3 m:3 l:6 xl:6 2xl:6" responsive="screen">
      <n-gi v-for="(kpi, idx) in kpis" :key="idx">
        <n-card
          hoverable
          class="kpi-card bg-container transition-theme cursor-pointer h-full"
          :bordered="false"
          @click="kpi.to && router.push(kpi.to)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="text-sm text-base-text-secondary mb-2">{{ kpi.label }}</div>
              <div class="text-3xl font-bold truncate" :style="{ color: kpi.color }">
                <n-skeleton v-if="loading" :width="80" :sharp="false" />
                <template v-else>{{ kpi.value }}</template>
              </div>
              <div v-if="kpi.hint" class="text-xs text-base-text-secondary mt-2">
                {{ kpi.hint }}
              </div>
            </div>
            <div
              class="kpi-icon flex items-center justify-center rounded-lg shrink-0"
              :style="{ background: kpi.bg, color: kpi.color }"
            >
              <AppIcon :icon="kpi.icon" :size="24" />
            </div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- 快捷入口 -->
    <n-card title="快捷入口" class="bg-container transition-theme" :bordered="false">
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        <div
          v-for="shortcut in shortcuts"
          :key="shortcut.label"
          class="shortcut-item flex flex-col items-center justify-center gap-2 p-3 rounded-lg cursor-pointer transition-theme"
          @click="router.push(shortcut.to)"
        >
          <div
            class="w-10 h-10 flex items-center justify-center rounded-lg"
            :style="{ background: shortcut.bg, color: shortcut.color }"
          >
            <AppIcon :icon="shortcut.icon" :size="20" />
          </div>
          <span class="text-xs text-base-text text-center">{{ shortcut.label }}</span>
        </div>
      </div>
    </n-card>

    <!-- 详细信息：库存预警 + 应付款 -->
    <n-grid :x-gap="16" :y-gap="16" :cols="2" item-responsive responsive="screen">
      <!-- 库存预警 -->
      <n-gi span="2 m:1">
        <n-card class="bg-container transition-theme h-full" :bordered="false">
          <template #header>
            <div class="flex items-center gap-2">
              <AppIcon icon="mdi:alert-circle-outline" :size="18" color="var(--n-color-warning, #f0a020)" />
              <span>库存预警 Top 5</span>
            </div>
          </template>
          <template #header-extra>
            <n-button text type="primary" size="small" @click="router.push('/inventories')">
              查看全部
              <template #icon>
                <AppIcon icon="mdi:chevron-right" :size="14" />
              </template>
            </n-button>
          </template>

          <n-spin :show="loading">
            <div v-if="warnings.length === 0 && !loading" class="py-8">
              <n-empty description="暂无库存预警" size="small" />
            </div>
            <n-data-table
              v-else
              :columns="warningColumns"
              :data="warnings"
              :bordered="false"
              size="small"
              :row-key="(row: WarningRow) => row.id"
            />
          </n-spin>
        </n-card>
      </n-gi>

      <!-- 应付款概览 -->
      <n-gi span="2 m:1">
        <n-card class="bg-container transition-theme h-full" :bordered="false">
          <template #header>
            <div class="flex items-center gap-2">
              <AppIcon icon="mdi:cash-multiple" :size="18" color="#2080f0" />
              <span>应付款概览</span>
            </div>
          </template>
          <template #header-extra>
            <n-button text type="primary" size="small" @click="router.push('/payments')">
              收付款管理
              <template #icon>
                <AppIcon icon="mdi:chevron-right" :size="14" />
              </template>
            </n-button>
          </template>

          <n-spin :show="loading">
            <div class="grid grid-cols-3 gap-4">
              <div class="text-center p-4 rounded-lg bg-base-hover">
                <div class="text-xs text-base-text-secondary mb-2">应付总额</div>
                <div class="text-xl font-bold text-primary">
                  ¥ {{ formatMoney(payable.totalPayable) }}
                </div>
              </div>
              <div class="text-center p-4 rounded-lg bg-base-hover">
                <div class="text-xs text-base-text-secondary mb-2">已付金额</div>
                <div class="text-xl font-bold text-success">
                  ¥ {{ formatMoney(payable.totalPaid) }}
                </div>
              </div>
              <div class="text-center p-4 rounded-lg bg-base-hover">
                <div class="text-xs text-base-text-secondary mb-2">未付金额</div>
                <div class="text-xl font-bold text-warning">
                  ¥ {{ formatMoney(payable.totalUnpaid) }}
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div class="flex justify-between items-center text-xs text-base-text-secondary mb-1">
                <span>付款进度</span>
                <span>{{ payProgressText }}</span>
              </div>
              <n-progress
                type="line"
                :percentage="payProgress"
                :show-indicator="false"
                :height="8"
                :border-radius="4"
                color="#18a058"
              />
            </div>
          </n-spin>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NTag,
  NGrid,
  NGi,
  NButton,
  NDataTable,
  NSkeleton,
  NEmpty,
  NSpin,
  NProgress,
  type DataTableColumns,
} from 'naive-ui'
import { useAuthStore } from '@/store'
import AppIcon from '@/components/common/AppIcon.vue'
import { getProducts } from '@/api/product'
import { getOrders } from '@/api/order'
import { getPurchases, getPayableStats } from '@/api/purchase'
import { getCustomers } from '@/api/customer'
import { getInventoryStats, getInventoryWarnings } from '@/api/inventory'

type WarningRow = {
  id: number
  productName: string
  skuCode: string
  warehouseName: string
  available: number
  minStock: number
}

const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

const loading = ref(true)

// 统计数据
const productCount = ref(0)
const customerCount = ref(0)
const orderCount = ref(0)
const purchaseCount = ref(0)
const skuCount = ref(0)
const lowStockCount = ref(0)

const warnings = ref<WarningRow[]>([])
const payable = ref({ totalPayable: 0, totalPaid: 0, totalUnpaid: 0 })

// 问候语
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  if (h < 22) return '晚上好'
  return '夜深了'
})

const today = computed(() => {
  const d = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
})

// KPI 卡片
const kpis = computed(() => [
  {
    label: '商品总数',
    value: productCount.value,
    icon: 'mdi:package-variant-closed',
    color: '#2080f0',
    bg: 'rgba(32, 128, 240, 0.1)',
    hint: `SKU ${skuCount.value} 个`,
    to: '/products/list',
  },
  {
    label: '客户总数',
    value: customerCount.value,
    icon: 'mdi:account-group-outline',
    color: '#18a058',
    bg: 'rgba(24, 160, 88, 0.1)',
    hint: '累计客户',
    to: '/basic/customers',
  },
  {
    label: '销售订单',
    value: orderCount.value,
    icon: 'mdi:cart-outline',
    color: '#f0a020',
    bg: 'rgba(240, 160, 32, 0.1)',
    hint: '全部销售单',
    to: '/orders',
  },
  {
    label: '采购订单',
    value: purchaseCount.value,
    icon: 'mdi:truck-outline',
    color: '#8a2be2',
    bg: 'rgba(138, 43, 226, 0.1)',
    hint: '全部采购单',
    to: '/purchases',
  },
  {
    label: '库存预警',
    value: lowStockCount.value,
    icon: 'mdi:alert-outline',
    color: '#d03050',
    bg: 'rgba(208, 48, 80, 0.1)',
    hint: '低于安全库存',
    to: '/inventories',
  },
  {
    label: '未付金额',
    value: `¥${formatMoney(payable.value.totalUnpaid)}`,
    icon: 'mdi:wallet-outline',
    color: '#ff7043',
    bg: 'rgba(255, 112, 67, 0.1)',
    hint: '供应商应付',
    to: '/payments',
  },
])

// 快捷入口
const shortcuts = [
  { label: '新增商品', icon: 'mdi:plus-box-outline', to: '/products/create', color: '#2080f0', bg: 'rgba(32, 128, 240, 0.1)' },
  { label: '销售订单', icon: 'mdi:cart-plus', to: '/orders', color: '#18a058', bg: 'rgba(24, 160, 88, 0.1)' },
  { label: '采购订单', icon: 'mdi:truck-plus-outline', to: '/purchases', color: '#8a2be2', bg: 'rgba(138, 43, 226, 0.1)' },
  { label: '采购入库', icon: 'mdi:package-down', to: '/purchase-receipts', color: '#f0a020', bg: 'rgba(240, 160, 32, 0.1)' },
  { label: '发货管理', icon: 'mdi:truck-delivery-outline', to: '/shipments', color: '#00b8d4', bg: 'rgba(0, 184, 212, 0.1)' },
  { label: '库存查询', icon: 'mdi:database-search-outline', to: '/inventories', color: '#36cfc9', bg: 'rgba(54, 207, 201, 0.1)' },
  { label: '库存调拨', icon: 'mdi:swap-horizontal', to: '/transfers', color: '#ff7043', bg: 'rgba(255, 112, 67, 0.1)' },
  { label: '库存调整', icon: 'mdi:tune', to: '/adjustments', color: '#d03050', bg: 'rgba(208, 48, 80, 0.1)' },
]

// 库存预警表格
const warningColumns: DataTableColumns<WarningRow> = [
  { title: '商品', key: 'productName', ellipsis: { tooltip: true } },
  { title: '规格', key: 'skuCode', width: 110, ellipsis: { tooltip: true } },
  { title: '仓库', key: 'warehouseName', width: 100, ellipsis: { tooltip: true } },
  {
    title: '可用/安全',
    key: 'available',
    width: 110,
    align: 'right',
    render: (row) =>
      h(
        'span',
        { style: 'color: #d03050; font-weight: 600;' },
        `${row.available} / ${row.minStock}`,
      ),
  },
]

function formatMoney(v: number) {
  if (!v) return '0.00'
  return Number(v).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const payProgress = computed(() => {
  const total = payable.value.totalPayable
  if (!total) return 0
  return Math.min(100, Math.round((payable.value.totalPaid / total) * 100))
})

const payProgressText = computed(() => `${payProgress.value}%`)

async function loadData() {
  loading.value = true
  const results = await Promise.allSettled([
    getProducts({ page: 1, pageSize: 1 }),
    getCustomers(),
    getOrders({ page: 1, pageSize: 1 }),
    getPurchases({ page: 1, pageSize: 1 }),
    getInventoryStats(),
    getInventoryWarnings({ type: 'low', page: 1, pageSize: 5 }),
    getPayableStats(),
  ])

  const [productsR, customersR, ordersR, purchasesR, statsR, warningsR, payableR] = results

  if (productsR.status === 'fulfilled') {
    productCount.value = (productsR.value as any)?.meta?.total ?? 0
  }
  if (customersR.status === 'fulfilled') {
    const v = customersR.value as any
    customerCount.value = Array.isArray(v) ? v.length : v?.data?.length ?? v?.meta?.total ?? 0
  }
  if (ordersR.status === 'fulfilled') {
    orderCount.value = (ordersR.value as any)?.meta?.total ?? 0
  }
  if (purchasesR.status === 'fulfilled') {
    purchaseCount.value = (purchasesR.value as any)?.meta?.total ?? 0
  }
  if (statsR.status === 'fulfilled') {
    const s = statsR.value as any
    skuCount.value = s?.totalSkuCount ?? 0
    lowStockCount.value = s?.lowStockCount ?? 0
  }
  if (warningsR.status === 'fulfilled') {
    const list = (warningsR.value as any)?.data ?? []
    warnings.value = list.map((w: any) => ({
      id: w.id,
      productName: w.productName,
      skuCode: w.skuCode,
      warehouseName: w.warehouseName,
      available: w.available,
      minStock: w.minStock,
    }))
  }
  if (payableR.status === 'fulfilled') {
    const p = (payableR.value as any)?.summary
    if (p) {
      payable.value = {
        totalPayable: Number(p.totalPayable) || 0,
        totalPaid: Number(p.totalPaid) || 0,
        totalUnpaid: Number(p.totalUnpaid) || 0,
      }
    }
  }

  loading.value = false
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.welcome-banner {
  background: linear-gradient(
    135deg,
    rgba(32, 128, 240, 0.08) 0%,
    rgba(24, 160, 88, 0.05) 100%
  );
}

.kpi-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.kpi-icon {
  width: 48px;
  height: 48px;
}

.shortcut-item:hover {
  background: var(--n-color-hover, rgba(0, 0, 0, 0.04));
}

.bg-base-hover {
  background: var(--n-color-hover, rgba(0, 0, 0, 0.025));
}

.text-base-text-secondary {
  color: var(--n-text-color-3, #909399);
}

.text-success {
  color: #18a058;
}

.text-warning {
  color: #f0a020;
}

.text-primary {
  color: #2080f0;
}
</style>
