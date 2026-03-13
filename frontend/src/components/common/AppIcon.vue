<template>
  <img
    v-if="iconUrl"
    :src="iconUrl"
    :alt="altText"
    :style="imageStyle"
    class="inline-block object-contain align-middle"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  iconUrl?: string | null
  size?: number | string
  alt?: string
}>(), {
  iconUrl: '',
  size: 18,
  alt: '',
})

const imageStyle = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}px` : props.size
  return {
    width: size,
    height: size,
  }
})

const altText = computed(() => props.alt || 'icon')
</script>
