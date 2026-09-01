<script setup lang="ts">
import type { SqlSearchCompileOptions, SqlSearchFieldDef, SqlSearchValue, SqlValidationMode } from './types'
import { SQL_SEARCH_CONTEXT_KEY } from './context'
import { useSqlSearchLabels } from './labels'
import SqlSearchGroup from './SqlSearchGroup.vue'
import { useSqlSearchTree } from './useSqlSearchTree'
import {
  compileSqlSearch,
  compileSqlSearchParameterized,
  createDefaultSqlSearchValue,
  buildFieldMap,
  getVisibleFields,
  isSqlSearchComplete,
  normalizeSqlSearchValue,
  repairSqlSearchValue,
  toSqlSearchParams,
  toSqlSearchParamsPruned,
} from './utils'

const props = withDefaults(defineProps<{
  /** 可搜索字段定义；未传则为空列表 */
  fields?: SqlSearchFieldDef[]
  /** 是否展示 SQL 预览 */
  showSqlPreview?: boolean
  /** 最大嵌套层级；0 / 不传表示无限 */
  maxDepth?: number
  /** 是否禁用 */
  disabled?: boolean
  /** 是否允许复制预览 SQL */
  showCopySql?: boolean
  /** strict：每行须完整；lenient：忽略空白行（SearchPanel 默认） */
  validationMode?: SqlValidationMode
  /** SQL 编译选项 */
  compileOptions?: SqlSearchCompileOptions
}>(), {
  fields: () => [],
  showSqlPreview: true,
  maxDepth: 0,
  disabled: false,
  showCopySql: true,
  validationMode: 'lenient',
  compileOptions: () => ({}),
})

const emit = defineEmits<{
  compile: [sql: string]
  validate: [ok: boolean]
  copy: [sql: string]
}>()

const modelValue = defineModel<SqlSearchValue>('value')

const validated = ref(false)
const tree = useSqlSearchTree(modelValue)
const sqlSearchLabels = useSqlSearchLabels()

const resolvedFields = computed(() => props.fields ?? [])

function isValidRoot(value: unknown): value is SqlSearchValue {
  return !!value
    && typeof value === 'object'
    && (value as SqlSearchValue).type === 'group'
    && Array.isArray((value as SqlSearchValue).children)
    && !!((value as SqlSearchValue).logic === 'and' || (value as SqlSearchValue).logic === 'or')
}

function ensureModelValue() {
  const value = modelValue.value
  if (!isValidRoot(value)) {
    modelValue.value = value && typeof value === 'object' && (value as SqlSearchValue).type === 'group'
      ? repairSqlSearchValue(value, resolvedFields.value)
      : createDefaultSqlSearchValue()
  }
}

ensureModelValue()

watch(
  () => [modelValue.value, resolvedFields.value] as const,
  () => ensureModelValue(),
  { deep: true },
)

const innerValue = computed({
  get: () => modelValue.value as SqlSearchValue,
  set: (value: SqlSearchValue) => {
    modelValue.value = value
  },
})
const visibleFields = computed(() => getVisibleFields(resolvedFields.value))
const hasFields = computed(() => visibleFields.value.length > 0)

const fieldMap = computed(() => buildFieldMap(resolvedFields.value))

const fieldOptions = computed(() =>
  visibleFields.value.map(field => ({
    label: field.label,
    value: field.key,
    disabled: !!field.disabled,
  })),
)

const disabledRef = computed(() => props.disabled)
const validationModeRef = computed(() => props.validationMode)
const showIncomplete = computed(() => validated.value)

provide(SQL_SEARCH_CONTEXT_KEY, {
  fields: resolvedFields,
  fieldMap,
  fieldOptions,
  disabled: disabledRef,
  validationMode: validationModeRef,
  showIncomplete,
  tree,
})

const sqlPreview = computed(() =>
  compileSqlSearch(innerValue.value, resolvedFields.value, props.compileOptions),
)

const parameterizedPreview = computed(() =>
  compileSqlSearchParameterized(innerValue.value, resolvedFields.value, props.compileOptions),
)

watch(sqlPreview, sql => emit('compile', sql))

function getSql() {
  return sqlPreview.value
}

function getParameterizedSql() {
  return parameterizedPreview.value
}

function getValue() {
  return innerValue.value
}

function isComplete() {
  return isSqlSearchComplete(innerValue.value, props.validationMode, resolvedFields.value)
}

function toParams() {
  return toSqlSearchParams(innerValue.value, resolvedFields.value, props.validationMode)
}

function toParamsPruned() {
  return toSqlSearchParamsPruned(innerValue.value, resolvedFields.value)
}

function validate() {
  validated.value = true
  const ok = isComplete()
  emit('validate', ok)
  return ok
}

function reset(value?: SqlSearchValue) {
  validated.value = false
  if (value)
    modelValue.value = normalizeSqlSearchValue(value, resolvedFields.value)
  else
    modelValue.value = createDefaultSqlSearchValue()
}

function repair(value: unknown) {
  modelValue.value = repairSqlSearchValue(value, resolvedFields.value)
}

async function copySql() {
  const text = sqlPreview.value
  if (!text)
    return
  emit('copy', text)
  try {
    await navigator.clipboard.writeText(text)
  }
  catch {
    // 由父组件决定是否提示
  }
}

defineExpose({
  getSql,
  getParameterizedSql,
  getValue,
  isComplete,
  toParams,
  toParamsPruned,
  validate,
  reset,
  repair,
})
</script>

<template>
  <div class="sql-search" :class="{ 'sql-search--disabled': disabled }">
    <n-alert
      v-if="!hasFields"
      type="warning"
      :bordered="false"
      size="small"
      class="sql-search__alert"
    >
      {{ sqlSearchLabels.noFields }}
    </n-alert>

    <SqlSearchGroup
      v-else
      :group="innerValue"
      :max-depth="maxDepth"
    />

    <div v-if="showSqlPreview && hasFields" class="sql-search__preview">
      <div class="sql-search__preview-head">
        <div class="sql-search__preview-label">
          {{ sqlSearchLabels.sqlPreview }}
        </div>
        <n-button
          v-if="showCopySql"
          size="tiny"
          quaternary
          :disabled="disabled || !sqlPreview"
          @click="copySql"
        >
          {{ sqlSearchLabels.copySql }}
        </n-button>
      </div>
      <n-input
        type="textarea"
        :value="sqlPreview || sqlSearchLabels.sqlPreviewEmpty"
        readonly
        :disabled="disabled"
        :autosize="{ minRows: 2, maxRows: 6 }"
        size="small"
      />
    </div>
  </div>
</template>

<style scoped>
.sql-search {
  width: 100%;
}

.sql-search--disabled {
  opacity: 0.85;
}

.sql-search__alert {
  margin-bottom: 8px;
}

.sql-search__preview {
  margin-top: 10px;
}

.sql-search__preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.sql-search__preview-label {
  font-size: 12px;
  color: var(--n-text-color-3);
}
</style>
