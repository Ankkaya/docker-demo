<script lang="ts">
export default {
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
}
</script>

<script setup lang="ts">
interface BaseFixedStyle {
  fixedBg?: Record<string, any>
}

const props = withDefaults(defineProps<{
  baseFixedStyle?: BaseFixedStyle
}>(), {
  baseFixedStyle: () => ({}),
})

const customFixedBackground = computed(() => ({
  ...props.baseFixedStyle?.fixedBg,
}))
</script>

<template>
  <view class="base-fixed">
    <view class="base-fixed-content">
      <slot />
    </view>
    <view class="base-fixed-background" :style="[customFixedBackground]" />
  </view>
</template>

<style lang="scss" scoped>
.base-fixed {
  width: 100%;
  height: 100%;
  position: fixed;
  z-index: -1;
  left: 0;
  top: 0;

  .base-fixed-content {
    position: relative;
    z-index: 1;
  }

  .base-fixed-background {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
  }
}
</style>
