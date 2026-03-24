<script setup lang="ts">
/**
 * 地址管理页面 - 参考 Stitch 设计稿
 */

definePage({
  name: 'address',
  layout: 'default',
  style: {
    navigationBarTitleText: '地址管理',
    navigationStyle: 'custom',
  },
  needLogin: true
})

const router = useRouter()

const addresses = ref([
  {
    id: 1,
    name: 'Joyful Parent',
    phone: '138****2409',
    tag: '家',
    isDefault: true,
    address: '上海市浦东新区世纪大道 100 号 12-903',
  },
  {
    id: 2,
    name: 'Yoyo',
    phone: '176****8812',
    tag: '公司',
    isDefault: false,
    address: '上海市静安区南京西路 1168 号 8F',
  },
  {
    id: 3,
    name: 'Grandma',
    phone: '186****5420',
    tag: '备用',
    isDefault: false,
    address: '浙江省杭州市西湖区文三路 78 号 2-401',
  },
])

function getAddressIcon(tag: string, isDefault: boolean) {
  if (isDefault)
    return 'i-material-symbols:home'
  if (tag === '公司')
    return 'i-material-symbols:work'
  return 'i-material-symbols:location-on'
}

function getAddressUiIcon(name: string) {
  const map: Record<string, string> = {
    back: 'i-material-symbols:arrow-back',
    more: 'i-material-symbols:more-vert',
    edit: 'i-material-symbols:edit',
    delete: 'i-material-symbols:delete',
    checked: 'i-material-symbols:check-circle',
    unchecked: 'i-material-symbols:radio-button-unchecked',
    add: 'i-material-symbols:add-location-alt',
    deco: 'i-material-symbols:child-care',
  }
  return map[name] || ''
}

function goBack() {
  router.back()
}

function addAddress() {
  const nextId = Math.max(0, ...addresses.value.map(item => item.id)) + 1
  addresses.value.unshift({
    id: nextId,
    name: 'New Parent',
    phone: '139****0001',
    tag: '新地址',
    isDefault: false,
    address: '上海市徐汇区漕溪北路 399 号 16-1602',
  })
  uni.showToast({ title: '已新增地址', icon: 'success' })
}

function editAddress(id: number) {
  addresses.value = addresses.value.map(item => item.id === id
    ? {
      ...item,
      tag: item.tag === '已编辑' ? '常用' : '已编辑',
      address: item.address.includes('（已编辑）') ? item.address : `${item.address}（已编辑）`,
    }
    : item)
  uni.showToast({ title: '已更新地址', icon: 'success' })
}

function deleteAddress(id: number) {
  addresses.value = addresses.value.filter(item => item.id !== id)
  uni.showToast({ title: '已删除', icon: 'none' })
}

function setDefault(id: number) {
  addresses.value = addresses.value.map(item => ({
    ...item,
    isDefault: item.id === id,
  }))
}
</script>

<template>
  <view class="address-page text-slate-900">
    <scroll-view scroll-y class="pb-28">
      <view class="px-4 pt-4">
        <view v-for="item in addresses" :key="item.id"
          class="address-card mb-4 overflow-hidden rounded-2xl bg-white p-5"
          :class="item.isDefault ? 'address-card-default' : 'address-card-normal'">
          <view class="flex items-start justify-between">
            <view class="flex items-center gap-2">
              <view class="size-10 flex items-center justify-center rounded-2xl bg-[#efb239]/12">
                <text class="text-[20px] text-[#efb239] leading-none"
                  :class="getAddressIcon(item.tag, item.isDefault)" />
              </view>
              <view v-if="item.isDefault"
                class="rounded-full bg-[#efb239]/18 px-2 py-0.5 text-[10px] text-[#c98500] font-bold tracking-[0.08em]">
                DEFAULT
              </view>
            </view>

            <view class="flex items-center gap-3">
              <view class="size-8 flex items-center justify-center rounded-full bg-[#f8f7f6]"
                @click="editAddress(item.id)">
                <text class="text-[18px] text-slate-400 leading-none" :class="getAddressUiIcon('edit')" />
              </view>
              <view class="size-8 flex items-center justify-center rounded-full bg-[#f8f7f6]"
                @click="deleteAddress(item.id)">
                <text class="text-[18px] text-red-500 leading-none" :class="getAddressUiIcon('delete')" />
              </view>
            </view>
          </view>

          <view class="mt-4 space-y-1">
            <view class="flex items-center gap-2">
              <text class="text-base font-bold">
                {{ item.name }}
              </text>
              <text class="text-sm text-[#efb239] font-medium">
                {{ item.phone }}
              </text>
            </view>
            <text class="block text-sm leading-6 text-slate-500">
              {{ item.address }}
            </text>
          </view>

          <view class="mt-4 flex items-center justify-between border-t border-[#efb239]/8 pt-3 text-xs text-slate-500">
            <view class="flex items-center gap-1.5" @click="setDefault(item.id)">
              <text class="text-[16px] text-[#efb239] leading-none"
                :class="item.isDefault ? getAddressUiIcon('checked') : getAddressUiIcon('unchecked')" />
              设为默认
            </view>
            <view class="rounded-full bg-[#f8f7f6] px-3 py-1 text-[11px] text-slate-500 font-medium">
              {{ item.tag }}
            </view>
          </view>
        </view>

        <view class="pb-8 pt-4 text-center text-[#c8c1b8]">
          <text class="text-[44px] text-[#d6cec4] leading-none" :class="getAddressUiIcon('deco')" />
        </view>
      </view>
    </scroll-view>

    <view class="fixed bottom-0 left-0 right-0 z-40 bg-[#f8f7f6]/88 p-4 pb-6 backdrop-blur-md">
      <view class="address-action rounded-2xl bg-[#efb239] py-4 text-center text-sm text-slate-900 font-bold"
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
    linear-gradient(180deg, #f8f7f6 0%, #f8f7f6 30%, #f2eee8 100%);
}

.address-card {
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.address-card-default {
  border: 2px solid #efb239;
}

.address-card-normal {
  border: 1px solid rgba(239, 178, 57, 0.1);
}

.address-action {
  box-shadow: 0 14px 28px rgba(239, 178, 57, 0.25);
}
</style>
