<script lang="ts" setup>
import { computed, useAttrs } from 'vue'

defineOptions({
  name: 'AppButton',
  inheritAttrs: false,
})

interface AppButtonProps {
  customClass?: string
  customStyle?: string | Record<string, any>
}

const props = withDefaults(defineProps<AppButtonProps>(), {
  customClass: '',
  customStyle: '',
})

const attrs = useAttrs()
const emit = defineEmits([
  'click',
  'getuserinfo',
  'contact',
  'getphonenumber',
  'getrealtimephonenumber',
  'error',
  'launchapp',
  'opensetting',
  'chooseavatar',
  'agreeprivacyauthorization',
])

const mergedCustomClass = computed(() => ['app-button', props.customClass].filter(Boolean).join(' '))
</script>

<template>
  <wd-button
    v-bind="attrs"
    :custom-class="mergedCustomClass"
    :custom-style="props.customStyle"
    @click="emit('click', $event)"
    @getuserinfo="emit('getuserinfo', $event)"
    @contact="emit('contact', $event)"
    @getphonenumber="emit('getphonenumber', $event)"
    @getrealtimephonenumber="emit('getrealtimephonenumber', $event)"
    @error="emit('error', $event)"
    @launchapp="emit('launchapp', $event)"
    @opensetting="emit('opensetting', $event)"
    @chooseavatar="emit('chooseavatar', $event)"
    @agreeprivacyauthorization="emit('agreeprivacyauthorization', $event)"
  >
    <slot />
  </wd-button>
</template>

<style lang="scss" scoped>
:deep(.app-button) {
  box-sizing: border-box;
}
</style>
