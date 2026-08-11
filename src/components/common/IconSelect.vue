<script setup lang="ts">
import type { Component } from 'vue'
import * as AntdIcons from '@vicons/antd'
import { NIcon, NInput, NPopover } from 'naive-ui'

const props = withDefaults(defineProps<{
  disabled?: boolean
  readonly?: boolean
  placeholder?: string
  clearable?: boolean
}>(), {
  disabled: false,
  readonly: false,
  placeholder: '点击选择图标',
  clearable: true,
})

const value = defineModel<string>('value', { default: '' })

const iconMap = AntdIcons as Record<string, Component>
const iconNames = Object.keys(iconMap).filter(name => /^[A-Z]/.test(name)).sort()

const show = ref(false)
const keyword = ref('')

const filteredIcons = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q)
    return iconNames
  return iconNames.filter(name => name.toLowerCase().includes(q))
})

const CurrentIcon = computed(() => {
  if (!value.value)
    return null
  return iconMap[value.value] ?? null
})

function selectIcon(name: string) {
  value.value = name
  show.value = false
  keyword.value = ''
}

function clearIcon(e: MouseEvent) {
  e.stopPropagation()
  value.value = ''
}

const interactive = computed(() => !props.disabled && !props.readonly)
</script>

<template>
  <NPopover
    v-model:show="show"
    trigger="click"
    placement="bottom-start"
    :disabled="!interactive"
    display-directive="show"
    :style="{ padding: '12px', width: '420px' }"
  >
    <template #trigger>
      <div
        class="icon-select-trigger"
        :class="{
          'icon-select-trigger--disabled': !interactive,
          'icon-select-trigger--active': show,
        }"
      >
        <span class="icon-select-trigger__preview">
          <NIcon v-if="CurrentIcon" :size="18" :component="CurrentIcon" />
          <span v-else class="icon-select-trigger__placeholder">{{ placeholder }}</span>
        </span>
        <span v-if="value" class="icon-select-trigger__name">{{ value }}</span>
        <button
          v-if="clearable && value && interactive"
          type="button"
          class="icon-select-trigger__clear"
          @click="clearIcon"
        >
          ×
        </button>
      </div>
    </template>

    <div class="icon-select-panel">
      <NInput
        v-model:value="keyword"
        clearable
        size="small"
        placeholder="搜索图标名称"
        class="mb-2"
      />
      <div class="icon-select-panel__grid">
        <button
          v-for="name in filteredIcons"
          :key="name"
          type="button"
          class="icon-select-panel__item"
          :class="{ 'icon-select-panel__item--active': name === value }"
          :title="name"
          @click="selectIcon(name)"
        >
          <NIcon :size="20" :component="iconMap[name]" />
        </button>
        <div v-if="!filteredIcons.length" class="icon-select-panel__empty">
          无匹配图标
        </div>
      </div>
    </div>
  </NPopover>
</template>

<style scoped lang="scss">
.icon-select-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid var(--n-border-color, #e0e0e6);
  border-radius: 3px;
  background: var(--n-color, #fff);
  cursor: pointer;
  box-sizing: border-box;

  &--active {
    border-color: var(--n-primary-color, #18a058);
  }

  &--disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &__preview {
    display: inline-flex;
    align-items: center;
    min-width: 20px;
  }

  &__placeholder {
    color: var(--n-placeholder-color, #c0c0c0);
    font-size: 13px;
  }

  &__name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: var(--n-text-color, #333);
  }

  &__clear {
    border: none;
    background: transparent;
    color: #999;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    padding: 0 2px;
  }
}

.icon-select-panel {
  &__grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 6px;
    max-height: 280px;
    overflow: auto;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
    color: var(--n-text-color, #333);

    &:hover {
      background: rgba(24, 160, 88, 0.08);
      border-color: rgba(24, 160, 88, 0.3);
    }

    &--active {
      color: var(--n-primary-color, #18a058);
      border-color: var(--n-primary-color, #18a058);
      background: rgba(24, 160, 88, 0.1);
    }
  }

  &__empty {
    grid-column: 1 / -1;
    text-align: center;
    color: #999;
    padding: 24px 0;
    font-size: 13px;
  }
}
</style>
