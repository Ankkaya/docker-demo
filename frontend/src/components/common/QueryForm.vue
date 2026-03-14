<template>
  <n-form class="query-form transition-theme" inline label-placement="left" v-bind="$attrs">
    <slot />
  </n-form>
</template>

<script setup lang="ts">
defineOptions({
  inheritAttrs: false
})
</script>

<style lang="scss">
.query-form {
  .n-form-item-feedback-wrapper {
    height: 0 !important;
    min-height: 0 !important
  }
}
</style>
