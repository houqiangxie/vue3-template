<script setup lang="ts">
import type { FieldBind, FieldOption, FormFieldConfig, SearchFieldConfig, TableFieldConfig } from '@/components/common/table/fieldSchema'
import type { NaiveComponentName } from '@/components/common/table/fieldSchema'
import { fetchDictOptions } from '@/hooks/useDict'
import type { BuilderField } from './types'
import ComponentBindExtras from './ComponentBindExtras.vue'
import SceneExtraJsonEditor from './SceneExtraJsonEditor.vue'
import SceneBindEditor from './SceneBindEditor.vue'
import TreeOptionsEditor from './TreeOptionsEditor.vue'
import type { TreeOptionNode } from './TreeOptionsEditor.vue'
import VisibilityBuilder from './VisibilityBuilder.vue'
import {
  componentOptions,
  DEFAULT_OPTIONS,
  DEFAULT_TREE_OPTIONS,
  inputModeOptions,
  patternTypeOptions,
  tableAlignOptions,
  tableFixedOptions,
  tableFormatOptions,
  tableTagTypeOptions,
  fileTypeOptions,
  visibilityModeOptions,
} from './constants'
import { validateVisibilityExpr } from './compile'
import { formatLooseValue, needsOptions, needsTreeOptions, parseLooseValue, resolveFieldKey, supportsCommonMultiple, supportsMultiple, validateFieldKey } from './utils'
import { COMPONENT_MANAGED_BIND_KEYS } from './bindManagedKeys'
import { createEmptyRule, serializeCompareLiteral, syncVisibilityRuleFromExpr } from './visibilityBuilder'

const props = defineProps<{
  field: BuilderField
  formCols: number
  fields: BuilderField[]
  selectedUid: string
}>()

const emit = defineEmits<{
  keyChange: [oldKey: string, newKey: string]
}>()

const { message } = useConfirm()

const visibilityRefField = ref<string | null>(null)
const visibilityBuilderMode = ref(true)
const treeEditorMode = ref(true)
const dictLoading = ref(false)
const activeTab = ref('field')
const activeScene = ref<'form' | 'search' | 'table'>('form')

const componentLabel = computed(() =>
  componentOptions.find(o => o.value === props.field.component)?.label
  ?? String(props.field.component || 'NInput'),
)

const bind = computed((): FieldBind | undefined => {
  const value = props.field.bind
  return Array.isArray(value) ? value[0] : value
})

const formConfig = computed((): FormFieldConfig | undefined =>
  props.field.form !== false ? props.field.form : undefined,
)

const searchConfig = computed((): SearchFieldConfig | undefined =>
  props.field.search !== false ? props.field.search : undefined,
)

const tableConfig = computed((): (TableFieldConfig & { tagTypeValue?: string, exportTextValue?: string }) | undefined =>
  props.field.table !== false ? props.field.table as TableFieldConfig & { tagTypeValue?: string, exportTextValue?: string } : undefined,
)

const formEnabled = computed(() => props.field.form !== false)
const searchEnabled = computed(() => props.field.search !== false)
const tableEnabled = computed(() => props.field.table !== false)

const visibilityMode = computed(() => {
  if (props.field._visibleExpr !== undefined)
    return 'visible'
  if (props.field._hiddenExpr !== undefined)
    return 'hidden'
  return 'none'
})

const visibilityExpr = computed(() =>
  props.field._visibleExpr ?? props.field._hiddenExpr ?? '',
)

const visibilityExprError = computed(() => {
  if (visibilityMode.value === 'none')
    return ''
  return validateVisibilityExpr(visibilityExpr.value)
})

const tableTagTypeValue = computed(() => tableConfig.value?.tagTypeValue || '')

const refFieldOptions = computed(() =>
  props.fields
    .filter(f => f.uid !== props.selectedUid)
    .map(f => ({
      label: `${f.label || resolveFieldKey(f)} (${resolveFieldKey(f)})`,
      value: resolveFieldKey(f),
    })),
)

const defaultValueText = computed(() => {
  const dv = formConfig.value?.defaultValue ?? bind.value?.defaultValue
  return formatLooseValue(dv)
})

const searchDefaultValueText = computed(() => formatLooseValue(searchConfig.value?.defaultValue))

const fieldKeyError = computed(() =>
  validateFieldKey(props.fields, resolveFieldKey(props.field), props.field.uid),
)

const optionRows = computed({
  get: () => (props.field.options || []) as FieldOption[],
  set: (rows: Array<{ label: string, value: unknown, disabled?: boolean }>) => {
    props.field.options = rows.map(r => ({
      label: r.label,
      value: (r.value === undefined ? '' : r.value) as FieldOption['value'],
      ...(r.disabled ? { disabled: true } : {}),
    })) as FieldOption[]
  },
})

const treeOptions = computed({
  get: () => (props.field.options || []) as TreeOptionNode[],
  set: (nodes: TreeOptionNode[]) => {
    props.field.options = nodes
  },
})

watch(
  () => [props.field.uid, String(props.field.component)] as const,
  () => {
    const component = String(props.field.component || '')
    if (
      (needsOptions(component) || needsTreeOptions(component))
      && !props.field.options
    ) {
      props.field.options = []
    }
  },
  { immediate: true },
)

const treeOptionsJson = computed(() => {
  if (!props.field.options)
    return ''
  try {
    return JSON.stringify(props.field.options, null, 2)
  }
  catch {
    return ''
  }
})

function ensureFormConfig(field: BuilderField): FormFieldConfig {
  if (field.form === false || field.form == null)
    field.form = { required: false, span: 1 }
  return field.form
}

function setFormProp(key: 'required' | 'span' | 'colStart' | 'defaultValue' | 'notValidate' | 'showFeedback' | 'hiddenClear', value: unknown) {
  const form = ensureFormConfig(props.field)
  if (value == null || value === '')
    delete (form as Record<string, unknown>)[key]
  else
    (form as Record<string, unknown>)[key] = value
}

function ensureSearchConfig(field: BuilderField): SearchFieldConfig {
  if (field.search === false || field.search == null)
    field.search = {}
  return field.search
}

function ensureTableConfig(field: BuilderField): TableFieldConfig {
  if (field.table === false || field.table == null)
    field.table = {}
  return field.table
}

function setSearchEnabled(enabled: boolean) {
  if (enabled) {
    props.field.search = props.field._searchBackup ?? { span: 8 }
    delete props.field._searchBackup
    return
  }
  if (props.field.search !== false && props.field.search != null)
    props.field._searchBackup = props.field.search
  props.field.search = false
}

function setFormEnabled(enabled: boolean) {
  if (enabled) {
    props.field.form = props.field._formBackup ?? { span: 1 }
    delete props.field._formBackup
    return
  }
  if (props.field.form !== false && props.field.form != null)
    props.field._formBackup = props.field.form
  props.field.form = false
}

function setTableEnabled(enabled: boolean) {
  if (enabled) {
    props.field.table = props.field._tableBackup ?? { width: 120 }
    delete props.field._tableBackup
    return
  }
  if (props.field.table !== false && props.field.table != null)
    props.field._tableBackup = props.field.table
  props.field.table = false
}

function setSearchProp(key: 'span' | 'defaultValue' | 'enabled', value: unknown) {
  const search = ensureSearchConfig(props.field)
  if (key === 'enabled') {
    if (value === false)
      search.enabled = false
    else
      delete search.enabled
    return
  }
  if (key === 'span')
    delete (search as Record<string, unknown>).col
  if (value == null || value === '')
    delete (search as Record<string, unknown>)[key]
  else
    (search as Record<string, unknown>)[key] = value
}

function setTableProp(
  key: 'width' | 'minWidth' | 'maxWidth' | 'fixed' | 'sortable' | 'ellipsis' | 'format' | 'align' | 'allowExport' | 'exportTextValue',
  value: unknown,
) {
  const table = ensureTableConfig(props.field)
  if (value == null || value === '')
    delete (table as Record<string, unknown>)[key]
  else
    (table as Record<string, unknown>)[key] = value
}

function updateSearchDefaultValue(text: string) {
  const search = ensureSearchConfig(props.field)
  const parsed = parseLooseValue(text)
  if (parsed === undefined)
    delete search.defaultValue
  else
    search.defaultValue = parsed
}

function setVisibilityMode(mode: 'none' | 'visible' | 'hidden') {
  if (mode === 'none') {
    props.field._visibleExpr = undefined
    props.field._hiddenExpr = undefined
    delete props.field._visibilityRule
    return
  }
  const current = props.field._visibleExpr ?? props.field._hiddenExpr ?? ''
  props.field._visibleExpr = mode === 'visible' ? current : undefined
  props.field._hiddenExpr = mode === 'hidden' ? current : undefined
}

function updateVisibilityExpr(expr: string) {
  if (visibilityMode.value === 'visible')
    props.field._visibleExpr = expr
  else if (visibilityMode.value === 'hidden')
    props.field._hiddenExpr = expr
  syncVisibilityRuleFromExpr(props.field, expr)
}

function setVisibilityRefField(fieldKey: string | null) {
  visibilityRefField.value = fieldKey
}

function applyVisibilityTemplate(
  template: 'eq' | 'neq' | 'truthy' | 'empty' | 'gt' | 'lt' | 'includes',
  compareValue?: string,
) {
  const fieldKey = visibilityRefField.value
  if (!fieldKey)
    return
  let expr = ''
  if (template === 'eq')
    expr = `model.${fieldKey} === ${serializeCompareLiteral(compareValue ?? '1')}`
  else if (template === 'neq')
    expr = `model.${fieldKey} !== ${serializeCompareLiteral(compareValue ?? '1')}`
  else if (template === 'truthy')
    expr = `!!model.${fieldKey}`
  else if (template === 'empty')
    expr = `(model.${fieldKey} ?? '') === ''`
  else if (template === 'gt')
    expr = `Number(model.${fieldKey}) > ${compareValue ?? '0'}`
  else if (template === 'lt')
    expr = `Number(model.${fieldKey}) < ${compareValue ?? '0'}`
  else if (template === 'includes')
    expr = `String(model.${fieldKey} ?? '').includes(${serializeCompareLiteral(compareValue ?? '')})`
  updateVisibilityExpr(expr)
}

function onVisibilityBuilderExpr(expr: string) {
  // 可视化规则已是权威数据；勿再从表达式回写，否则单条件时 AND/OR 无法编码会被重置为 and
  if (visibilityMode.value === 'visible')
    props.field._visibleExpr = expr
  else if (visibilityMode.value === 'hidden')
    props.field._hiddenExpr = expr
}

function ensureVisibilityRule() {
  if (visibilityMode.value === 'none')
    return
  syncVisibilityRuleFromExpr(props.field, visibilityExpr.value)
  if (!props.field._visibilityRule)
    props.field._visibilityRule = createEmptyRule()
}

function setTableTagType(value: string | null) {
  const table = ensureTableConfig(props.field)
  const tagTypes = ['default', 'error', 'primary', 'info', 'success', 'warning'] as const
  type TagType = typeof tagTypes[number]
  if (!value) {
    delete table.tagType
    delete (table as TableFieldConfig & { tagTypeValue?: string }).tagTypeValue
    return
  }
  const tagType = value as TagType
  ;(table as TableFieldConfig & { tagTypeValue?: string }).tagTypeValue = tagType
  table.tagType = () => tagType
}

function updateDefaultValue(text: string) {
  const form = ensureFormConfig(props.field)
  const parsed = parseLooseValue(text)
  if (parsed === undefined) {
    delete form.defaultValue
    return
  }
  form.defaultValue = parsed
  const raw = props.field.bind
  if (Array.isArray(raw)) {
    for (const item of raw)
      delete item.defaultValue
  }
  else if (raw) {
    delete raw.defaultValue
  }
}

function updateBind(key: string, value: unknown) {
  const next: FieldBind = { ...(bind.value || {}) }
  if (value == null || value === '')
    delete next[key]
  else
    next[key] = value
  if (key === 'patternType' && value !== 'custom')
    delete next.pattern
  if (key === 'type') {
    if (value === 'password') {
      delete next.rows
      delete next.showCount
    }
    else if (value === 'textarea') {
      if (next.rows == null)
        next.rows = 3
    }
    else if (value == null || value === '') {
      delete next.rows
    }
  }
  props.field.bind = next
}

function updatePatternType(value: string | null) {
  const next: FieldBind = { ...(bind.value || {}) }
  if (!value) {
    delete next.patternType
    delete next.pattern
  }
  else if (value === 'custom') {
    delete next.patternType
    if (next.pattern == null)
      next.pattern = ''
  }
  else {
    next.patternType = value
    delete next.pattern
  }
  props.field.bind = next
}

function updateCustomPattern(value: string) {
  const next: FieldBind = { ...(bind.value || {}) }
  delete next.patternType
  ;(next as Record<string, unknown>).pattern = value
  props.field.bind = next
}

const patternTypeValue = computed(() => {
  const current = bind.value
  if (!current)
    return ''
  if (current.patternType)
    return String(current.patternType)
  if (current.pattern != null)
    return 'custom'
  return ''
})

const customPatternText = computed(() => {
  const pattern = bind.value?.pattern
  if (pattern instanceof RegExp)
    return pattern.source
  return pattern == null ? '' : String(pattern)
})

async function loadDictOptions() {
  const dictType = props.field._dictType?.trim()
  if (!dictType) {
    message.warning('请先填写字典类型')
    return
  }
  dictLoading.value = true
  try {
    const options = await fetchDictOptions(dictType)
    props.field.options = options
    message.success(`已从字典「${dictType}」加载 ${options.length} 个选项`)
  }
  catch {
    message.error('字典加载失败')
  }
  finally {
    dictLoading.value = false
  }
}

function setDictType(value: string) {
  const trimmed = value.trim()
  if (trimmed)
    props.field._dictType = trimmed
  else
    delete props.field._dictType
}

const committedFieldKey = ref(resolveFieldKey(props.field))

watch(() => props.field.uid, () => {
  committedFieldKey.value = resolveFieldKey(props.field)
})

function updateFieldKey(key: string) {
  props.field.key = key
}

function commitFieldKey() {
  const newKey = resolveFieldKey(props.field).trim()
  const err = validateFieldKey(props.fields, newKey, props.field.uid)
  if (err || !newKey)
    return
  if (committedFieldKey.value !== newKey) {
    emit('keyChange', committedFieldKey.value, newKey)
    committedFieldKey.value = newKey
  }
}

function updateTreeOptions(json: string) {
  if (!json.trim()) {
    props.field.options = []
    return
  }
  try {
    props.field.options = JSON.parse(json)
  }
  catch {
    message.warning('树形选项 JSON 格式不正确')
  }
}

function changeComponent(component: NaiveComponentName) {
  const prevComponent = String(props.field.component)
  const prevNeedsOptions = needsOptions(prevComponent)
  const prevNeedsTree = needsTreeOptions(prevComponent)
  const nextNeedsOptions = needsOptions(component)
  const nextNeedsTree = needsTreeOptions(component)

  props.field.component = component

  // 保留 placeholder/disabled 等公共项；去掉旧组件专属键，以及跨组件语义不同的 type/button/rows
  const prevSpecific = new Set(COMPONENT_MANAGED_BIND_KEYS[prevComponent] || [])
  const nextSpecific = new Set(COMPONENT_MANAGED_BIND_KEYS[component] || [])
  const alwaysReset = new Set(['type', 'button', 'rows'])
  const currentBind = { ...(bind.value || {}) } as Record<string, unknown>
  const kept: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(currentBind)) {
    if (alwaysReset.has(key))
      continue
    if (prevSpecific.has(key) && !nextSpecific.has(key))
      continue
    if (key === 'multiple' && !supportsMultiple(component))
      continue
    kept[key] = value
  }
  props.field.bind = kept as FieldBind

  if (nextNeedsTree) {
    if (prevNeedsOptions || !props.field.options?.length)
      props.field.options = structuredClone(DEFAULT_TREE_OPTIONS)
    return
  }
  if (nextNeedsOptions) {
    if (prevNeedsTree || !props.field.options?.length)
      props.field.options = [...DEFAULT_OPTIONS]
    return
  }
  delete props.field.options
}

watch([() => props.field.uid, visibilityBuilderMode, visibilityMode], () => {
  if (visibilityBuilderMode.value && visibilityMode.value !== 'none')
    ensureVisibilityRule()
}, { immediate: true })

watch(visibilityBuilderMode, (builderMode) => {
  if (builderMode && visibilityMode.value !== 'none')
    syncVisibilityRuleFromExpr(props.field, visibilityExpr.value)
})

watch(() => props.field.uid, () => {
  activeTab.value = 'field'
  visibilityRefField.value = null
  if (formEnabled.value)
    activeScene.value = 'form'
  else if (searchEnabled.value)
    activeScene.value = 'search'
  else if (tableEnabled.value)
    activeScene.value = 'table'
  else
    activeScene.value = 'form'
})
</script>

<template>
  <div class="field-props-panel">
    <div class="field-props-panel__header">
      <div class="field-props-panel__header-title">
        {{ field.label || resolveFieldKey(field) }}
      </div>
      <div class="field-props-panel__header-meta">
        <code class="field-props-panel__key">{{ resolveFieldKey(field) }}</code>
        <n-tag size="small" :bordered="false" type="primary">
          {{ componentLabel }}
        </n-tag>
      </div>
      <div class="field-props-panel__scene-tags">
        <n-tag v-if="formEnabled" size="tiny" type="info" :bordered="false">表单</n-tag>
        <n-tag v-if="searchEnabled" size="tiny" type="success" :bordered="false">搜索</n-tag>
        <n-tag v-if="tableEnabled" size="tiny" type="warning" :bordered="false">表格</n-tag>
        <n-tag v-if="!formEnabled && !searchEnabled && !tableEnabled" size="tiny" :bordered="false">
          未启用场景
        </n-tag>
      </div>
    </div>

    <n-tabs
      v-model:value="activeTab"
      type="segment"
      size="small"
      animated
      class="field-props-panel__tabs"
    >
      <!-- 字段 -->
      <n-tab-pane name="field" tab="字段">
        <div class="field-props-panel__sections">
          <section class="field-props-section">
            <div class="field-props-section__title">标识</div>
            <n-form label-placement="top" size="small" :show-feedback="false">
              <n-form-item
                label="字段名"
                :feedback="fieldKeyError"
                :validation-status="fieldKeyError ? 'error' : undefined"
                :show-feedback="!!fieldKeyError"
              >
                <n-input
                  :value="resolveFieldKey(field)"
                  placeholder="如 userName"
                  @update:value="updateFieldKey"
                  @blur="commitFieldKey"
                />
              </n-form-item>
              <n-grid :cols="2" :x-gap="8">
                <n-gi>
                  <n-form-item label="标签">
                    <n-input v-model:value="field.label" />
                  </n-form-item>
                </n-gi>
                <n-gi>
                  <n-form-item label="组件">
                    <n-select
                      :value="field.component"
                      :options="componentOptions"
                      @update:value="changeComponent"
                    />
                  </n-form-item>
                </n-gi>
              </n-grid>
            </n-form>
          </section>

          <section class="field-props-section">
            <div class="field-props-section__title">控件</div>
            <n-form label-placement="top" size="small" :show-feedback="false">
              <n-form-item label="占位符">
                <n-input
                  :value="String(bind?.placeholder || '')"
                  @update:value="updateBind('placeholder', $event)"
                />
              </n-form-item>
              <n-grid :cols="2" :x-gap="8">
                <n-gi>
                  <n-form-item label="禁用">
                    <n-switch
                      :value="!!bind?.disabled"
                      @update:value="v => updateBind('disabled', v || undefined)"
                    />
                  </n-form-item>
                </n-gi>
                <n-gi>
                  <n-form-item label="只读">
                    <n-switch
                      :value="!!bind?.readonly"
                      @update:value="v => updateBind('readonly', v || undefined)"
                    />
                  </n-form-item>
                </n-gi>
              </n-grid>
              <n-grid v-if="field.component === 'NInput' && bind?.type !== 'password'" :cols="2" :x-gap="8">
                <n-gi>
                  <n-form-item label="输入模式">
                    <n-select
                      :value="bind?.type === 'textarea' ? 'textarea' : 'text'"
                      :options="inputModeOptions"
                      @update:value="v => updateBind('type', v === 'textarea' ? 'textarea' : undefined)"
                    />
                  </n-form-item>
                </n-gi>
                <n-gi v-if="bind?.type === 'textarea'">
                  <n-form-item label="行数">
                    <n-input-number
                      :value="Number(bind?.rows ?? 3)"
                      :min="2"
                      :max="20"
                      style="width: 100%"
                      @update:value="v => updateBind('rows', v || 3)"
                    />
                  </n-form-item>
                </n-gi>
              </n-grid>
              <n-grid :cols="2" :x-gap="8">
                <n-gi v-if="supportsCommonMultiple(String(field.component))">
                  <n-form-item label="多选">
                    <n-switch
                      :value="!!bind?.multiple"
                      @update:value="v => updateBind('multiple', v || undefined)"
                    />
                  </n-form-item>
                </n-gi>
                <n-gi v-if="field.component === 'NRadioGroup'">
                  <n-form-item label="按钮样式">
                    <n-switch
                      :value="!!bind?.button"
                      @update:value="v => updateBind('button', v || undefined)"
                    />
                  </n-form-item>
                </n-gi>
              </n-grid>
            </n-form>
          </section>

          <section class="field-props-section">
            <div class="field-props-section__title">校验</div>
            <n-form label-placement="top" size="small" :show-feedback="false">
              <n-form-item label="校验规则">
                <n-select
                  :value="patternTypeValue"
                  :options="patternTypeOptions"
                  clearable
                  placeholder="无"
                  @update:value="v => updatePatternType(v)"
                />
              </n-form-item>
              <n-form-item
                v-if="patternTypeValue === 'custom'"
                label="正则表达式"
              >
                <n-input
                  :value="customPatternText"
                  placeholder="如 ^[A-Za-z0-9]+$"
                  @update:value="updateCustomPattern"
                />
              </n-form-item>
              <n-grid :cols="2" :x-gap="8">
                <n-gi>
                  <n-form-item label="值类型">
                    <n-select
                      :value="String(bind?.fileType || '')"
                      :options="fileTypeOptions"
                      clearable
                      placeholder="自动推断"
                      @update:value="v => updateBind('fileType', v || undefined)"
                    />
                  </n-form-item>
                </n-gi>
                <n-gi>
                  <n-form-item label="错误提示">
                    <n-input
                      :value="String(bind?.message || '')"
                      placeholder="自定义校验提示"
                      @update:value="updateBind('message', $event || undefined)"
                    />
                  </n-form-item>
                </n-gi>
              </n-grid>
            </n-form>
          </section>
        </div>
      </n-tab-pane>

      <!-- 场景 -->
      <n-tab-pane name="scene" tab="场景">
        <div class="field-props-panel__sections">
          <n-radio-group
            v-model:value="activeScene"
            size="small"
            class="field-props-panel__scene-switch"
          >
            <n-radio-button value="form">表单</n-radio-button>
            <n-radio-button value="search">搜索</n-radio-button>
            <n-radio-button value="table">表格</n-radio-button>
          </n-radio-group>

          <section v-show="activeScene === 'form'" class="field-props-section">
            <n-form label-placement="top" size="small" :show-feedback="false">
              <n-form-item label="参与表单">
                <n-switch :value="formEnabled" @update:value="setFormEnabled" />
              </n-form-item>
              <template v-if="formEnabled">
                <n-grid :cols="2" :x-gap="8">
                  <n-gi>
                    <n-form-item label="必填">
                      <n-switch
                        :value="!!formConfig?.required"
                        @update:value="v => setFormProp('required', v)"
                      />
                    </n-form-item>
                  </n-gi>
                  <n-gi>
                    <n-form-item label="跳过校验">
                      <n-switch
                        :value="!!formConfig?.notValidate"
                        @update:value="v => setFormProp('notValidate', v)"
                      />
                    </n-form-item>
                  </n-gi>
                </n-grid>
                <n-grid :cols="2" :x-gap="8">
                  <n-gi>
                    <n-form-item label="栅格">
                      <n-input-number
                        :value="formConfig?.span ?? 1"
                        :min="1"
                        :max="formCols"
                        style="width: 100%"
                        @update:value="v => setFormProp('span', v || 1)"
                      />
                    </n-form-item>
                  </n-gi>
                  <n-gi v-if="formCols > 1">
                    <n-form-item label="起始列">
                      <n-input-number
                        :value="formConfig?.colStart ?? 1"
                        :min="1"
                        :max="formCols"
                        style="width: 100%"
                        @update:value="v => setFormProp('colStart', v || 1)"
                      />
                    </n-form-item>
                  </n-gi>
                </n-grid>
                <div v-if="formCols > 1" class="field-props-panel__hint">
                  当前 {{ formConfig?.span ?? 1 }} / {{ formCols }} 列
                </div>
                <n-form-item label="默认值">
                  <n-input
                    :value="defaultValueText"
                    placeholder="字符串或 JSON"
                    @update:value="updateDefaultValue"
                  />
                </n-form-item>
                <n-grid :cols="2" :x-gap="8">
                  <n-gi>
                    <n-form-item label="显示反馈">
                      <n-switch
                        :value="formConfig?.showFeedback !== false"
                        @update:value="v => setFormProp('showFeedback', v)"
                      />
                    </n-form-item>
                  </n-gi>
                  <n-gi>
                    <n-form-item label="隐藏清空">
                      <n-switch
                        :value="!!formConfig?.hiddenClear"
                        @update:value="v => setFormProp('hiddenClear', v || undefined)"
                      />
                    </n-form-item>
                  </n-gi>
                </n-grid>
              </template>
            </n-form>
          </section>

          <section v-show="activeScene === 'search'" class="field-props-section">
            <n-form label-placement="top" size="small" :show-feedback="false">
              <n-form-item label="参与搜索">
                <n-switch :value="searchEnabled" @update:value="setSearchEnabled" />
              </n-form-item>
              <template v-if="searchEnabled">
                <n-grid :cols="2" :x-gap="8">
                  <n-gi>
                    <n-form-item label="启用">
                      <n-switch
                        :value="searchConfig?.enabled !== false"
                        @update:value="v => setSearchProp('enabled', v)"
                      />
                    </n-form-item>
                  </n-gi>
                  <n-gi>
                    <n-form-item label="栅格">
                      <n-input-number
                        :value="searchConfig?.span ?? searchConfig?.col ?? 8"
                        :min="1"
                        :max="24"
                        style="width: 100%"
                        @update:value="v => setSearchProp('span', v || 8)"
                      />
                    </n-form-item>
                  </n-gi>
                </n-grid>
                <n-form-item label="默认值">
                  <n-input
                    :value="searchDefaultValueText"
                    placeholder="字符串或 JSON"
                    @update:value="updateSearchDefaultValue"
                  />
                </n-form-item>
              </template>
            </n-form>
          </section>

          <section v-show="activeScene === 'table'" class="field-props-section">
            <n-form label-placement="top" size="small" :show-feedback="false">
              <n-form-item label="参与表格">
                <n-switch :value="tableEnabled" @update:value="setTableEnabled" />
              </n-form-item>
              <template v-if="tableEnabled">
                <n-grid :cols="2" :x-gap="8">
                  <n-gi>
                    <n-form-item label="列宽">
                      <n-input-number
                        :value="tableConfig?.width"
                        :min="40"
                        clearable
                        placeholder="自动"
                        style="width: 100%"
                        @update:value="v => setTableProp('width', v)"
                      />
                    </n-form-item>
                  </n-gi>
                  <n-gi>
                    <n-form-item label="对齐">
                      <n-select
                        :value="tableConfig?.align || ''"
                        :options="tableAlignOptions"
                        clearable
                        @update:value="v => setTableProp('align', v || undefined)"
                      />
                    </n-form-item>
                  </n-gi>
                </n-grid>
                <n-grid :cols="2" :x-gap="8">
                  <n-gi>
                    <n-form-item label="格式化">
                      <n-select
                        :value="String(tableConfig?.format || '')"
                        :options="tableFormatOptions"
                        clearable
                        @update:value="v => setTableProp('format', v || undefined)"
                      />
                    </n-form-item>
                  </n-gi>
                  <n-gi v-if="tableConfig?.format === 'option'">
                    <n-form-item label="标签颜色">
                      <n-select
                        :value="tableTagTypeValue"
                        :options="tableTagTypeOptions"
                        clearable
                        placeholder="默认"
                        @update:value="setTableTagType"
                      />
                    </n-form-item>
                  </n-gi>
                </n-grid>
                <n-grid :cols="2" :x-gap="8">
                  <n-gi>
                    <n-form-item label="可排序">
                      <n-switch
                        :value="!!tableConfig?.sortable"
                        @update:value="v => setTableProp('sortable', v || undefined)"
                      />
                    </n-form-item>
                  </n-gi>
                  <n-gi>
                    <n-form-item label="省略显示">
                      <n-switch
                        :value="!!tableConfig?.ellipsis"
                        @update:value="v => setTableProp('ellipsis', v || undefined)"
                      />
                    </n-form-item>
                  </n-gi>
                </n-grid>
                <n-grid :cols="2" :x-gap="8">
                  <n-gi>
                    <n-form-item label="最小列宽">
                      <n-input-number
                        :value="tableConfig?.minWidth"
                        :min="40"
                        clearable
                        style="width: 100%"
                        @update:value="v => setTableProp('minWidth', v)"
                      />
                    </n-form-item>
                  </n-gi>
                  <n-gi>
                    <n-form-item label="最大列宽">
                      <n-input-number
                        :value="tableConfig?.maxWidth"
                        :min="40"
                        clearable
                        style="width: 100%"
                        @update:value="v => setTableProp('maxWidth', v)"
                      />
                    </n-form-item>
                  </n-gi>
                </n-grid>
                <n-grid :cols="2" :x-gap="8">
                  <n-gi>
                    <n-form-item label="固定列">
                      <n-select
                        :value="tableConfig?.fixed || ''"
                        :options="tableFixedOptions"
                        clearable
                        @update:value="v => setTableProp('fixed', v || undefined)"
                      />
                    </n-form-item>
                  </n-gi>
                  <n-gi>
                    <n-form-item label="参与导出">
                      <n-switch
                        :value="tableConfig?.allowExport !== false"
                        @update:value="v => setTableProp('allowExport', v ? undefined : false)"
                      />
                    </n-form-item>
                  </n-gi>
                </n-grid>
                <n-form-item label="导出模板">
                  <n-input
                    :value="tableConfig?.exportTextValue || ''"
                    placeholder="如 {value}元"
                    @update:value="v => setTableProp('exportTextValue', v || undefined)"
                  />
                </n-form-item>
              </template>
            </n-form>
          </section>
        </div>
      </n-tab-pane>

      <!-- 数据 -->
      <n-tab-pane name="data" tab="数据">
        <div class="field-props-panel__sections">
          <section class="field-props-section">
            <div class="field-props-section__title">组件参数</div>
            <n-form label-placement="top" size="small" :show-feedback="false">
              <ComponentBindExtras
                :component="String(field.component || 'NInput')"
                :bind="bind"
                @update="updateBind"
              />
            </n-form>
          </section>

          <SceneExtraJsonEditor
            :field="field"
            :form-enabled="formEnabled"
            :search-enabled="searchEnabled"
            :table-enabled="tableEnabled"
          />

          <template v-if="needsOptions(String(field.component)) || needsTreeOptions(String(field.component))">
            <section class="field-props-section">
              <div class="field-props-section__title">字典绑定</div>
              <n-form label-placement="top" size="small" :show-feedback="false">
                <n-form-item label="字典类型">
                  <n-input-group>
                    <n-input
                      :value="field._dictType || ''"
                      placeholder="如 sys_user_sex"
                      @update:value="setDictType"
                    />
                    <n-button :loading="dictLoading" @click="loadDictOptions">
                      加载
                    </n-button>
                  </n-input-group>
                </n-form-item>
              </n-form>
            </section>
          </template>

          <template v-if="needsOptions(String(field.component))">
            <section class="field-props-section">
              <div class="field-props-section__title">选项列表</div>
              <n-form label-placement="top" size="small" :show-feedback="false">
                <n-dynamic-input
                  v-model:value="optionRows"
                  :on-create="() => ({ label: '选项', value: '' })"
                  #="{ value }"
                >
                  <div class="form-builder__option-row">
                    <n-input v-model:value="value.label" placeholder="标签" />
                    <n-input
                      :value="formatLooseValue(value.value)"
                      placeholder="值"
                      @update:value="v => { const parsed = parseLooseValue(v); value.value = (parsed === undefined ? '' : parsed) as FieldOption['value'] }"
                    />
                    <n-switch
                      :value="!!value.disabled"
                      size="small"
                      @update:value="(v) => { value.disabled = v ? true : undefined }"
                    >
                      <template #checked>禁</template>
                      <template #unchecked>启</template>
                    </n-switch>
                  </div>
                </n-dynamic-input>
              </n-form>
            </section>
          </template>

          <template v-if="needsTreeOptions(String(field.component))">
            <section class="field-props-section">
              <div class="field-props-section__title">树形选项</div>
              <n-form label-placement="top" size="small" :show-feedback="false">
                <n-form-item label="编辑方式">
                  <n-radio-group v-model:value="treeEditorMode" size="small">
                    <n-radio-button :value="true">可视化</n-radio-button>
                    <n-radio-button :value="false">JSON</n-radio-button>
                  </n-radio-group>
                </n-form-item>
                <n-form-item v-if="treeEditorMode" label="节点">
                  <TreeOptionsEditor v-model="treeOptions" />
                </n-form-item>
                <n-form-item v-else label="JSON">
                  <n-input
                    type="textarea"
                    :rows="6"
                    :value="treeOptionsJson"
                    placeholder='[{"label":"父","value":"1","children":[{"label":"子","value":"1-1"}]}]'
                    @update:value="updateTreeOptions"
                  />
                </n-form-item>
              </n-form>
            </section>
          </template>
        </div>
      </n-tab-pane>

      <!-- 高级 -->
      <n-tab-pane name="advanced" tab="高级">
        <div class="field-props-panel__sections">
          <template v-if="formEnabled">
            <section class="field-props-section">
              <div class="field-props-section__title">联动显隐</div>
              <n-form label-placement="top" size="small" :show-feedback="false">
                <n-form-item label="模式">
                  <n-select
                    :value="visibilityMode"
                    :options="visibilityModeOptions"
                    @update:value="setVisibilityMode"
                  />
                </n-form-item>
                <template v-if="visibilityMode !== 'none'">
                  <n-form-item label="编辑方式">
                    <n-radio-group v-model:value="visibilityBuilderMode" size="small">
                      <n-radio-button :value="true">可视化</n-radio-button>
                      <n-radio-button :value="false">表达式</n-radio-button>
                    </n-radio-group>
                  </n-form-item>
                  <VisibilityBuilder
                    v-if="visibilityBuilderMode"
                    :field="field"
                    :ref-field-options="refFieldOptions"
                    @update-expr="onVisibilityBuilderExpr"
                  />
                  <template v-else>
                    <n-form-item label="快捷模板">
                      <n-space vertical style="width: 100%">
                        <n-select
                          :options="refFieldOptions"
                          placeholder="选择引用字段"
                          clearable
                          @update:value="setVisibilityRefField"
                        />
                        <n-space v-if="visibilityRefField" wrap>
                          <n-button size="tiny" @click="applyVisibilityTemplate('eq', '1')">等于 '1'</n-button>
                          <n-button size="tiny" @click="applyVisibilityTemplate('eq', '0')">等于 '0'</n-button>
                          <n-button size="tiny" @click="applyVisibilityTemplate('neq', '0')">不等于 '0'</n-button>
                          <n-button size="tiny" @click="applyVisibilityTemplate('truthy')">为真值</n-button>
                          <n-button size="tiny" @click="applyVisibilityTemplate('empty')">为空</n-button>
                          <n-button size="tiny" @click="applyVisibilityTemplate('gt', '0')">大于 0</n-button>
                          <n-button size="tiny" @click="applyVisibilityTemplate('includes', 'test')">包含</n-button>
                        </n-space>
                      </n-space>
                    </n-form-item>
                  </template>
                  <n-form-item label="表达式">
                    <n-input
                      type="textarea"
                      :rows="3"
                      :value="visibilityExpr"
                      placeholder="如 model.status === '1'"
                      @update:value="updateVisibilityExpr"
                    />
                  </n-form-item>
                  <n-alert
                    v-if="visibilityExprError"
                    type="error"
                    :bordered="false"
                    class="field-props-panel__alert"
                  >
                    {{ visibilityExprError }}
                  </n-alert>
                  <n-alert v-else type="info" :bordered="false" class="field-props-panel__alert">
                    使用 model.字段名 访问表单值；JSON 导出为 visibleExpr / hiddenExpr
                  </n-alert>
                </template>
              </n-form>
            </section>

            <section class="field-props-section">
              <div class="field-props-section__title">场景控件覆盖</div>
              <n-collapse class="field-props-panel__collapse">
                <n-collapse-item title="表单控件覆盖" name="form-bind">
                  <SceneBindEditor :field="field" scene="form" />
                </n-collapse-item>
                <n-collapse-item v-if="searchEnabled" title="搜索控件覆盖" name="search-bind">
                  <SceneBindEditor :field="field" scene="search" />
                </n-collapse-item>
              </n-collapse>
            </section>

            <section class="field-props-section">
              <div class="field-props-section__title">自定义逻辑</div>
              <n-form label-placement="top" size="small" :show-feedback="false">
                <n-form-item label="自定义 render">
                  <n-input
                    type="textarea"
                    :rows="3"
                    :value="field._renderExpr || ''"
                    placeholder="如 '预览: ' + curData"
                    @update:value="(v) => { if (v) field._renderExpr = v; else delete field._renderExpr }"
                  />
                </n-form-item>
                <n-form-item label="onChange">
                  <n-input
                    type="textarea"
                    :rows="3"
                    :value="field._onChangeExpr || ''"
                    placeholder="如 model.remark = value"
                    @update:value="(v) => { if (v) field._onChangeExpr = v; else delete field._onChangeExpr }"
                  />
                </n-form-item>
                <n-alert type="info" :bordered="false" class="field-props-panel__alert">
                  render 需返回字符串或 VNode；onChange 可使用 value、model、item
                </n-alert>
              </n-form>
            </section>
          </template>
          <n-empty v-else description="需启用表单场景后才可使用高级配置" size="small" />
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped>
.field-props-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-props-panel__header {
  padding: 10px 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--n-primary-color) 6%, var(--n-color));
  border: 1px solid color-mix(in srgb, var(--n-primary-color) 12%, var(--n-border-color));
}

.field-props-panel__header-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--n-text-color-1);
  word-break: break-all;
}

.field-props-panel__header-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.field-props-panel__key {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--n-border-color) 30%, transparent);
  color: var(--n-text-color-2);
  font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace;
}

.field-props-panel__scene-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.field-props-panel__tabs :deep(.n-tabs-rail) {
  width: 100%;
}

.field-props-panel__tabs :deep(.n-tab-pane) {
  padding-top: 0;
}

.field-props-panel__sections {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
}

.field-props-section {
  padding: 10px 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--n-border-color) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--n-border-color) 50%, transparent);
}

.field-props-section__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--n-text-color-2);
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid color-mix(in srgb, var(--n-border-color) 60%, transparent);
}

.field-props-panel__scene-switch {
  display: flex;
  width: 100%;
  margin-bottom: 2px;
}

.field-props-panel__scene-switch :deep(.n-radio-button) {
  flex: 1;
  text-align: center;
}

.field-props-panel__hint {
  font-size: 11px;
  color: var(--n-text-color-3);
  margin: -4px 0 8px;
}

.field-props-panel__alert {
  margin-top: 4px;
}

.field-props-panel__collapse :deep(.n-collapse-item) {
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 6px;
  border: 1px solid color-mix(in srgb, var(--n-border-color) 50%, transparent);
}

.field-props-panel__collapse :deep(.n-collapse-item__header) {
  padding: 8px 10px;
  font-size: 12px;
}

.field-props-panel :deep(.n-form-item) {
  margin-bottom: 10px;
}

.field-props-panel :deep(.n-form-item:last-child) {
  margin-bottom: 0;
}

.field-props-panel :deep(.n-form-item-label) {
  font-size: 12px;
  padding-bottom: 4px;
}

.form-builder__option-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
  width: 100%;
  align-items: center;
}
</style>
