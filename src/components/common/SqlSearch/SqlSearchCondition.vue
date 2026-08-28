<script setup lang="ts">
import type { SqlSearchCondition as SqlSearchConditionType } from './types'
import { SQL_SEARCH_CONTEXT_KEY } from './context'
import { operatorLabels, sqlSearchLabels } from './labels'
import SqlSearchValueInput from './SqlSearchValueInput.vue'
import {
  cloneCondition,
  findParentGroupId,
  getOperatorsForField,
  isConditionBlank,
  isConditionComplete,
  isFieldValid,
  operatorNeedsArrayValue,
  operatorNeedsRangeValue,
  operatorNeedsValue,
  resolveFieldType,
} from './utils'

const props = defineProps<{
  condition: SqlSearchConditionType
}>()

const emit = defineEmits<{
  remove: []
}>()

const ctx = inject(SQL_SEARCH_CONTEXT_KEY)
if (!ctx)
  throw new Error('[SqlSearchCondition] must be used inside SqlSearch')

const {
  fieldMap,
  fieldOptions,
  disabled,
  showIncomplete,
  validationMode,
  tree,
} = ctx

const currentField = computed(() =>
  fieldMap.value.get(props.condition.field),
)

const fieldType = computed(() =>
  resolveFieldType(props.condition.field, fieldMap.value),
)

const operatorOptions = computed(() =>
  getOperatorsForField(currentField.value).map(op => ({
    label: operatorLabels[op],
    value: op,
  })),
)

const showValue = computed(() => operatorNeedsValue(props.condition.operator))

const fieldInvalid = computed(() =>
  !!props.condition.field && !isFieldValid(props.condition.field, fieldMap.value),
)

const incomplete = computed(() => {
  if (!showIncomplete.value)
    return false
  if (validationMode.value === 'lenient' && isConditionBlank(props.condition))
    return false
  return !isConditionComplete(props.condition, fieldMap.value)
})

const valuePlaceholder = computed(() => currentField.value?.placeholder)

function patch(patch: Partial<SqlSearchConditionType>) {
  tree.patchNode(props.condition.id, patch)
}

function onFieldChange(fieldKey: string | null) {
  const nextField = fieldMap.value.get(fieldKey || '')
  const ops = getOperatorsForField(nextField)
  const preferred = nextField?.defaultOperator
  const nextOperator = preferred && ops.includes(preferred)
    ? preferred
    : ops.includes(props.condition.operator)
      ? props.condition.operator
      : ops[0]!
  patch({
    field: fieldKey || '',
    operator: nextOperator,
    value: undefined,
  })
}

function onOperatorChange(operator: SqlSearchConditionType['operator']) {
  let nextValue: unknown = props.condition.value
  if (!operatorNeedsValue(operator))
    nextValue = undefined
  else if (operatorNeedsRangeValue(operator))
    nextValue = [null, null]
  else if (operatorNeedsArrayValue(operator))
    nextValue = []
  else if (
    operatorNeedsArrayValue(props.condition.operator)
    || operatorNeedsRangeValue(props.condition.operator)
  ) {
    nextValue = undefined
  }
  patch({ operator, value: nextValue })
}

function handleDuplicate() {
  tree.appendChild(
    findParentGroupId(tree.getRoot(), props.condition.id),
    cloneCondition(props.condition),
  )
}
</script>

<template>
  <div
    class="sql-search-condition"
    :class="{
      'sql-search-condition--incomplete': incomplete,
      'sql-search-condition--invalid-field': fieldInvalid,
    }"
  >
    <span
      class="sql-search-drag"
      :title="sqlSearchLabels.dragHandle"
      role="button"
      :aria-label="sqlSearchLabels.dragHandle"
    >
      ⋮⋮
    </span>

    <n-select
      class="sql-search-condition__field"
      :value="condition.field || null"
      :options="(fieldOptions as any)"
      :placeholder="sqlSearchLabels.fieldPlaceholder"
      :disabled="disabled"
      filterable
      clearable
      size="small"
      @update:value="onFieldChange"
    />
    <n-select
      class="sql-search-condition__operator"
      :value="condition.operator"
      :options="operatorOptions"
      :disabled="disabled || fieldInvalid"
      size="small"
      @update:value="v => onOperatorChange(v as SqlSearchConditionType['operator'])"
    />

    <SqlSearchValueInput
      v-if="showValue"
      :field-type="fieldType"
      :operator="condition.operator"
      :value="condition.value"
      :options="currentField?.options"
      :placeholder="valuePlaceholder"
      :disabled="disabled || fieldInvalid || !!currentField?.disabled"
      @update="v => patch({ value: v })"
    />

    <n-checkbox
      class="sql-search-condition__not"
      :checked="!!condition.not"
      :disabled="disabled"
      size="small"
      @update:checked="v => patch({ not: v || undefined })"
    >
      {{ sqlSearchLabels.notCheckbox }}
    </n-checkbox>

    <n-button
      quaternary
      size="tiny"
      :disabled="disabled"
      @click="handleDuplicate"
    >
      {{ sqlSearchLabels.duplicateCondition }}
    </n-button>

    <n-button
      quaternary
      circle
      size="tiny"
      class="sql-search-condition__remove"
      :disabled="disabled"
      :aria-label="sqlSearchLabels.removeCondition"
      @click="emit('remove')"
    >
      ×
    </n-button>

    <div v-if="fieldInvalid" class="sql-search-condition__hint sql-search-condition__hint--error">
      {{ sqlSearchLabels.invalidField }}
    </div>
    <div v-else-if="incomplete" class="sql-search-condition__hint">
      {{ sqlSearchLabels.incompleteHint }}
    </div>
  </div>
</template>

<style scoped>
.sql-search-condition {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 1px dashed var(--n-border-color);
  border-radius: var(--n-border-radius);
  background: var(--n-color-modal);
  box-sizing: border-box;
}

.sql-search-condition--incomplete {
  border-color: var(--n-warning-color);
  background: color-mix(in srgb, var(--n-warning-color) 8%, var(--n-color-modal));
}

.sql-search-condition--invalid-field {
  border-color: var(--n-error-color);
}

.sql-search-drag {
  flex-shrink: 0;
  cursor: grab;
  user-select: none;
  color: var(--n-text-color-3);
  font-size: 12px;
  letter-spacing: -2px;
  padding: 0 2px;
  line-height: 1;
}

.sql-search-drag:active {
  cursor: grabbing;
}

.sql-search-condition__field {
  flex: 1 1 120px;
  min-width: 120px;
}

.sql-search-condition__operator {
  flex: 0 1 110px;
  min-width: 100px;
}

.sql-search-condition__not {
  flex-shrink: 0;
}

.sql-search-condition__remove {
  flex-shrink: 0;
}

.sql-search-condition__hint {
  flex: 1 1 100%;
  font-size: 12px;
  color: var(--n-warning-color);
  line-height: 1.2;
}

.sql-search-condition__hint--error {
  color: var(--n-error-color);
}

@media (max-width: 640px) {
  .sql-search-condition {
    flex-direction: column;
    align-items: stretch;
  }

  .sql-search-condition__field,
  .sql-search-condition__operator {
    flex: 1 1 auto;
    min-width: 0;
    width: 100%;
  }

  .sql-search-drag {
    align-self: flex-start;
  }
}
</style>
