<script setup lang="ts">
const props = withDefaults(defineProps<{
  icon?: string | null
  iconUrl?: string | null
  alt?: string
  size?: number | string
  color?: string
}>(), {
  icon: '',
  iconUrl: '',
  alt: 'icon',
  size: 20,
  color: '',
})

const normalizedSize = computed(() => {
  if (typeof props.size === 'number')
    return `${props.size}px`
  return props.size || '20px'
})

const imageStyle = computed(() => ({
  width: normalizedSize.value,
  height: normalizedSize.value,
}))

const fontIconStyle = computed(() => ({
  fontSize: normalizedSize.value,
  color: props.color || undefined,
  lineHeight: 1,
}))

const hasIconUrl = computed(() => !!props.iconUrl)
const hasClassIcon = computed(() => !!props.icon && props.icon.startsWith('i-'))
const hasWdIcon = computed(() => !!props.icon && !props.icon.startsWith('i-'))
</script>

<template>
  <image
    v-if="hasIconUrl"
    :src="iconUrl!"
    mode="aspectFit"
    class="block shrink-0"
    :style="imageStyle"
  />
  <text
    v-else-if="hasClassIcon"
    class="block shrink-0 leading-none"
    :class="icon"
    :style="fontIconStyle"
  />
  <wd-icon
    v-else-if="hasWdIcon"
    :name="icon!"
    :size="normalizedSize"
    :color="color || undefined"
  />
</template>
