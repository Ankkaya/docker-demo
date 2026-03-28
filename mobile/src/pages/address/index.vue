<script setup lang="ts">
import { useCheckoutStore } from '@/store/checkoutStore'

type CustomerAddressItem = any

definePage({
  name: 'address',
  layout: 'default',
  style: {
    navigationBarTitleText: '地址管理',
    navigationStyle: 'custom',
  },
  needLogin: true,
})

const router = useRouter()
const route = useRoute()
const checkoutStore = useCheckoutStore()
const toast = useToast()

const loading = ref(false)
const actionId = ref<number | null>(null)
const addresses = ref<CustomerAddressItem[]>([])
const source = ref('')
const selectedAddressId = ref<number | null>(null)
const isSelectingForOrderPayment = computed(() => source.value === 'order-payment')
const activeSelectedAddressId = computed(() => {
  if (selectedAddressId.value)
    return selectedAddressId.value
  return checkoutStore.selectedAddress?.id ?? null
})

function getAddressIcon(tag?: string | null) {
  if (tag === '家')
    return 'i-material-symbols:home-rounded'
  if (tag === '公司')
    return 'i-material-symbols:apartment-rounded'
  if (tag === '学校')
    return 'i-material-symbols:school-rounded'
  return 'i-material-symbols:location-on-rounded'
}

function getAddressUiIcon(name: string) {
  const map: Record<string, string> = {
    edit: 'i-material-symbols:edit-rounded',
    delete: 'i-material-symbols:delete-rounded',
    checked: 'i-material-symbols:check-circle',
    unchecked: 'i-material-symbols:radio-button-unchecked',
    add: 'i-material-symbols:add-location-alt-rounded',
    empty: 'i-material-symbols:location-off-rounded',
  }
  return map[name] || ''
}

function maskPhone(phone: string) {
  if (!/^1\d{10}$/.test(phone))
    return phone
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

async function fetchAddresses() {
  loading.value = true
  try {
    const list = await (Apis.general as any).MallAddressesController_findCurrentUserAddresses({}).send()
    addresses.value = Array.isArray(list) ? list : []
    if (!activeSelectedAddressId.value) {
      const currentSelected = addresses.value.find(item => item.id === checkoutStore.selectedAddress?.id)
      if (currentSelected) {
        selectedAddressId.value = currentSelected.id
      }
    }
  }
  finally {
    loading.value = false
  }
}

function selectAddress(item: CustomerAddressItem) {
  if (!isSelectingForOrderPayment.value)
    return

  selectedAddressId.value = item.id
  checkoutStore.setSelectedAddress({
    id: item.id,
    receiverName: item.receiverName,
    receiverPhone: item.receiverPhone,
    fullAddress: item.fullAddress,
    tag: item.tag || null,
    isDefault: item.isDefault,
  })
  router.replace({
    name: 'order-payment',
    query: {
      source: 'order-payment',
    },
  })
}

function addAddress() {
  router.push({
    path: '/pages/address/form',
    query: {
      source: source.value,
      addressId: selectedAddressId.value ? String(selectedAddressId.value) : '',
    },
  })
}

function editAddress(id: number) {
  router.push({
    path: '/pages/address/form',
    query: {
      id: String(id),
      source: source.value,
      addressId: selectedAddressId.value ? String(selectedAddressId.value) : '',
    },
  })
}

async function deleteAddress(id: number) {
  const result = await uni.showModal({
    title: '删除地址',
    content: '删除后不可恢复，确定继续吗？',
    confirmColor: '#efb239',
  })

  if (!result.confirm)
    return

  actionId.value = id
  try {
    await (Apis.general as any).MallAddressesController_removeCurrentUserAddress({
      pathParams: { id },
    }).send()
    toast.show('地址已删除')
    await fetchAddresses()
  }
  finally {
    actionId.value = null
  }
}

async function setDefault(id: number) {
  if (actionId.value)
    return

  actionId.value = id
  try {
    await alovaInstance.Patch(`/mall/addresses/${id}/default`, {}).send()
    addresses.value = addresses.value.map(item => ({
      ...item,
      isDefault: item.id === id,
    }))
    toast.show('已设为默认地址')
    await fetchAddresses()
  }
  finally {
    actionId.value = null
  }
}

onShow(() => {
  if (checkoutStore.selectedAddress?.id) {
    selectedAddressId.value = checkoutStore.selectedAddress.id
  }
  fetchAddresses()
})

onLoad((options) => {
  source.value = String(options?.source || '')
  const addressId = Number(options?.addressId || 0)
  selectedAddressId.value = Number.isNaN(addressId) || addressId <= 0
    ? checkoutStore.selectedAddress?.id ?? null
    : addressId
})
</script>

<template>
  <view class="address-page text-slate-900">
    <scroll-view scroll-y class="pb-28">
      <view class="px-4 pb-36 pt-6">
        <view v-if="!loading && addresses.length === 0"
          class="rounded-[28rpx] border border-dashed border-[#efb239]/25 bg-white/72 px-6 py-12 text-center shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
          <text class="mx-auto mb-4 block text-[52rpx] text-[#d3c4a0]" :class="getAddressUiIcon('empty')" />
          <text class="block text-base text-slate-800 font-600">
            还没有收货地址
          </text>
          <text class="mt-2 block text-sm leading-6 text-slate-500">
            新增一个地址后，结算页可直接带出收货信息。
          </text>
        </view>

        <view v-for="item in addresses" :key="item.id"
          class="address-card mb-4 overflow-hidden rounded-[30rpx] bg-white px-5 py-5"
          :class="[
            isSelectingForOrderPayment && activeSelectedAddressId === item.id
              ? 'address-card-selected'
              : 'address-card-normal',
          ]"
          @click="selectAddress(item)">
          <view class="flex items-start justify-between gap-3">
            <view class="flex items-center gap-3">
              <view class="size-11 flex items-center justify-center rounded-[20rpx] bg-[#fff8eb]">
                <text class="text-[24px] text-[#efb239] leading-none"
                  :class="getAddressIcon(item.tag)" />
              </view>
              <view class="min-w-0 flex-1">
                <view class="flex items-center gap-2">
                  <text class="truncate text-[17px] text-slate-900 font-700">
                    {{ item.receiverName }}
                  </text>
                  <text class="text-[13px] text-[#b3821d] font-600">
                    {{ maskPhone(item.receiverPhone) }}
                  </text>
                </view>
                <view class="mt-2 flex items-center gap-2">
                  <view v-if="item.isDefault"
                    class="rounded-full bg-[#efb239]/16 px-2.5 py-1 text-[10px] text-[#b3821d] font-700 tracking-[0.16em]">
                    默认地址
                  </view>
                  <view v-if="item.tag" class="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500 font-600">
                    {{ item.tag }}
                  </view>
                </view>
              </view>
            </view>

            <view class="flex items-center gap-2">
              <view class="action-icon" @click.stop="editAddress(item.id)">
                <text class="text-[18px] text-slate-400 leading-none" :class="getAddressUiIcon('edit')" />
              </view>
              <view class="action-icon" @click.stop="deleteAddress(item.id)">
                <text class="text-[18px] text-slate-400 leading-none" :class="getAddressUiIcon('delete')" />
              </view>
            </view>
          </view>

          <text class="mt-4 block text-sm leading-7 text-slate-500">
            {{ item.fullAddress }}
          </text>

          <view class="mt-4 flex items-center justify-between border-t border-[#efb239]/10 pt-3">
            <view class="flex items-center gap-1.5 text-xs text-slate-500"
              :class="actionId === item.id ? 'opacity-55' : ''" @click.stop="setDefault(item.id)">
              <text class="text-[17px] text-[#efb239] leading-none"
                :class="item.isDefault ? getAddressUiIcon('checked') : getAddressUiIcon('unchecked')" />
              设为默认地址
            </view>
            <text class="text-[11px] text-slate-400">
              {{ item.province }} {{ item.city }} {{ item.district }}
            </text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="fixed bottom-0 left-0 right-0 z-40 bg-[#f8f7f6]/92 p-4 pb-6 backdrop-blur-md">
      <view class="address-action rounded-[28rpx] bg-[#efb239] py-4 text-center text-sm text-slate-900 font-700"
        @click="addAddress">
        <view class="flex items-center justify-center gap-2">
          <text class="text-[18px] text-slate-900 leading-none" :class="getAddressUiIcon('add')" />
          新增地址
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.address-page {
  background:
    radial-gradient(circle at top right, rgba(239, 178, 57, 0.14), transparent 30%),
    linear-gradient(180deg, #f8f7f6 0%, #f6f1e9 46%, #f1ece3 100%);
}

.address-card {
  position: relative;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.address-card-selected {
  border: 2px solid rgba(239, 178, 57, 0.74);
  box-shadow: 0 18px 40px rgba(239, 178, 57, 0.18);
  transform: translateY(-2px);
}

.address-card-normal {
  border: 1px solid rgba(239, 178, 57, 0.12);
}

.address-card-selected::after {
  position: absolute;
  top: 18px;
  right: 18px;
  display: flex;
  height: 22px;
  min-width: 22px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #efb239;
  color: #fff;
  content: '✓';
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 8px 18px rgba(239, 178, 57, 0.28);
}

.address-action {
  box-shadow: 0 18px 34px rgba(239, 178, 57, 0.26);
}

.action-icon {
  display: flex;
  height: 34px;
  width: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #f8f7f6;
}
</style>
