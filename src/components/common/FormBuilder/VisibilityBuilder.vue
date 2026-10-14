<script setup lang="ts">
import type { BuilderField, VisibilityRule } from './types'
import { visibilityLogicOptions } from './constants'
import {
  buildVisibilityExpr,
  createEmptyCondition,
  createEmptyRule,
  needsConditionValue,
  visibilityOperatorOptions,
} from './visibilityBuilder'

const props = withDefaults(defineProps<{
  field: BuilderField
  refFieldOptions: Array<{ label: string, value: string }>
  /** visible | disabled | required，默认显隐 */
  target?: 'visible' | 'disabled' | 'required'
}>(), {
  target: 'visible',
})

const emit = defineEmits<{
  updateExpr: [expr: string]
}>()

function ruleKey(): '_visibilityRule' | '_disabledRule' | '_requiredRule' {
  if (props.target === 'disabled')
    return '_disabledRule'
  if (props.target === 'required')
    return '_requiredRule'
  return '_visibilityRule'
}

function ensureRule(): VisibilityRule {
  const key = ruleKey()
  if (!props.field[key])
    props.field[key] = createEmptyRule()
  return props.field[key]!
}

watch(
  () => [props.field.uid, props.target] as const,
  () => {
    ensureRule()
  },
  { immediate: true },
)

const rule = computed(() => ensureRule())

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
          :value="condition.fieldKey || null"
          :options="refFieldOptions"
          placeholder="引用字段"
          clearable
          @update:value="v => updateCondition(index, { fieldKey: v || '' })"
        />
        <n-select
          :value="condition.operator"
          :options="[...visibilityOperatorOptions]"
          @update:value="v => updateCondition(index, { operator: v })"
        />
        <n-input
          v-if="needsConditionValue(condition.operator)"
          :value="condition.value || ''"
          placeholder="比较值"
          @update:value="v => updateCondition(index, { value: v })"
        />
        <n-button size="tiny" quaternary type="error" @click="removeCondition(index)">
          删
        </n-button>
      </div>
      <n-button size="tiny" dashed block @click="addCondition">
        添加条件
      </n-button>
    </n-space>
  </n-form-item>
</template>

<style scoped>
.visibility-builder__row {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.9fr) minmax(0, 1fr) auto;
  gap: 6px;
  align-items: center;
  width: 100%;
}
</style>
