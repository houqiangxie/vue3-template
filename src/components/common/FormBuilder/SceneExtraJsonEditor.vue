<script setup lang="ts">
import type { BuilderField } from './types'
import {
  EXTRA_JSON_PRESETS,
  FORM_MANAGED_KEYS,
  SEARCH_MANAGED_KEYS,
  TABLE_MANAGED_KEYS,
  type ExtraJsonScope,
  deepMergePatch,
  formatExtraJson,
  mergeExtraBind,
  mergeExtraSceneConfig,
  parseExtraJsonObject,
  pickExtraByScope,
  previewMergedBind,
} from './bindManagedKeys'

const props = defineProps<{
  field: BuilderField
  formEnabled: boolean
  searchEnabled: boolean
  tableEnabled: boolean
}>()

const { message } = useConfirm()

const scope = ref<ExtraJsonScope>('common')
const draft = ref('')
const jsonError = ref('')
const ignoredHint = ref('')
const editing = ref(false)

const scopeOptions = computed(() => [
  {
    label: '公共',
    value: 'common' as const,
    disabled: false,
  },
  {
    label: '表单',
    value: 'form' as const,
    disabled: !props.formEnabled,
  },
  {
    label: '搜索',
    value: 'search' as const,
    disabled: !props.searchEnabled,
  },
  {
    label: '表格',
    value: 'table' as const,
    disabled: !props.tableEnabled,
  },
])

const activeScopeLabel = computed(
  () => scopeOptions.value.find(item => item.value === scope.value)?.label || '公共',
)

const scopeHint = computed(() => {
  switch (scope.value) {
    case 'common':
      return '写入 field.bind，表单与搜索合并生效；不含上方已可视化的控件参数'
    case 'form':
      return '写入 form，仅表单场景；可含 bind 子对象，不含场景 Tab 已配置项'
    case 'search':
      return '写入 search，仅搜索场景；可含 bind 子对象'
    case 'table':
      return '写入 table，仅表格列；不含场景 Tab 已配置的列属性'
    default:
      return ''
  }
})

const scopePlaceholder = computed(() => {
  switch (scope.value) {
    case 'common':
      return '{"autofocus": true}'
    case 'form':
      return '{"class": "wide", "bind": {"size": "large"}}'
    case 'search':
      return '{"bind": {"size": "small"}}'
    case 'table':
      return '{"resizable": true}'
    default:
      return '{}'
  }
})

const presets = computed(() => EXTRA_JSON_PRESETS[scope.value] || [])

const showMergePreview = computed(() => scope.value === 'form' || scope.value === 'search')

const mergePreviewJson = computed(() => {
  if (!showMergePreview.value)
    return ''
  const merged = previewMergedBind(props.field, scope.value as 'form' | 'search')
  return formatExtraJson(merged) || '{}'
})

const labelMap: Record<ExtraJsonScope, string> = {
  common: '公共扩展 bind',
  form: '表单扩展',
  search: '搜索扩展',
  table: '表格扩展',
}

function syncDraftFromField() {
  draft.value = formatExtraJson(pickExtraByScope(props.field, scope.value))
  jsonError.value = ''
  ignoredHint.value = ''
}

function ensureFormConfig() {
  if (props.field.form === false || props.field.form == null)
    props.field.form = { span: 1 }
  return props.field.form!
}

function ensureSearchConfig() {
  if (props.field.search === false || props.field.search == null)
    props.field.search = { span: 8 }
  return props.field.search!
}

function ensureTableConfig() {
  if (props.field.table === false || props.field.table == null)
    props.field.table = { width: 120 }
  return props.field.table!
}

function applyParsed(parsed: Record<string, unknown>, normalizeDraft = false) {
  const component = String(props.field.component || 'NInput')
  let ignored: string[] = []

  switch (scope.value) {
    case 'common': {
      const current = Array.isArray(props.field.bind) ? props.field.bind[0] : props.field.bind
      const result = mergeExtraBind(current, component, parsed)
      props.field.bind = Object.keys(result.next).length ? result.next : undefined
      ignored = result.ignored
      break
    }
    case 'form': {
      const result = mergeExtraSceneConfig(ensureFormConfig(), FORM_MANAGED_KEYS, parsed)
      props.field.form = result.next
      ignored = result.ignored
      break
    }
    case 'search': {
      const result = mergeExtraSceneConfig(ensureSearchConfig(), SEARCH_MANAGED_KEYS, parsed)
      props.field.search = result.next
      ignored = result.ignored
      break
    }
    case 'table': {
      const result = mergeExtraSceneConfig(ensureTableConfig(), TABLE_MANAGED_KEYS, parsed)
      props.field.table = result.next
      ignored = result.ignored
      break
    }
  }

  ignoredHint.value = ignored.length
    ? `已忽略面板已管理键：${ignored.join(', ')}`
    : ''

  if (normalizeDraft)
    draft.value = formatExtraJson(pickExtraByScope(props.field, scope.value))
}

function updateDraft(text: string) {
  draft.value = text
  editing.value = true
  const { value, error } = parseExtraJsonObject(text, labelMap[scope.value])
  jsonError.value = error
  if (error || value == null)
    return
  applyParsed(value, false)
}

function commitDraft() {
  editing.value = false
  const { value, error } = parseExtraJsonObject(draft.value, labelMap[scope.value])
  jsonError.value = error
  if (error || value == null) {
    if (error)
      message.warning(error)
    syncDraftFromField()
    return
  }
  applyParsed(value, true)
  if (ignoredHint.value)
    message.warning(ignoredHint.value)
}

function applyPreset(patch: Record<string, unknown>) {
  const { value, error } = parseExtraJsonObject(draft.value || '{}', labelMap[scope.value])
  if (error || value == null) {
    jsonError.value = error || '请先修正 JSON'
    message.warning(jsonError.value)
    return
  }
  const merged = deepMergePatch(value, patch)
  applyParsed(merged, true)
  jsonError.value = ''
  if (ignoredHint.value)
    message.warning(ignoredHint.value)
}

watch(
  () => [props.field.uid, scope.value] as const,
  () => {
    editing.value = false
    syncDraftFromField()
  },
  { immediate: true },
)

watch(
  () => [props.formEnabled, props.searchEnabled, props.tableEnabled] as const,
  ([formEnabled, searchEnabled, tableEnabled]) => {
    if (scope.value === 'form' && !formEnabled)
      scope.value = 'common'
    if (scope.value === 'search' && !searchEnabled)
      scope.value = 'common'
    if (scope.value === 'table' && !tableEnabled)
      scope.value = 'common'
  },
)

// 外部改了同一字段的 bind/form 时，非编辑状态同步草稿
watch(
  () => [
    JSON.stringify(pickExtraByScope(props.field, scope.value)),
  ],
  () => {
    if (!editing.value)
      syncDraftFromField()
  },
)
</script>

<template>
  <section class="field-props-section scene-extra-json">
    <div class="field-props-section__title">扩展属性 (JSON)</div>
    <n-form label-placement="top" size="small" :show-feedback="false">
      <n-form-item label="作用范围">
        <n-radio-group v-model:value="scope" size="small" class="scene-extra-json__scopes">
          <n-radio-button
            v-for="item in scopeOptions"
            :key="item.value"
            :value="item.value"
            :disabled="item.disabled"
          >
            {{ item.label }}
          </n-radio-button>
        </n-radio-group>
      </n-form-item>

      <n-form-item v-if="presets.length" label="常用键">
        <n-space size="small" wrap>
          <n-button
            v-for="item in presets"
            :key="item.label"
            size="tiny"
            secondary
            @click="applyPreset(item.patch)"
          >
            {{ item.label }}
          </n-button>
        </n-space>
      </n-form-item>

      <n-form-item :label="`${activeScopeLabel} 扩展`">
        <n-input
          type="textarea"
          :value="draft"
          :status="jsonError ? 'error' : undefined"
          :autosize="{ minRows: 3, maxRows: 12 }"
          :placeholder="scopePlaceholder"
          :disabled="scope !== 'common' && scopeOptions.find(item => item.value === scope)?.disabled"
          @focus="editing = true"
          @blur="commitDraft"
          @update:value="updateDraft"
        />
      </n-form-item>

      <n-alert
        v-if="jsonError"
        type="error"
        :bordered="false"
        class="field-props-panel__alert"
      >
        {{ jsonError }}
      </n-alert>
      <n-alert
        v-else-if="ignoredHint"
        type="warning"
        :bordered="false"
        class="field-props-panel__alert"
      >
        {{ ignoredHint }}
      </n-alert>
      <n-alert
        v-else
        type="info"
        :bordered="false"
        class="field-props-panel__alert"
      >
        {{ scopeHint }}
      </n-alert>

      <n-form-item v-if="showMergePreview" label="合并后 bind 预览">
        <n-input
          type="textarea"
          :value="mergePreviewJson"
          readonly
          :autosize="{ minRows: 2, maxRows: 8 }"
          class="scene-extra-json__preview"
        />
        <div class="scene-extra-json__preview-hint">
          公共 bind + {{ activeScopeLabel }} bind 覆盖结果（只读）
        </div>
      </n-form-item>
    </n-form>
  </section>
</template>

<style scoped>
.scene-extra-json__scopes {
  width: 100%;
  display: flex;
}

.scene-extra-json__scopes :deep(.n-radio-button) {
  flex: 1;
  text-align: center;
}

.scene-extra-json__preview :deep(.n-input__textarea-el) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  color: var(--n-text-color-3);
}

.scene-extra-json__preview-hint {
  margin-top: 4px;
  font-size: 11px;
  color: var(--n-text-color-3);
}
</style>
