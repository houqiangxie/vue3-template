<script setup lang="ts">
import type { BuilderField } from './types'
import { visibilityLogicOptions } from './constants'
import {
  buildVisibilityExpr,
  createEmptyCondition,
  createEmptyRule,
  needsConditionValue,
  visibilityOperatorOptions,
} from './visibilityBuilder'

const props = defineProps<{
  field: BuilderField
  refFieldOptions: Array<{ label: string, value: string }>
}>()

const emit = defineEmits<{
  updateExpr: [expr: string]
}>()

function ensureRule() {
  if (!props.field._visibilityRule)
    props.field._visibilityRule = createEmptyRule()
  return props.field._visibilityRule
}

watch(
  () => props.field.uid,
  () => {
    ensureRule()
  },
  { immediate: true },
)

const rule = computed(() => props.field._visibilityRule!)

function syncExpr() {
  emit('updateExpr', buildVisibilityExpr(ensureRule()))
}

function setLogic(logic: 'and' | 'or') {
  ensureRule().logic = logic
  syncExpr()
}

function addCondition() {
  ensureRule().conditions.push(createEmptyCondition())
  syncExpr()
}

function removeCondition(index: number) {
  const current = ensureRule()
  current.conditions.splice(index, 1)
  if (!current.conditions.length)
    current.conditions.push(createEmptyCondition())
  syncExpr()
}

function updateCondition(index: number, patch: Partial<typeof rule.value.conditions[0]>) {
  Object.assign(ensureRule().conditions[index], patch)
  syncExpr()
}
</script>

<template>
  <n-form-item label="条件组合">
    <n-select
      :value="rule.logic"
      :options="visibilityLogicOptions"
      @update:value="v => setLogic(v as 'and' | 'or')"
    />
  </n-form-item>
  <n-form-item label="条件列表">
    <n-space vertical style="width: 100%">
      <div
        v-for="(condition, index) in rule.conditions"
        :key="index"
        class="visibility-builder__row"
      >
        <n-select
          class="visibility-builder__field"
          :value="condition.fieldKey || null"
          :options="refFieldOptions"
          placeholder="引用字段"
          clearable
          @update:value="v => updateCondition(index, { fieldKey: v || '' })"
        />
        <div class="visibility-builder__controls">
          <n-select
            class="visibility-builder__operator"
            :value="condition.operator"
            :options="[...visibilityOperatorOptions]"
            @update:value="v => updateCondition(index, { operator: v as typeof condition.operator })"
          />
          <n-input
            v-if="needsConditionValue(condition.operator)"
            class="visibility-builder__value"
            :value="condition.value ?? ''"
            placeholder="比较值"
            @update:value="v => updateCondition(index, { value: v })"
          />
          <n-button
            quaternary
            circle
            size="tiny"
            class="visibility-builder__remove"
            :disabled="rule.conditions.length <= 1"
            @click="removeCondition(index)"
          >
            ×
          </n-button>
        </div>
      </div>
      <n-button size="tiny" dashed block @click="addCondition">
        添加条件
      </n-button>
    </n-space>
  </n-form-item>
  <n-alert type="info" :bordered="false" style="margin-bottom: 12px">
    可视化条件会自动生成表达式；也可在下方直接编辑表达式
  </n-alert>
</template>

<style scoped>
.visibility-builder__row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 8px;
  border: 1px solid var(--n-border-color);
  border-radius: var(--n-border-radius);
  background: var(--n-color-modal);
  box-sizing: border-box;
}

.visibility-builder__field {
  width: 100%;
  min-width: 0;
}

.visibility-builder__controls {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) auto;
  gap: 6px;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.visibility-builder__controls:not(:has(.visibility-builder__value)) {
  grid-template-columns: 88px auto;
}

.visibility-builder__operator,
.visibility-builder__value {
  min-width: 0;
}

.visibility-builder__remove {
  flex-shrink: 0;
}

.visibility-builder__field :deep(.n-base-selection-label) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
