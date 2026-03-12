<template>
  <div class="icon-picker">
    <n-input
      :value="keyword"
      placeholder="输入图标关键字，例如 bag、cart、home"
      clearable
      @update:value="handleKeywordChange"
    />
    <div class="mt-2 flex items-center justify-between text-xs text-gray-500">
      <span>{{ summaryText }}</span>
      <n-button v-if="modelValue" text size="small" @click="handleClear">清空</n-button>
    </div>

    <div v-if="selectedIconName" class="selected-icon mt-3">
      <span class="selected-label">已选图标</span>
      <button
        type="button"
        class="icon-item icon-item-active"
        :title="selectedIconName"
        @click="handleSelect(selectedIconName)"
      >
        <n-icon size="18" :component="iconModules[selectedIconName]" />
        <span class="icon-label">{{ selectedIconName }}</span>
      </button>
    </div>

    <div v-if="filteredIcons.length" class="icon-grid mt-3">
      <button
        v-for="iconName in filteredIcons"
        :key="iconName"
        type="button"
        :class="[
          'icon-item',
          modelValue === iconName ? 'icon-item-active' : ''
        ]"
        :title="iconName"
        @click="handleSelect(iconName)"
      >
        <n-icon size="18" :component="iconModules[iconName]" />
        <span class="icon-label">{{ iconName }}</span>
      </button>
    </div>
    <div v-else class="empty-state mt-3">
      没有匹配到图标，请尝试其他英文关键字
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NButton, NIcon, NInput } from 'naive-ui'
import * as Ionicons from '@vicons/ionicons5'

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const keyword = ref('')
const iconModules = Ionicons as Record<string, any>
const iconNames = Object.keys(iconModules)
  .filter(name => /^[A-Z]/.test(name))
  .sort((a, b) => a.localeCompare(b))

watch(
  () => props.modelValue,
  (value) => {
    if (!value || keyword.value.trim()) {
      return
    }
    keyword.value = value
  },
  { immediate: true },
)

const filteredIcons = computed(() => {
  const search = keyword.value.trim().toLowerCase()
  if (!search) {
    if (props.modelValue && iconModules[props.modelValue]) {
      return [props.modelValue]
    }
    return iconNames.slice(0, 12)
  }

  const startsWithMatches = iconNames.filter(name => name.toLowerCase().startsWith(search))
  const includesMatches = iconNames.filter(
    name => !name.toLowerCase().startsWith(search) && name.toLowerCase().includes(search),
  )

  return [...startsWithMatches, ...includesMatches].slice(0, 24)
})

const handleKeywordChange = (value: string) => {
  keyword.value = value
}

const handleSelect = (iconName: string) => {
  emit('update:modelValue', iconName)
}

const handleClear = () => {
  keyword.value = ''
  emit('update:modelValue', '')
}

const selectedIconName = computed(() => {
  if (!props.modelValue || !iconModules[props.modelValue]) {
    return ''
  }
  return props.modelValue
})

const summaryText = computed(() => {
  const search = keyword.value.trim()
  if (!search) {
    return props.modelValue ? '当前显示已选图标' : '输入关键字后匹配已安装图标'
  }

  return `匹配到 ${filteredIcons.value.length} 个图标`
})
</script>

<style scoped>
.selected-icon {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-label {
  font-size: 12px;
  color: rgb(107 114 128);
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 8px;
}

.icon-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid rgb(229 231 235);
  border-radius: 10px;
  background: white;
  color: rgb(75 85 99);
  transition: all 0.2s ease;
}

.icon-item:hover {
  border-color: rgb(24 160 88);
  color: rgb(24 160 88);
}

.icon-item-active {
  border-color: rgb(24 160 88);
  background: rgb(240 249 244);
  color: rgb(24 160 88);
}

.icon-label {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  padding: 12px;
  border: 1px dashed rgb(209 213 219);
  border-radius: 10px;
  text-align: center;
  font-size: 12px;
  color: rgb(107 114 128);
}
</style>
