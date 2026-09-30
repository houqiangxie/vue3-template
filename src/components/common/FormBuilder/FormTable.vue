<script setup lang="ts">
import type { UnifiedFieldConfig } from '@/components/common/table/fieldSchema'
import CommonForm from '@/components/common/CommonForm.vue'

/**
 * 明细表 / 子表单：值为对象数组，每行用 CommonForm 渲染。
 * 需放在父级 NForm 内，通过 pathKey 拼接校验 path（如 items[0].name）。
 */
const props = withDefaults(defineProps<{
  value?: Record<string, unknown>[] | null
  /** 行内字段（与 FormBuilder children / bind.fields 一致） */
  fields?: UnifiedFieldConfig[]
  /** 父字段 path 前缀，如 items 或 order.items */
  pathKey?: string
  cols?: number
  disabled?: boolean
  readonly?: boolean
  min?: number
  max?: number
  labelWidth?: number | string | 'auto'
}>(), {
  fields: () => [],
  cols: 2,
  min: 0,
})

const emit = defineEmits<{
  'update:value': [Record<string, unknown>[]]
}>()

const rows = computed({
  get: () => (Array.isArray(props.value) ? props.value : []),
  set: (next) => emit('update:value', next),
})

function onCreate() {
  return {} as Record<string, unknown>
}

function rowPath(index: number) {
  if (!props.pathKey)
    return ''
  return `${props.pathKey}[${index}].`
}
</script>

<template>
  <div class="form-table">
    <n-dynamic-input
      v-model:value="rows"
      :min="min"
      :max="max"
      :disabled="disabled || readonly"
      :on-create="onCreate"
    >
      <template #default="{ index }">
        <div class="form-table__row">
          <CommonForm
            v-if="fields.length && rows[index]"
            v-model:form-model="rows[index]"
            :fields="fields"
            :cols="cols"
            :base-path="rowPath(index)"
            :disabled="disabled"
            :readonly="readonly"
            :label-width="labelWidth"
            compact
            disabled-hide-border
          />
          <n-empty v-else description="未配置行字段" size="small" />
        </div>
      </template>
    </n-dynamic-input>
  </div>
</template>

<style scoped>
.form-table {
  width: 100%;
}

.form-table__row {
  flex: 1;
  min-width: 0;
  padding: 4px 8px 4px 0;
}
</style>
