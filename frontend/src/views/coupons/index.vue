<template>
  <div class="p-4">
    <n-card>
      <n-tabs type="line" animated>
        <n-tab-pane name="templates" tab="优惠券模板">
          <n-card class="mb-4" content-style="padding-bottom: 0;">
            <QueryForm :model="couponSearchForm">
              <n-form-item label="关键词">
                <n-input v-model:value="couponSearchForm.keyword" placeholder="名称/模板编码" clearable />
              </n-form-item>
              <n-form-item label="状态">
                <n-select v-model:value="couponSearchForm.isEnabled" :options="enabledOptions" placeholder="全部状态" clearable />
              </n-form-item>
              <n-form-item>
                <n-space>
                  <n-button type="primary" @click="handleCouponSearch">查询</n-button>
                  <n-button @click="handleCouponReset">重置</n-button>
                </n-space>
              </n-form-item>
            </QueryForm>
          </n-card>

          <n-card class="mb-4">
            <div class="page-toolbar">
              <n-space>
                <n-button type="primary" @click="handleCreate">新增优惠券</n-button>
              </n-space>
            </div>
          </n-card>

          <n-card>
            <n-data-table :columns="couponColumns" :data="couponList" :loading="couponLoading" :row-key="(row: CouponItem) => row.id" />
          </n-card>
        </n-tab-pane>

        <n-tab-pane name="receives" tab="发放记录">
          <n-card class="mb-4" content-style="padding-bottom: 0;">
            <QueryForm :model="receiveSearchForm">
              <n-form-item label="关键词">
                <n-input v-model:value="receiveSearchForm.keyword" placeholder="客户/券名/模板编码" clearable />
              </n-form-item>
              <n-form-item label="优惠券">
                <n-select v-model:value="receiveSearchForm.couponId" :options="couponOptions" placeholder="全部优惠券" clearable filterable />
              </n-form-item>
              <n-form-item label="状态">
                <n-select v-model:value="receiveSearchForm.status" :options="receiveStatusOptions" placeholder="全部状态" clearable />
              </n-form-item>
              <n-form-item>
                <n-space>
                  <n-button type="primary" @click="handleReceiveSearch">查询</n-button>
                  <n-button @click="handleReceiveReset">重置</n-button>
                </n-space>
              </n-form-item>
            </QueryForm>
          </n-card>

          <n-card>
            <n-data-table
              :columns="receiveColumns"
              :data="receiveList"
              :loading="receiveLoading"
              :pagination="receivePagination"
              :row-key="(row: CouponReceiveItem) => row.id"
              remote
            />
          </n-card>
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <SmartFormContainer
      v-model:show="couponDialogVisible"
      :title="editingCouponId ? '编辑优惠券' : '新增优惠券'"
      :form-item-count="10"
      modal-width="900px"
      :drawer-width="920"
    >
      <n-form ref="couponFormRef" :model="couponForm" :rules="couponRules" label-width="110">
        <n-space vertical :size="16">
          <n-card title="基础信息" size="small">
            <n-grid :cols="2" :x-gap="16">
              <n-form-item-gi label="优惠券名称" path="name">
                <n-input v-model:value="couponForm.name" placeholder="请输入优惠券名称" />
              </n-form-item-gi>
              <n-form-item-gi label="模板编码" path="code">
                <n-input v-model:value="couponForm.code" placeholder="留空自动生成" />
              </n-form-item-gi>
              <n-form-item-gi label="优惠类型" path="type">
                <n-select v-model:value="couponForm.type" :options="couponTypeOptions" />
              </n-form-item-gi>
              <n-form-item-gi label="场景类型" path="sceneType">
                <n-select v-model:value="couponForm.sceneType" :options="sceneTypeOptions" @update:value="handleSceneTypeChange" />
              </n-form-item-gi>
              <n-form-item-gi label="发放方式" path="issueType">
                <n-select v-model:value="couponForm.issueType" :options="issueTypeOptions" @update:value="handleIssueTypeChange" />
              </n-form-item-gi>
              <n-form-item-gi label="启用状态" path="isEnabled">
                <n-switch v-model:value="couponForm.isEnabled" />
              </n-form-item-gi>
              <n-form-item-gi span="2" label="说明" path="description">
                <n-input v-model:value="couponForm.description" type="textarea" :rows="3" placeholder="可选，填写适用说明" />
              </n-form-item-gi>
            </n-grid>
          </n-card>

          <n-card title="优惠规则" size="small">
            <n-grid :cols="2" :x-gap="16">
              <n-form-item-gi label="使用门槛" path="thresholdAmount">
                <n-input-number v-model:value="couponForm.thresholdAmount" :min="0" :precision="2" class="w-full" />
              </n-form-item-gi>
              <n-form-item-gi v-if="couponForm.type !== 'DISCOUNT'" label="优惠金额" path="discountAmount">
                <n-input-number v-model:value="couponForm.discountAmount" :min="0.01" :precision="2" class="w-full" />
              </n-form-item-gi>
              <n-form-item-gi v-else label="折扣率" path="discountRate">
                <n-input-number v-model:value="couponForm.discountRate" :min="1" :max="100" :precision="0" class="w-full" />
              </n-form-item-gi>
              <n-form-item-gi v-if="couponForm.type === 'DISCOUNT'" label="最高优惠" path="maxDiscountAmount">
                <n-input-number v-model:value="couponForm.maxDiscountAmount" :min="0.01" :precision="2" class="w-full" />
              </n-form-item-gi>
              <n-form-item-gi label="排序号" path="sort">
                <n-input-number v-model:value="couponForm.sort" :min="0" :precision="0" class="w-full" />
              </n-form-item-gi>
            </n-grid>
          </n-card>

          <n-card title="发放与有效期" size="small">
            <n-space vertical :size="12">
              <n-alert type="info" :show-icon="false">
                <div>{{ issueTypeHelpText }}</div>
                <div class="mt-1 text-xs text-gray-500">{{ sceneTypeHelpText }}</div>
              </n-alert>

              <n-grid :cols="2" :x-gap="16">
                <n-form-item-gi label="发放总量" path="totalCount">
                  <n-input-number v-model:value="couponForm.totalCount" :min="1" :precision="0" class="w-full" />
                </n-form-item-gi>
                <n-form-item-gi label="每人限领" path="perLimit">
                  <n-input-number v-model:value="couponForm.perLimit" :min="1" :precision="0" class="w-full" />
                </n-form-item-gi>
                <n-form-item-gi v-if="couponForm.issueType === 'USER_CLAIM'" label="每日限领" path="dailyLimit">
                  <n-input-number v-model:value="couponForm.dailyLimit" :min="1" :precision="0" class="w-full" />
                </n-form-item-gi>
                <n-form-item-gi label="有效期类型" path="validType">
                  <n-select v-model:value="couponForm.validType" :options="validTypeOptions" />
                </n-form-item-gi>
                <n-form-item-gi v-if="couponForm.issueType === 'USER_CLAIM'" label="公开领取" path="isPublic">
                  <n-switch v-model:value="couponForm.isPublic" />
                </n-form-item-gi>
                <n-form-item-gi label="渠道范围" path="channelScope">
                  <n-select
                    v-model:value="couponForm.channelScope"
                    multiple
                    :options="channelScopeOptions"
                    placeholder="请选择可领取渠道"
                  />
                </n-form-item-gi>
                <n-form-item-gi v-if="couponForm.issueType === 'USER_CLAIM'" label="领取开始" path="claimStartTime">
                  <n-date-picker v-model:value="couponForm.claimStartTime" type="datetime" clearable class="w-full" />
                </n-form-item-gi>
                <n-form-item-gi v-if="couponForm.issueType === 'USER_CLAIM'" label="领取结束" path="claimEndTime">
                  <n-date-picker v-model:value="couponForm.claimEndTime" type="datetime" clearable class="w-full" />
                </n-form-item-gi>
                <n-form-item-gi label="开始时间" path="startTime">
                  <n-date-picker v-model:value="couponForm.startTime" type="datetime" clearable class="w-full" />
                </n-form-item-gi>
                <n-form-item-gi label="结束时间" path="endTime">
                  <n-date-picker v-model:value="couponForm.endTime" type="datetime" clearable class="w-full" />
                </n-form-item-gi>
                <n-form-item-gi v-if="couponForm.validType === 'RELATIVE'" label="生效延迟天数" path="validDelayDays">
                  <n-input-number v-model:value="couponForm.validDelayDays" :min="0" :precision="0" class="w-full" />
                </n-form-item-gi>
                <n-form-item-gi v-if="couponForm.validType === 'RELATIVE'" label="有效天数" path="validDays">
                  <n-input-number v-model:value="couponForm.validDays" :min="1" :precision="0" class="w-full" />
                </n-form-item-gi>
              </n-grid>
            </n-space>
          </n-card>

          <n-card title="发放范围" size="small">
            <n-space vertical :size="12">
              <n-grid :cols="2" :x-gap="16">
                <n-form-item-gi label="发放范围" path="issueScopeType">
                  <n-select v-model:value="couponForm.issueScopeType" :options="issueScopeOptions" @update:value="handleIssueScopeTypeChange" />
                </n-form-item-gi>
              </n-grid>

              <n-alert type="default" :show-icon="false">
                不限制时选择“全部用户”；只有需要精细圈人时，才继续配置下面的范围条件。
              </n-alert>

              <n-grid v-if="couponForm.issueScopeType === 'CUSTOMERS'" :cols="1">
                <n-form-item-gi label="指定客户">
                  <n-select
                    v-model:value="couponForm.issueCustomerIds"
                    multiple
                    filterable
                    clearable
                    :options="customerOptions"
                    placeholder="请选择可领取的客户"
                  />
                </n-form-item-gi>
              </n-grid>

              <n-grid v-else-if="couponForm.issueScopeType === 'NEW_USERS'" :cols="2" :x-gap="16">
                <n-form-item-gi label="注册天数内">
                  <n-input-number v-model:value="couponForm.issueRegisterDaysWithin" :min="1" :precision="0" class="w-full" />
                </n-form-item-gi>
              </n-grid>

              <n-alert
                v-else-if="couponForm.issueScopeType === 'FIRST_ORDER_USERS' || couponForm.issueScopeType === 'RECHARGED_USERS'"
                type="info"
                :show-icon="false"
              >
                <span v-if="couponForm.issueScopeType === 'FIRST_ORDER_USERS'">系统会按“商城已完成订单数 = 0”判断是否属于首单用户。</span>
                <span v-else>系统会按“已完成充值次数 &gt; 0”判断是否属于已充值用户。</span>
              </n-alert>
            </n-space>
          </n-card>

          <n-card title="使用范围" size="small">
            <n-space vertical :size="12">
              <n-grid :cols="2" :x-gap="16">
                <n-form-item-gi label="使用范围" path="useScopeType">
                  <n-select v-model:value="couponForm.useScopeType" :options="useScopeOptions" @update:value="handleUseScopeTypeChange" />
                </n-form-item-gi>
              </n-grid>

              <n-alert type="default" :show-icon="false">
                不限制时选择“全场通用”；仅在需要限制分类、品牌、商品或规格时，再选择具体范围。
              </n-alert>

              <n-grid v-if="couponForm.useScopeType === 'CATEGORY'" :cols="1">
                <n-form-item-gi label="指定分类">
                  <n-select
                    v-model:value="couponForm.useCategoryIds"
                    multiple
                    filterable
                    clearable
                    :options="categoryOptions"
                    placeholder="请选择可用分类"
                  />
                </n-form-item-gi>
              </n-grid>

              <n-grid v-else-if="couponForm.useScopeType === 'BRAND'" :cols="1">
                <n-form-item-gi label="指定品牌">
                  <n-select
                    v-model:value="couponForm.useBrandIds"
                    multiple
                    filterable
                    clearable
                    :options="brandOptions"
                    placeholder="请选择可用品牌"
                  />
                </n-form-item-gi>
              </n-grid>

              <n-grid v-else-if="couponForm.useScopeType === 'PRODUCT'" :cols="1">
                <n-form-item-gi label="指定商品">
                  <n-select
                    v-model:value="couponForm.useProductIds"
                    multiple
                    filterable
                    clearable
                    :options="productOptions"
                    placeholder="请选择可用商品"
                  />
                </n-form-item-gi>
              </n-grid>

              <n-grid v-else-if="couponForm.useScopeType === 'SKU'" :cols="1">
                <n-form-item-gi label="指定规格">
                  <n-select
                    v-model:value="couponForm.useSkuIds"
                    multiple
                    filterable
                    clearable
                    :options="skuOptions"
                    placeholder="请选择可用规格"
                  />
                </n-form-item-gi>
              </n-grid>
            </n-space>
          </n-card>

          <n-card title="叠加与退款" size="small">
            <n-grid :cols="2" :x-gap="16">
              <n-form-item-gi label="退款退券" path="refundReturnMode">
                <n-select v-model:value="couponForm.refundReturnMode" :options="refundReturnModeOptions" />
              </n-form-item-gi>
              <n-form-item-gi label="可与其他券叠加">
                <n-switch v-model:value="couponForm.stackable" />
              </n-form-item-gi>
              <n-form-item-gi label="可与活动叠加">
                <n-switch v-model:value="couponForm.canUseWithPromotion" />
              </n-form-item-gi>
              <n-form-item-gi label="可与会员价叠加">
                <n-switch v-model:value="couponForm.canUseWithMemberPrice" />
              </n-form-item-gi>
              <n-form-item-gi label="可与积分叠加">
                <n-switch v-model:value="couponForm.canUseWithPoint" />
              </n-form-item-gi>
              <n-form-item-gi label="可与余额支付叠加">
                <n-switch v-model:value="couponForm.canUseWithBalance" />
              </n-form-item-gi>
            </n-grid>
          </n-card>
        </n-space>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="couponDialogVisible = false">取消</n-button>
          <n-button type="primary" :loading="couponSubmitting" @click="handleSubmitCoupon">保存</n-button>
        </n-space>
      </template>
    </SmartFormContainer>

    <SmartFormContainer
      v-model:show="issueDialogVisible"
      title="发放优惠券"
      :form-item-count="4"
      modal-width="640px"
      :drawer-width="760"
    >
      <n-form ref="issueFormRef" :model="issueForm" :rules="issueRules" label-width="100">
        <n-form-item label="优惠券">
          <n-input :value="issueCouponTitle" disabled />
        </n-form-item>
        <n-form-item label="选择客户" path="customerIds">
          <n-select
            v-model:value="issueForm.customerIds"
            multiple
            filterable
            clearable
            :options="customerOptions"
            placeholder="请选择要发券的客户"
          />
        </n-form-item>
        <n-form-item label="备注" path="remark">
          <n-input v-model:value="issueForm.remark" type="textarea" :rows="3" placeholder="可选，填写发券说明" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="issueDialogVisible = false">取消</n-button>
          <n-button type="primary" :loading="issueSubmitting" @click="handleSubmitIssue">确认发放</n-button>
        </n-space>
      </template>
    </SmartFormContainer>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref, watch } from 'vue'
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { NButton, NSpace, NSwitch, NTag, useDialog, useMessage } from 'naive-ui'
import QueryForm from '@/components/common/QueryForm.vue'
import SmartFormContainer from '@/components/common/SmartFormContainer.vue'
import { getCoupons, getCouponReceives, createCoupon, updateCoupon, deleteCoupon, issueCoupon } from '@/api/coupon'
import type { CouponItem, CouponPayload, CouponReceiveItem } from '@/api/coupon'
import { getCustomers } from '@/api/customer'
import { getCategoriesFlat } from '@/api/category'
import { getBrands } from '@/api/brand'
import { getProducts } from '@/api/product'

type SelectOption = { label: string; value: number }

const message = useMessage()
const dialog = useDialog()

const couponLoading = ref(false)
const couponSubmitting = ref(false)
const receiveLoading = ref(false)
const issueSubmitting = ref(false)
const couponDialogVisible = ref(false)
const issueDialogVisible = ref(false)
const editingCouponId = ref<number | null>(null)
const issueCouponId = ref<number | null>(null)
const couponFormRef = ref<FormInst | null>(null)
const issueFormRef = ref<FormInst | null>(null)
const couponList = ref<CouponItem[]>([])
const receiveList = ref<CouponReceiveItem[]>([])
const customerOptions = ref<SelectOption[]>([])
const categoryOptions = ref<SelectOption[]>([])
const brandOptions = ref<SelectOption[]>([])
const productOptions = ref<SelectOption[]>([])
const skuOptions = ref<SelectOption[]>([])

const couponSearchForm = reactive({
  keyword: '',
  isEnabled: null as boolean | null,
})

const receiveSearchForm = reactive({
  keyword: '',
  couponId: null as number | null,
  status: null as 'UNUSED' | 'USED' | 'EXPIRED' | 'INVALID' | null,
})

const couponForm = reactive({
  name: '',
  code: '',
  type: 'CASH' as CouponPayload['type'],
  sceneType: 'COMMON' as NonNullable<CouponPayload['sceneType']>,
  issueType: 'USER_CLAIM' as NonNullable<CouponPayload['issueType']>,
  thresholdAmount: 0,
  discountAmount: 10,
  discountRate: 90,
  maxDiscountAmount: null as number | null,
  totalCount: null as number | null,
  perLimit: 1,
  dailyLimit: null as number | null,
  claimStartTime: null as number | null,
  claimEndTime: null as number | null,
  startTime: null as number | null,
  endTime: null as number | null,
  validType: 'FIXED' as NonNullable<CouponPayload['validType']>,
  validDays: 7,
  validDelayDays: 0,
  issueScopeType: 'ALL' as NonNullable<CouponPayload['issueScopeType']>,
  useScopeType: 'ALL' as NonNullable<CouponPayload['useScopeType']>,
  refundReturnMode: 'RETURN_ORIGINAL' as NonNullable<CouponPayload['refundReturnMode']>,
  channelScope: ['MINI_PROGRAM'] as string[],
  stackable: false,
  canUseWithPromotion: true,
  canUseWithMemberPrice: true,
  canUseWithPoint: true,
  canUseWithBalance: true,
  isPublic: true,
  issueCustomerIds: [] as number[],
  issueRegisterDaysWithin: 30,
  useCategoryIds: [] as number[],
  useBrandIds: [] as number[],
  useProductIds: [] as number[],
  useSkuIds: [] as number[],
  description: '',
  sort: 0,
  isEnabled: true,
})

const issueForm = reactive({
  customerIds: [] as number[],
  remark: '',
})

const enabledOptions = [
  { label: '启用', value: true },
  { label: '停用', value: false },
]

const couponTypeOptions = [
  { label: '满减券', value: 'CASH' },
  { label: '折扣券', value: 'DISCOUNT' },
  { label: '立减券', value: 'INSTANT_REDUCTION' },
]

const sceneTypeOptions = [
  { label: '通用活动', value: 'COMMON' },
  { label: '新客专享', value: 'NEW_USER' },
  { label: '首单专享', value: 'FIRST_ORDER' },
  { label: '充值赠送', value: 'RECHARGE_GIFT' },
  { label: '下单赠送', value: 'ORDER_GIFT' },
  { label: '后台补发', value: 'MANUAL' },
]

const issueTypeOptions = [
  { label: '用户领取', value: 'USER_CLAIM' },
  { label: '后台发放', value: 'ADMIN_ASSIGN' },
  { label: '系统自动发放', value: 'AUTO_GRANT' },
  { label: '券码兑换', value: 'EXCHANGE_CODE' },
]

const validTypeOptions = [
  { label: '固定时间', value: 'FIXED' },
  { label: '领后生效', value: 'RELATIVE' },
]

const issueScopeOptions = [
  { label: '全部用户', value: 'ALL' },
  { label: '指定客户', value: 'CUSTOMERS' },
  { label: '新客', value: 'NEW_USERS' },
  { label: '首单用户', value: 'FIRST_ORDER_USERS' },
  { label: '已充值用户', value: 'RECHARGED_USERS' },
]

const useScopeOptions = [
  { label: '全场通用', value: 'ALL' },
  { label: '指定分类', value: 'CATEGORY' },
  { label: '指定品牌', value: 'BRAND' },
  { label: '指定商品', value: 'PRODUCT' },
  { label: '指定规格', value: 'SKU' },
]

const refundReturnModeOptions = [
  { label: '退回原券', value: 'RETURN_ORIGINAL' },
  { label: '补发新券', value: 'GRANT_NEW' },
  { label: '不退券', value: 'NOT_RETURN' },
]

const channelScopeOptions = [
  { label: '小程序', value: 'MINI_PROGRAM' },
  { label: '后台', value: 'ADMIN' },
  { label: 'H5', value: 'H5' },
]

const receiveStatusOptions = [
  { label: '未使用', value: 'UNUSED' },
  { label: '已使用', value: 'USED' },
  { label: '已过期', value: 'EXPIRED' },
  { label: '已作废', value: 'INVALID' },
]

const issueTypeHelpMap: Record<NonNullable<CouponPayload['issueType']>, string> = {
  USER_CLAIM: '用户领取：会进入领券中心，商城端可按领取时间、公开状态和发放范围主动领取。',
  ADMIN_ASSIGN: '后台发放：不会出现在领券中心，只允许后台手工发券。',
  AUTO_GRANT: '系统自动发放：当前已支持充值成功送券、商城订单支付成功送券，不会进入领券中心，也不支持后台手工发券。',
  EXCHANGE_CODE: '券码兑换：当前已支持后台生成兑换码，并可在商城端使用兑换码领取优惠券；不会进入领券中心，也不支持后台手工发券。',
}

const sceneTypeHelpMap: Record<NonNullable<CouponPayload['sceneType']>, string> = {
  COMMON: '通用活动不自动改业务逻辑，适合常规运营券。',
  NEW_USER: '新客专享会自动带出“用户领取 + 新客范围”的推荐配置。',
  FIRST_ORDER: '首单专享会自动带出“用户领取 + 首单用户”的推荐配置。',
  RECHARGE_GIFT: '充值赠送会自动带出“系统自动发放”的推荐配置，当前已接充值成功自动送券。',
  ORDER_GIFT: '下单赠送会自动带出“系统自动发放”的推荐配置，当前已接商城订单支付成功自动送券。',
  MANUAL: '后台补发会自动带出“后台发放”的推荐配置，适合人工补券。',
}

const couponOptions = computed(() => couponList.value.map(item => ({
  label: `${item.name} (${item.code})`,
  value: item.id,
})))

const issueCouponTitle = computed(() => couponList.value.find(item => item.id === issueCouponId.value)?.name || '')
const issueTypeHelpText = computed(() => issueTypeHelpMap[couponForm.issueType])
const sceneTypeHelpText = computed(() => sceneTypeHelpMap[couponForm.sceneType])
const statusUpdatingIds = ref<number[]>([])

const receivePagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  onUpdatePage: (page: number) => {
    receivePagination.page = page
    loadReceives()
  },
  onUpdatePageSize: (pageSize: number) => {
    receivePagination.pageSize = pageSize
    receivePagination.page = 1
    loadReceives()
  },
})

const couponRules: FormRules = {
  name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  discountAmount: [{
    validator: () => {
      if (couponForm.type === 'DISCOUNT') {
        return true
      }
      return Number(couponForm.discountAmount) > 0 || new Error('请输入优惠金额')
    },
    trigger: 'change',
  }],
  discountRate: [{
    validator: () => {
      if (couponForm.type !== 'DISCOUNT') {
        return true
      }
      return Number(couponForm.discountRate) >= 1 && Number(couponForm.discountRate) <= 100
        ? true
        : new Error('请输入 1-100 的折扣率')
    },
    trigger: 'change',
  }],
  startTime: [{ required: true, type: 'number', message: '请选择开始时间', trigger: 'change' }],
  endTime: [{
    validator: () => {
      if (!couponForm.startTime || !couponForm.endTime) {
        return new Error('请选择有效期')
      }
      if (couponForm.endTime <= couponForm.startTime) {
        return new Error('结束时间必须晚于开始时间')
      }
      return true
    },
    trigger: 'change',
  }],
  channelScope: [{
    validator: () => couponForm.channelScope.length > 0 || new Error('请至少选择一个渠道'),
    trigger: 'change',
  }],
}

const issueRules: FormRules = {
  customerIds: [{
    validator: () => issueForm.customerIds.length > 0 || new Error('请选择至少一个客户'),
    trigger: 'change',
  }],
}

const couponColumns: DataTableColumns<CouponItem> = [
  { title: '名称', key: 'name', minWidth: 160 },
  { title: '模板编码', key: 'code', width: 180 },
  { title: '类型', key: 'typeText', width: 100 },
  { title: '场景', key: 'sceneTypeText', width: 100 },
  { title: '发放方式', key: 'issueTypeText', width: 110 },
  {
    title: '优惠规则',
    key: 'rule',
    minWidth: 180,
    render: row => formatCouponRule(row),
  },
  {
    title: '发放情况',
    key: 'count',
    width: 170,
    render: row => `${row.receivedCount}/${row.totalCount ?? '不限'} · 每人${row.perLimit}张${row.dailyLimit ? ` · 每日${row.dailyLimit}张` : ''}`,
  },
  {
    title: '有效期',
    key: 'period',
    minWidth: 220,
    render: row => row.validType === 'RELATIVE'
      ? `${row.validDelayDays ? `延迟${row.validDelayDays}天后` : '领后'}${row.validDays || 0}天内有效`
      : `${formatDateTime(row.startTime)} - ${formatDateTime(row.endTime)}`,
  },
  {
    title: '状态',
    key: 'statusText',
    width: 100,
    render: row => h(
      NTag,
      { size: 'small', type: row.statusText === '进行中' ? 'success' : row.statusText === '未开始' ? 'info' : 'warning' },
      { default: () => row.statusText },
    ),
  },
  {
    title: '启用',
    key: 'isEnabled',
    width: 80,
    render: row => h(NSwitch, {
      value: row.isEnabled,
      loading: statusUpdatingIds.value.includes(row.id),
      onUpdateValue: (value: boolean) => handleToggleStatus(row, value),
    }),
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render: row => h(NSpace, null, {
      default: () => [
        h(NButton, { text: true, type: 'primary', onClick: () => handleEdit(row) }, { default: () => '编辑' }),
        h(
          NButton,
          { text: true, type: 'info', disabled: !row.isEnabled || row.issueType !== 'ADMIN_ASSIGN', onClick: () => handleOpenIssue(row) },
          { default: () => '发券' },
        ),
        h(NButton, { text: true, type: 'error', onClick: () => handleDelete(row) }, { default: () => '删除' }),
      ],
    }),
  },
]

const receiveColumns: DataTableColumns<CouponReceiveItem> = [
  { title: '优惠券', key: 'couponName', minWidth: 160 },
  { title: '模板编码', key: 'couponCode', width: 180 },
  { title: '客户', key: 'customerName', width: 150 },
  { title: '客户编码', key: 'customerCode', width: 120, render: row => row.customerCode || '-' },
  {
    title: '状态',
    key: 'statusText',
    width: 100,
    render: row => h(
      NTag,
      { size: 'small', type: row.status === 'UNUSED' ? 'success' : row.status === 'USED' ? 'info' : 'warning' },
      { default: () => row.statusText },
    ),
  },
  {
    title: '有效期',
    key: 'period',
    minWidth: 220,
    render: row => `${formatDateTime(row.validFrom)} - ${formatDateTime(row.validTo)}`,
  },
  { title: '发放时间', key: 'receivedAt', width: 180, render: row => formatDateTime(row.receivedAt) },
  { title: '来源', key: 'source', width: 90, render: row => row.source || '-' },
  { title: '备注', key: 'remark', minWidth: 140, render: row => row.remark || '-' },
]

watch(() => couponForm.issueType, (value) => {
  if (value !== 'USER_CLAIM') {
    couponForm.isPublic = false
    couponForm.claimStartTime = null
    couponForm.claimEndTime = null
    couponForm.dailyLimit = null
  }
})

async function loadCoupons() {
  couponLoading.value = true
  try {
    couponList.value = await getCoupons({
      keyword: couponSearchForm.keyword || undefined,
      isEnabled: couponSearchForm.isEnabled === null ? undefined : couponSearchForm.isEnabled,
    })
  } catch (error: any) {
    message.error(error.message || '加载优惠券失败')
  } finally {
    couponLoading.value = false
  }
}

async function loadReceives() {
  receiveLoading.value = true
  try {
    const res = await getCouponReceives({
      keyword: receiveSearchForm.keyword || undefined,
      couponId: receiveSearchForm.couponId || undefined,
      status: receiveSearchForm.status || undefined,
      page: receivePagination.page,
      pageSize: receivePagination.pageSize,
    })
    receiveList.value = res.data
    receivePagination.itemCount = res.meta.total
  } catch (error: any) {
    message.error(error.message || '加载发放记录失败')
  } finally {
    receiveLoading.value = false
  }
}

async function loadCustomers() {
  try {
    const res: any = await getCustomers()
    const list = Array.isArray(res) ? res : (res?.data || [])
    customerOptions.value = list.map((item: any) => ({
      label: `${item.name}${item.code ? ` (${item.code})` : ''}`,
      value: item.id,
    }))
  } catch (error: any) {
    message.error(error.message || '加载客户列表失败')
  }
}

async function loadScopeOptions() {
  try {
    const [categoryRes, brandRes, productRes] = await Promise.all<any>([
      getCategoriesFlat(),
      getBrands(),
      getProducts({ page: 1, pageSize: 200 }),
    ])

    const categoryList: any[] = Array.isArray(categoryRes) ? categoryRes : (categoryRes?.data || [])
    const brandList: any[] = Array.isArray(brandRes) ? brandRes : (brandRes?.data || [])
    const productList: any[] = Array.isArray(productRes?.data) ? productRes.data : []

    categoryOptions.value = categoryList.map(item => ({
      label: `${item.name}${item.code ? ` (${item.code})` : ''}`,
      value: item.id,
    }))
    brandOptions.value = brandList.map(item => ({
      label: item.name,
      value: item.id,
    }))
    productOptions.value = productList.map(item => ({
      label: `${item.name}${item.spuCode ? ` (${item.spuCode})` : ''}`,
      value: item.id,
    }))
    skuOptions.value = productList.flatMap((item: any) => (Array.isArray(item.skus) ? item.skus : []).map((sku: any) => ({
      label: `${item.name} / ${sku.skuCode}`,
      value: sku.id,
    })))
  } catch (error: any) {
    message.error(error.message || '加载范围选项失败')
  }
}

async function handleToggleStatus(row: CouponItem, isEnabled: boolean) {
  statusUpdatingIds.value = [...statusUpdatingIds.value, row.id]
  try {
    await updateCoupon(row.id, { isEnabled })
    message.success(`${row.name}已${isEnabled ? '启用' : '禁用'}`)
    await loadCoupons()
  } catch (error: any) {
    message.error(error.message || '状态更新失败')
  } finally {
    statusUpdatingIds.value = statusUpdatingIds.value.filter(id => id !== row.id)
  }
}

function resetCouponForm() {
  editingCouponId.value = null
  couponForm.name = ''
  couponForm.code = ''
  couponForm.type = 'CASH'
  couponForm.sceneType = 'COMMON'
  couponForm.issueType = 'USER_CLAIM'
  couponForm.thresholdAmount = 0
  couponForm.discountAmount = 10
  couponForm.discountRate = 90
  couponForm.maxDiscountAmount = null
  couponForm.totalCount = null
  couponForm.perLimit = 1
  couponForm.dailyLimit = null
  couponForm.claimStartTime = null
  couponForm.claimEndTime = null
  couponForm.startTime = null
  couponForm.endTime = null
  couponForm.validType = 'FIXED'
  couponForm.validDays = 7
  couponForm.validDelayDays = 0
  couponForm.issueScopeType = 'ALL'
  couponForm.useScopeType = 'ALL'
  couponForm.refundReturnMode = 'RETURN_ORIGINAL'
  couponForm.channelScope = ['MINI_PROGRAM']
  couponForm.stackable = false
  couponForm.canUseWithPromotion = true
  couponForm.canUseWithMemberPrice = true
  couponForm.canUseWithPoint = true
  couponForm.canUseWithBalance = true
  couponForm.isPublic = true
  couponForm.issueCustomerIds = []
  couponForm.issueRegisterDaysWithin = 30
  couponForm.useCategoryIds = []
  couponForm.useBrandIds = []
  couponForm.useProductIds = []
  couponForm.useSkuIds = []
  couponForm.description = ''
  couponForm.sort = 0
  couponForm.isEnabled = true
}

function handleCreate() {
  resetCouponForm()
  couponDialogVisible.value = true
}

function handleEdit(row: CouponItem) {
  editingCouponId.value = row.id
  couponForm.name = row.name
  couponForm.code = row.code
  couponForm.type = row.type
  couponForm.sceneType = row.sceneType
  couponForm.issueType = row.issueType
  couponForm.thresholdAmount = Number(row.thresholdAmount)
  couponForm.discountAmount = Number(row.discountAmount)
  couponForm.discountRate = row.discountRate || 90
  couponForm.maxDiscountAmount = row.maxDiscountAmount
  couponForm.totalCount = row.totalCount
  couponForm.perLimit = row.perLimit
  couponForm.dailyLimit = row.dailyLimit
  couponForm.claimStartTime = row.claimStartTime ? new Date(row.claimStartTime).getTime() : null
  couponForm.claimEndTime = row.claimEndTime ? new Date(row.claimEndTime).getTime() : null
  couponForm.startTime = new Date(row.startTime).getTime()
  couponForm.endTime = new Date(row.endTime).getTime()
  couponForm.validType = row.validType
  couponForm.validDays = row.validDays || 7
  couponForm.validDelayDays = row.validDelayDays
  couponForm.issueScopeType = row.issueScopeType
  couponForm.useScopeType = row.useScopeType
  couponForm.refundReturnMode = row.refundReturnMode
  couponForm.channelScope = row.channelScope?.length ? row.channelScope : ['MINI_PROGRAM']
  couponForm.stackable = row.stackable
  couponForm.canUseWithPromotion = row.canUseWithPromotion
  couponForm.canUseWithMemberPrice = row.canUseWithMemberPrice
  couponForm.canUseWithPoint = row.canUseWithPoint
  couponForm.canUseWithBalance = row.canUseWithBalance
  couponForm.isPublic = row.isPublic
  couponForm.issueCustomerIds = toNumberArray(row.issueRuleJson?.customerIds)
  couponForm.issueRegisterDaysWithin = Number(row.issueRuleJson?.registerDaysWithin || 30)
  couponForm.useCategoryIds = toNumberArray(row.useRuleJson?.categoryIds)
  couponForm.useBrandIds = toNumberArray(row.useRuleJson?.brandIds)
  couponForm.useProductIds = toNumberArray(row.useRuleJson?.productIds)
  couponForm.useSkuIds = toNumberArray(row.useRuleJson?.skuIds)
  couponForm.description = row.description || ''
  couponForm.sort = row.sort
  couponForm.isEnabled = row.isEnabled
  couponDialogVisible.value = true
}

function handleOpenIssue(row: CouponItem) {
  issueCouponId.value = row.id
  issueForm.customerIds = []
  issueForm.remark = ''
  issueDialogVisible.value = true
}

function handleDelete(row: CouponItem) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除优惠券 "${row.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteCoupon(row.id)
        message.success('删除成功')
        await loadCoupons()
      } catch (error: any) {
        message.error(error.message || '删除失败')
      }
    },
  })
}

function handleSceneTypeChange(value: NonNullable<CouponPayload['sceneType']>) {
  couponForm.sceneType = value

  if (value === 'NEW_USER') {
    couponForm.issueType = 'USER_CLAIM'
    couponForm.isPublic = true
    couponForm.issueScopeType = 'NEW_USERS'
    couponForm.issueRegisterDaysWithin = couponForm.issueRegisterDaysWithin || 30
    return
  }

  if (value === 'FIRST_ORDER') {
    couponForm.issueType = 'USER_CLAIM'
    couponForm.isPublic = true
    couponForm.issueScopeType = 'FIRST_ORDER_USERS'
    return
  }

  if (value === 'RECHARGE_GIFT' || value === 'ORDER_GIFT') {
    couponForm.issueType = 'AUTO_GRANT'
    couponForm.isPublic = false
    couponForm.issueScopeType = 'ALL'
    return
  }

  if (value === 'MANUAL') {
    couponForm.issueType = 'ADMIN_ASSIGN'
    couponForm.isPublic = false
    couponForm.issueScopeType = 'ALL'
  }
}

function handleIssueTypeChange(value: NonNullable<CouponPayload['issueType']>) {
  couponForm.issueType = value
  if (value !== 'USER_CLAIM') {
    couponForm.isPublic = false
  }
}

function handleIssueScopeTypeChange(value: NonNullable<CouponPayload['issueScopeType']>) {
  couponForm.issueScopeType = value
  if (value !== 'CUSTOMERS') {
    couponForm.issueCustomerIds = []
  }
  if (value !== 'NEW_USERS') {
    couponForm.issueRegisterDaysWithin = 30
  }
}

function handleUseScopeTypeChange(value: NonNullable<CouponPayload['useScopeType']>) {
  couponForm.useScopeType = value
  couponForm.useCategoryIds = []
  couponForm.useBrandIds = []
  couponForm.useProductIds = []
  couponForm.useSkuIds = []
}

async function handleSubmitCoupon() {
  await couponFormRef.value?.validate()

  couponSubmitting.value = true
  try {
    const issueRuleJson = buildIssueRuleJson()
    const useRuleJson = buildUseRuleJson()
    const payload: CouponPayload = {
      name: couponForm.name,
      code: couponForm.code || undefined,
      type: couponForm.type,
      sceneType: couponForm.sceneType,
      issueType: couponForm.issueType,
      thresholdAmount: couponForm.thresholdAmount,
      discountAmount: couponForm.type === 'DISCOUNT' ? 0.01 : couponForm.discountAmount,
      discountRate: couponForm.type === 'DISCOUNT' ? couponForm.discountRate : undefined,
      maxDiscountAmount: couponForm.type === 'DISCOUNT' ? couponForm.maxDiscountAmount : undefined,
      totalCount: couponForm.totalCount,
      perLimit: couponForm.perLimit,
      dailyLimit: couponForm.issueType === 'USER_CLAIM' ? couponForm.dailyLimit : undefined,
      claimStartTime: couponForm.issueType === 'USER_CLAIM' && couponForm.claimStartTime
        ? new Date(couponForm.claimStartTime).toISOString()
        : null,
      claimEndTime: couponForm.issueType === 'USER_CLAIM' && couponForm.claimEndTime
        ? new Date(couponForm.claimEndTime).toISOString()
        : null,
      startTime: new Date(couponForm.startTime as number).toISOString(),
      endTime: new Date(couponForm.endTime as number).toISOString(),
      validType: couponForm.validType,
      validDays: couponForm.validType === 'RELATIVE' ? couponForm.validDays : undefined,
      validDelayDays: couponForm.validType === 'RELATIVE' ? couponForm.validDelayDays : 0,
      issueScopeType: couponForm.issueScopeType,
      issueRuleJson,
      useScopeType: couponForm.useScopeType,
      useRuleJson,
      channelScope: couponForm.channelScope,
      stackable: couponForm.stackable,
      canUseWithPromotion: couponForm.canUseWithPromotion,
      canUseWithMemberPrice: couponForm.canUseWithMemberPrice,
      canUseWithPoint: couponForm.canUseWithPoint,
      canUseWithBalance: couponForm.canUseWithBalance,
      isPublic: couponForm.issueType === 'USER_CLAIM' ? couponForm.isPublic : false,
      refundReturnMode: couponForm.refundReturnMode,
      description: couponForm.description || undefined,
      sort: couponForm.sort,
      isEnabled: couponForm.isEnabled,
    }

    if (editingCouponId.value) {
      await updateCoupon(editingCouponId.value, payload)
      message.success('更新成功')
    } else {
      await createCoupon(payload)
      message.success('创建成功')
    }

    couponDialogVisible.value = false
    await loadCoupons()
  } catch (error: any) {
    message.error(error.message || '保存失败')
  } finally {
    couponSubmitting.value = false
  }
}

async function handleSubmitIssue() {
  await issueFormRef.value?.validate()
  if (!issueCouponId.value) {
    return
  }

  issueSubmitting.value = true
  try {
    const res = await issueCoupon(issueCouponId.value, {
      customerIds: issueForm.customerIds,
      remark: issueForm.remark || undefined,
    })
    message.success(res.message || '发放成功')
    issueDialogVisible.value = false
    await Promise.all([loadCoupons(), loadReceives()])
  } catch (error: any) {
    message.error(error.message || '发放失败')
  } finally {
    issueSubmitting.value = false
  }
}

function handleCouponSearch() {
  loadCoupons()
}

function handleCouponReset() {
  couponSearchForm.keyword = ''
  couponSearchForm.isEnabled = null
  loadCoupons()
}

function handleReceiveSearch() {
  receivePagination.page = 1
  loadReceives()
}

function handleReceiveReset() {
  receiveSearchForm.keyword = ''
  receiveSearchForm.couponId = null
  receiveSearchForm.status = null
  receivePagination.page = 1
  loadReceives()
}

function buildIssueRuleJson() {
  if (couponForm.issueScopeType === 'CUSTOMERS') {
    return couponForm.issueCustomerIds.length ? { customerIds: couponForm.issueCustomerIds } : undefined
  }
  if (couponForm.issueScopeType === 'NEW_USERS') {
    return couponForm.issueRegisterDaysWithin ? { registerDaysWithin: couponForm.issueRegisterDaysWithin } : undefined
  }
  return undefined
}

function buildUseRuleJson() {
  if (couponForm.useScopeType === 'CATEGORY') {
    return couponForm.useCategoryIds.length ? { categoryIds: couponForm.useCategoryIds } : undefined
  }
  if (couponForm.useScopeType === 'BRAND') {
    return couponForm.useBrandIds.length ? { brandIds: couponForm.useBrandIds } : undefined
  }
  if (couponForm.useScopeType === 'PRODUCT') {
    return couponForm.useProductIds.length ? { productIds: couponForm.useProductIds } : undefined
  }
  if (couponForm.useScopeType === 'SKU') {
    return couponForm.useSkuIds.length ? { skuIds: couponForm.useSkuIds } : undefined
  }
  return undefined
}

function toNumberArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }
  return value.map(item => Number(item)).filter(item => !Number.isNaN(item))
}

function formatMoney(value: number | string) {
  return Number(value || 0).toFixed(2)
}

function formatCouponRule(row: CouponItem) {
  if (row.type === 'DISCOUNT') {
    return `${Number(row.discountRate || 100) / 10}折${row.maxDiscountAmount ? `，最高减${formatMoney(row.maxDiscountAmount)}` : ''}`
  }
  if (row.type === 'INSTANT_REDUCTION') {
    return row.thresholdAmount > 0
      ? `满${formatMoney(row.thresholdAmount)}立减${formatMoney(row.discountAmount)}`
      : `立减${formatMoney(row.discountAmount)}`
  }
  return `满${formatMoney(row.thresholdAmount)}减${formatMoney(row.discountAmount)}`
}

function formatDateTime(value: string) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

onMounted(async () => {
  await Promise.all([loadCoupons(), loadReceives(), loadCustomers(), loadScopeOptions()])
})
</script>

<style scoped>
:deep(.n-tabs-nav) {
  justify-content: flex-start !important;
}
:deep(.n-tabs-tab) {
  flex: 0 0 auto !important;
  padding: 0 16px 12px 16px !important;
}
:deep(.n-tabs-pad) {
  padding-top: 16px !important;
}
</style>
