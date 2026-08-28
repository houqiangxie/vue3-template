<script setup lang="ts">
import type { FieldOption } from '@/components/common/table/fieldSchema'
import type { SqlCompareOperator, SqlFieldType } from './types'
import { sqlSearchLabels } from './labels'
import {
  normalizeBooleanValue,
  operatorNeedsArrayValue,
  operatorNeedsRangeValue,
  toDatePickerTimestamp,
} from './utils'

const props = defineProps<{
  fieldType: SqlFieldType
  operator: SqlCompareOperator
  value: unknown
  options?: FieldOption[]
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  update: [value: unknown]
}>()

const isArrayValue = computed(() => operatorNeedsArrayValue(props.operator))
const isRangeValue = computed(() => operatorNeedsRangeValue(props.operator))

const rangeValue = computed(() => {
  const val = props.value
  if (Array.isArray(val))
    return [val[0] ?? null, val[1] ?? null] as [unknown, unknown]
  return [null, null] as [unknown, unknown]
})

const datePickerValue = computed(() => toDatePickerTimestamp(props.value))

const dateRangePickerValue = computed(() => {
  const start = toDatePickerTimestamp(rangeValue.value[0])
  const end = toDatePickerTimestamp(rangeValue.value[1])
  if (start == null || end == null)
    return null
  return [start, end] as [number, number]
})

const booleanSelectValue = computed(() => {
  const bool = normalizeBooleanValue(props.value)
  if (bool == null)
    return null
  return bool ? 'true' : 'false'
})

const booleanOptions = [
  { label: sqlSearchLabels.booleanTrue, value: 'true' },
  { label: sqlSearchLabels.booleanFalse, value: 'false' },
]

function onBooleanChange(v: string | null) {
  if (v === 'true')
    emit('update', true)
  else if (v === 'false')
    emit('update', false)
  else
    emit('update', undefined)
}

function updateRange(index: 0 | 1, next: unknown) {
  const pair: [unknown, unknown] = [...rangeValue.value] as [unknown, unknown]
  pair[index] = next
  emit('update', pair)
}
</script>

<template>
  <!-- 下拉 -->
  <n-select
    v-if="fieldType === 'select' && !isArrayValue"
    class="sql-search-value"
    :value="(value as string | number | null) ?? null"
    :options="(options ?? []) as any"
    :placeholder="sqlSearchLabels.selectPlaceholder"
    :disabled="disabled"
    clearable
    size="small"
    @update:value="v => emit('update', v)"
  />
  <n-select
    v-else-if="fieldType === 'select' && isArrayValue"
    class="sql-search-value"
    :value="(value as Array<string | number>) ?? []"
    :options="(options ?? []) as any"
    :placeholder="sqlSearchLabels.selectMultiplePlaceholder"
    :disabled="disabled"
    multiple
    clearable
    size="small"
    @update:value="v => emit('update', v)"
  />

  <!-- 数字 -->
  <n-input-number
    v-else-if="fieldType === 'number' && !isRangeValue && !isArrayValue"
    class="sql-search-value"
    :value="value as number | null"
    :disabled="disabled"
    clearable
    size="small"
    @update:value="v => emit('update', v)"
  />
  <div v-else-if="fieldType === 'number' && isRangeValue" class="sql-search-value-range">
    <n-input-number
      :value="rangeValue[0] as number | null"
      :placeholder="sqlSearchLabels.rangeMin"
      :disabled="disabled"
      clearable
      size="small"
      @update:value="v => updateRange(0, v)"
    />
    <span class="sql-search-value-range__sep">~</span>
    <n-input-number
      :value="rangeValue[1] as number | null"
      :placeholder="sqlSearchLabels.rangeMax"
      :disabled="disabled"
      clearable
      size="small"
      @update:value="v => updateRange(1, v)"
    />
  </div>

  <!-- 日期 / 日期时间 -->
  <n-date-picker
    v-else-if="(fieldType === 'date' || fieldType === 'datetime') && !isRangeValue"
    class="sql-search-value"
    :type="fieldType === 'datetime' ? 'datetime' : 'date'"
    :value="datePickerValue"
    :disabled="disabled"
    clearable
    size="small"
    @update:value="v => emit('update', v)"
  />
  <n-date-picker
    v-else-if="(fieldType === 'date' || fieldType === 'datetime') && isRangeValue"
    class="sql-search-value"
    :type="fieldType === 'datetime' ? 'datetimerange' : 'daterange'"
    :value="dateRangePickerValue"
    :disabled="disabled"
    clearable
    size="small"
    @update:value="v => emit('update', v)"
  />

  <!-- 布尔：控件用字符串，对外 emit boolean -->
  <n-select
    v-else-if="fieldType === 'boolean'"
    class="sql-search-value"
    :value="booleanSelectValue"
    :options="booleanOptions"
    :placeholder="sqlSearchLabels.selectPlaceholder"
    :disabled="disabled"
    clearable
    size="small"
    @update:value="onBooleanChange"
  />

  <!-- 多值输入（in / notIn） -->
  <n-select
    v-else-if="isArrayValue"
    class="sql-search-value"
    :value="(value as string[]) ?? []"
    :placeholder="sqlSearchLabels.tagPlaceholder"
    :disabled="disabled"
    filterable
    multiple
    tag
    clearable
    size="small"
    @update:value="v => emit('update', v)"
  />

  <!-- 范围文本 -->
  <div v-else-if="isRangeValue" class="sql-search-value-range">
    <n-input
      :value="String(rangeValue[0] ?? '')"
      :placeholder="sqlSearchLabels.rangeStart"
      :disabled="disabled"
      clearable
      size="small"
      @update:value="v => updateRange(0, v)"
    />
    <span class="sql-search-value-range__sep">~</span>
    <n-input
      :value="String(rangeValue[1] ?? '')"
      :placeholder="sqlSearchLabels.rangeEnd"
      :disabled="disabled"
      clearable
      size="small"
      @update:value="v => updateRange(1, v)"
    />
  </div>

  <!-- 默认文本 -->
  <n-input
    v-else
    class="sql-search-value"
    :value="String(value ?? '')"
    :placeholder="placeholder || sqlSearchLabels.valuePlaceholder"
    :disabled="disabled"
    clearable
    size="small"
    @update:value="v => emit('update', v)"
  />
</template>

<style scoped>
.sql-search-value {
  flex: 2 1 160px;
  min-width: 140px;
}

.sql-search-value-range {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 2 1 200px;
  min-width: 180px;
}

.sql-search-value-range__sep {
  color: var(--n-text-color-3);
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .sql-search-value,
  .sql-search-value-range {
    flex: 1 1 100%;
    min-width: 0;
    width: 100%;
  }
}
</style>
