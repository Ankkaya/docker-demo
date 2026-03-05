<script lang="ts" setup>
const { statusBarHeight } = usePlatform()
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
  <view class="base-statusbar" />
</template>

<style lang="scss" scoped>
.base-statusbar {
  height: v-bind('`${statusBarHeight}px`');
}
</style>
