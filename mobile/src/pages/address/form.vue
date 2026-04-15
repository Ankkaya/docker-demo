<script setup lang="ts">
import type { ColPickerColumnChange, ColPickerDisplayFormat } from 'wot-design-uni/components/wd-col-picker/types'
import {
  buildFullRegion,
  findRegionCodesByNames,
  getCityOptions,
  getDistrictOptions,
  getProvinceOptions,
  normalizeRegionNames,
} from '@/utils/address-region'

type AddressTag = '家' | '公司' | '学校' | '其他'
interface CustomerAddressPayload {
  receiverName: string
  receiverPhone: string
  province: string
  city: string
  district: string
  address: string
  tag: AddressTag
  isDefault: boolean
}

definePage({
  name: 'address-form',
  layout: 'default',
  style: {
    navigationBarTitleText: '收货地址',
    navigationStyle: 'custom',
  },
  needLogin: true,
})

const router = useRouter()
const toast = useToast()
const editingId = ref<number | null>(null)
const loading = ref(false)
const submitting = ref(false)
const regionPickerVisible = ref(false)

const tagOptions: AddressTag[] = ['家', '公司', '学校', '其他']
const heroImageUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWflscUis4bPk06JnQ1g1XhQUHoGAbm1B3XaOhP2gTAfuYWAvZMQKa-1aD8gBSMkAcJLPvkwc14ZBfRy3q32VCwqRDheZV7pZJj-tddlDhyHYNkGOrIRWb3IU0_m1TRDln9hWM8V-okhU73kgc0xhT3v_Hda0gDpqoAGnCLljP1Yw91G83sSvaNFoD5pLIUivzjgxWqK8IGztyLH28XEx7r5nmWw-ZknBqFea7wYX8xZbgDZ38qQgOqO41QdpW8psDPpGTA-0pjZzg'

const form = reactive({
  receiverName: '',
  receiverPhone: '',
  regionCodes: [] as string[],
  province: '',
  city: '',
  district: '',
  address: '',
  tag: '家' as AddressTag,
  isDefault: false,
})

const regionColumns = ref([getProvinceOptions()])

const submitText = computed(() => (editingId.value ? '更新地址' : '保存地址'))
const regionText = computed(() => buildFullRegion(form.province, form.city, form.district))
const headerTitle = computed(() => (editingId.value ? '编辑地址' : '新增地址'))
const heroTitle = computed(() => (editingId.value ? '更新收货信息' : '填写收货信息'))
const heroBadge = computed(() => (editingId.value ? '编辑地址' : '新增地址'))

const regionDisplayFormat: ColPickerDisplayFormat = selectedItems =>
  selectedItems
    .map(item => item?.label)
    .filter(Boolean)
    .join(' / ')

const regionColumnChange: ColPickerColumnChange = ({ selectedItem, index, resolve, finish }) => {
  const currentValue = String(selectedItem?.value || '')

  if (index === 0) {
    resolve(getCityOptions(currentValue))
    return
  }

  if (index === 1) {
    resolve(getDistrictOptions(currentValue))
    return
  }

  finish()
}

function getUiIcon(name: string) {
  const map: Record<string, string> = {
    back: 'i-material-symbols:arrow-back-ios-new-rounded',
    location: 'i-material-symbols:location-on-rounded',
    submit: 'i-material-symbols:check-circle-rounded',
    person: 'i-material-symbols:person-rounded',
    phone: 'i-material-symbols:phone-iphone',
    expand: 'i-material-symbols:expand-more-rounded',
    star: 'i-material-symbols:star-rounded',
  }
  return map[name] || ''
}

function updateRegionFields(selectedItems: Array<{ label?: string }>) {
  const normalized = normalizeRegionNames(
    selectedItems[0]?.label,
    selectedItems[1]?.label,
    selectedItems[2]?.label,
  )

  form.province = normalized.province
  form.city = normalized.city
  form.district = normalized.district
}

function openRegionPicker() {
  regionColumns.value = [getProvinceOptions()]
  regionPickerVisible.value = true
}

function closeRegionPicker() {
  regionPickerVisible.value = false
}

function validateForm() {
  if (!form.receiverName.trim()) {
    toast.show('请输入收货人')
    return false
  }

  if (!/^1\d{10}$/.test(form.receiverPhone.trim())) {
    toast.show('请输入有效的手机号')
    return false
  }

  if (form.regionCodes.length < 3 || !form.province || !form.city || !form.district) {
    toast.show('请选择完整的省市区')
    return false
  }

  if (!form.address.trim()) {
    toast.show('请输入详细地址')
    return false
  }

  return true
}

function buildPayload(): CustomerAddressPayload {
  return {
    receiverName: form.receiverName.trim(),
    receiverPhone: form.receiverPhone.trim(),
    province: form.province,
    city: form.city,
    district: form.district,
    address: form.address.trim(),
    tag: form.tag,
    isDefault: form.isDefault,
  }
}

function goBack() {
  router.back()
}

async function fillEditForm(id: number) {
  loading.value = true
  try {
    const detail = await (Apis.general as any).MallAddressesController_findCurrentUserAddress({
      pathParams: { id },
    }).send()
    editingId.value = detail.id
    form.receiverName = detail.receiverName
    form.receiverPhone = detail.receiverPhone
    form.address = detail.address
    form.tag = (tagOptions.includes(detail.tag as AddressTag) ? detail.tag : '其他') as AddressTag
    form.isDefault = detail.isDefault
    form.province = detail.province || ''
    form.city = detail.city || ''
    form.district = detail.district || ''
    form.regionCodes = findRegionCodesByNames(detail.province, detail.city, detail.district)
    regionColumns.value = [getProvinceOptions()]
  }
  finally {
    loading.value = false
  }
}

async function submitForm() {
  if (submitting.value || !validateForm())
    return

  submitting.value = true
  try {
    if (editingId.value) {
      await alovaInstance.Patch(`/mall/addresses/${editingId.value}`, buildPayload()).send()
      toast.show('地址已更新')
    }
    else {
      await (Apis.general as any).MallAddressesController_createCurrentUserAddress({
        data: buildPayload(),
      }).send()
      toast.show('地址已新增')
    }

    setTimeout(() => {
      router.back()
    }, 280)
  }
  finally {
    submitting.value = false
  }
}

onLoad((options) => {
  const id = Number(options?.id || 0)
  if (id > 0) {
    fillEditForm(id)
  }
})
</script>

<template>
  <page-meta :page-style="regionPickerVisible ? 'overflow:hidden;' : 'overflow:visible;'" />

  <view class="address-form-page pt-4 text-slate-900">
    <view class="top-bar">
      <view class="top-bar-inner">
        <view class="top-bar-left" @click="goBack">
          <text class="text-[18px] text-slate-600 leading-none" :class="getUiIcon('back')" />
          <text class="text-[22px] text-slate-900 font-700 tracking-tight">
            {{ headerTitle }}
          </text>
        </view>
        <view class="w-10" />
      </view>
    </view>

    <view class="px-5 pb-8">
      <view class="hero-banner">
        <image class="hero-image" :src="heroImageUrl" mode="aspectFill" />
        <view class="hero-overlay" />
        <view class="hero-copy">
          <view class="hero-badge">
            {{ heroBadge }}
          </view>
          <text class="hero-title">
            {{ heroTitle }}
          </text>
        </view>
      </view>

      <view class="mt-8 space-y-6">
        <view class="field-block">
          <text class="field-label">
            收货人
          </text>
          <view class="field-shell">
            <input
              v-model="form.receiverName" class="field-input" maxlength="30" placeholder="请输入收货人姓名"
              placeholder-class="field-placeholder"
            >
            <text class="field-icon" :class="getUiIcon('person')" />
          </view>
        </view>

        <view class="field-block">
          <text class="field-label">
            手机号
          </text>
          <view class="field-shell">
            <input
              v-model="form.receiverPhone" class="field-input" maxlength="11" type="number" placeholder="请输入电话号码"
              placeholder-class="field-placeholder"
            >
            <text class="field-icon" :class="getUiIcon('phone')" />
          </view>
        </view>

        <view class="field-block">
          <text class="field-label">
            省 / 市 / 区
          </text>
          <wd-col-picker
            v-model="form.regionCodes" title="选择所在地区" :columns="regionColumns" :auto-complete="false"
            :column-change="regionColumnChange" :display-format="regionDisplayFormat" @close="closeRegionPicker"
            @confirm="({ selectedItems }) => updateRegionFields(selectedItems)"
          >
            <view class="field-shell field-picker" @click="openRegionPicker">
              <text class="field-value" :class="regionText ? 'region-selected' : 'region-placeholder'">
                {{ regionText || '请选择所在地区' }}
              </text>
              <text class="field-icon" :class="getUiIcon('expand')" />
            </view>
          </wd-col-picker>
        </view>

        <view class="field-block">
          <text class="field-label">
            详细地址
          </text>
          <view class="textarea-shell">
            <textarea
              v-model="form.address" class="textarea-input" maxlength="120" placeholder="请输入街道、楼栋门牌、单元房号等"
              placeholder-class="field-placeholder"
            />
          </view>
        </view>

        <view class="field-block">
          <text class="field-label">
            地址标签
          </text>
          <view class="grid grid-cols-4 mt-2 gap-3">
            <view
              v-for="tag in tagOptions" :key="tag" class="tag-chip"
              :class="form.tag === tag ? 'tag-chip-active' : 'tag-chip-idle'" @click="form.tag = tag"
            >
              {{ tag }}
            </view>
          </view>
        </view>

        <view class="default-card">
          <view class="flex items-center gap-3">
            <view class="default-icon">
              <text class="text-[18px] text-[#efb239] leading-none" :class="getUiIcon('star')" />
            </view>
            <view>
              <text class="block text-sm text-slate-900 font-700">
                设为默认地址
              </text>
              <text class="mt-1 block text-[10px] text-slate-500">
                后续下单时优先自动带出
              </text>
            </view>
          </view>
          <wd-switch v-model="form.isDefault" active-color="#efb239" />
        </view>
      </view>

      <view class="divider-wrap">
        <view class="divider-bar" />
      </view>
    </view>

    <view class="bottom-bar">
      <view
        class="submit-btn py-4 text-center text-sm text-white font-700" :class="submitting ? 'opacity-70' : ''"
        @click="submitForm"
      >
        <view class="flex items-center justify-center gap-2">
          <text class="text-[18px] text-white leading-none" :class="getUiIcon('submit')" />
          {{ submitting ? '提交中...' : submitText }}
        </view>
      </view>
    </view>

  </view>
</template>

<style scoped>
.address-form-page {
  background: #f8f7f6;
}

.top-bar {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(16px);
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
}

.top-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 16px;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero-banner {
  position: relative;
  overflow: hidden;
  height: 160px;
  border-radius: 24px;
  background: #3f7e85;
}

.hero-image {
  height: 100%;
  width: 100%;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.06) 0%, rgba(15, 23, 42, 0.48) 100%);
}

.hero-copy {
  position: absolute;
  left: 18px;
  bottom: 16px;
  z-index: 2;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #efb239;
  padding: 4px 10px;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.hero-title {
  display: block;
  margin-top: 8px;
  color: #fff;
  font-size: 26px;
  font-weight: 800;
  line-height: 1.05;
}

.field-block {
  display: block;
}

.field-label {
  display: block;
  margin-left: 4px;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.field-shell,
.textarea-shell {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(239, 178, 57, 0.12);
}

.field-shell {
  display: flex;
  min-height: 56px;
  align-items: center;
  padding: 0 44px 0 16px;
}

.field-picker {
  justify-content: space-between;
}

.field-input,
.field-value {
  width: 100%;
  font-size: 14px;
}

.region-selected {
  color: #0f172a;
}

.textarea-input {
  min-height: 120px;
  width: 100%;
  padding: 16px;
  color: #0f172a;
  font-size: 14px;
  line-height: 1.6;
}

.field-placeholder {
  color: #94a3b8;
  font-size: 14px;
}

.region-placeholder {
  color: #808080;
}

.field-icon {
  position: absolute;
  right: 16px;
  color: rgba(239, 178, 57, 0.45);
  font-size: 18px;
}

.field-icon {
  top: 50%;
  transform: translateY(-50%);
}

.tag-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  padding: 12px 0;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.tag-chip-active {
  background: #efb239;
  color: #fff;
  box-shadow: 0 12px 20px rgba(239, 178, 57, 0.2);
}

.tag-chip-idle {
  background: #fff;
  color: #64748b;
  box-shadow: inset 0 0 0 1px rgba(239, 178, 57, 0.12);
}

.default-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 20px;
  border: 1px solid rgba(239, 178, 57, 0.1);
  background: rgba(239, 178, 57, 0.05);
  padding: 16px;
}

.default-icon {
  display: flex;
  height: 40px;
  width: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

.divider-wrap {
  display: flex;
  justify-content: center;
  padding: 48px 0 12px;
}

.divider-bar {
  height: 4px;
  width: 48px;
  border-radius: 999px;
  background: #fef3c7;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.82);
  padding: 16px 24px 24px;
  box-shadow: 0 -4px 20px rgba(15, 23, 42, 0.04);
  backdrop-filter: blur(18px);
}

.submit-btn {
  border-radius: 18px;
  background: #efb239;
  box-shadow: 0 18px 30px rgba(239, 178, 57, 0.22);
}

</style>
