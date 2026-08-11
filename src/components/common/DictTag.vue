<script setup lang="ts">
import type { DictOption } from '@/hooks/useDict'
import { NTag } from 'naive-ui'

type TagType = 'default' | 'error' | 'primary' | 'info' | 'success' | 'warning'

const props = withDefaults(defineProps<{
  options?: DictOption[] | Array<{ label: string, value: string | number | boolean, listClass?: string }>
  value?: string | number | boolean | Array<string | number | boolean> | null
  size?: 'small' | 'medium' | 'large'
}>(), {
  options: () => [],
  size: 'small',
})

const LIST_CLASS_MAP: Record<string, TagType> = {
  default: 'default',
  primary: 'primary',
  success: 'success',
  info: 'info',
  warning: 'warning',
  danger: 'error',
  error: 'error',
}

function resolveTagType(listClass?: string): TagType {
  if (!listClass)
    return 'default'
  return LIST_CLASS_MAP[listClass] ?? 'default'
}

const matched = computed(() => {
  const values = Array.isArray(props.value)
    ? props.value
    : props.value === null || props.value === undefined || props.value === ''
      ? []
      : [props.value]

  return values.map((val) => {
    const hit = props.options.find(o => o.value === val || String(o.value) === String(val))
    return {
      key: String(val),
      label: hit?.label ?? String(val),
      type: resolveTagType(hit?.listClass),
    }
  })
})
</script>

<template>
  <span class="dict-tag">
    <NTag
      v-for="item in matched"
      :key="item.key"
      :type="item.type"
      :size="size"
      class="dict-tag__item"
    >
      {{ item.label }}
    </NTag>
    <span v-if="!matched.length">—</span>
  </span>
</template>

<style scoped>
.dict-tag {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.dict-tag__item {
  margin: 0;
}
</style>
