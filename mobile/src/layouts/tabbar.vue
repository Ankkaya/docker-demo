<script lang="ts" setup>
import AuthLoginSheet from '@/components/AuthLoginSheet.vue'

const router = useRouter()

const route = useRoute()

const { activeTabbar, getTabbarItemValue, setTabbarItemActive, tabbarList } = useTabbar()

function handleTabbarChange({ value }: { value: string }) {
  setTabbarItemActive(value)
  router.pushTab({ name: value })
}

onShow(() => {
  // #ifdef APP-PLUS
  uni.hideTabBar()
  // #endif

  nextTick(() => {
    if (route.name && route.name !== activeTabbar.value.name) {
      setTabbarItemActive(route.name)
    }
  })
})
</script>

<script lang="ts">
export default {
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
}
</script>

<template>
  <slot />
  <AuthLoginSheet />
  <wd-gap safe-area-bottom height="var(--wot-tabbar-height, 50px)" />
  <wd-tabbar :model-value="activeTabbar.name" bordered safe-area-inset-bottom fixed @change="handleTabbarChange">
    <wd-tabbar-item
      v-for="(item, index) in tabbarList" :key="index" :name="item.name"
      :value="getTabbarItemValue(item.name)" :title="item.title" :icon="item.icon"
    >
      <template #icon="{ active }">
        <!-- 使用静态类名确保 UnoCSS 能正确扫描 -->
        <!-- i-material-symbols:house i-material-symbols:category-rounded i-material-symbols:shopping-cart i-material-symbols:account-circle -->
        <view
          class="size-5"
          :class="[
            item.name === 'home' ? 'i-material-symbols:house' : '',
            item.name === 'category' ? 'i-material-symbols:category-rounded' : '',
            item.name === 'cart' ? 'i-material-symbols:shopping-cart' : '',
            item.name === 'user' ? 'i-material-symbols:account-circle' : '',
            active ? 'text-primary' : 'text-slate-400',
          ]"
        />
      </template>
    </wd-tabbar-item>
  </wd-tabbar>
</template>
