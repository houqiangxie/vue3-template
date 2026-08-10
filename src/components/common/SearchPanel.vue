<script setup lang="tsx">
import type { Component, VNode } from 'vue'
import {
  NButton,
  NCascader,
  NDatePicker,
  NForm,
  NFormItem,
  NFormItemGi,
  NGrid,
  NIcon,
  NInput,
  NSelect,
  NTreeSelect,
  useThemeVars,
} from 'naive-ui'
import { ChevronDownOutline, ChevronUpOutline, RefreshOutline, SearchOutline } from '@vicons/ionicons5'
import { toSearchConfig, type FieldBind, type FieldRenderFn, type SearchConfigItem, type UnifiedFieldConfig } from './table/fieldSchema'

const SEARCH_COMPONENTS: Record<string, Component> = {
  NInput,
  NSelect,
  NDatePicker,
  NCascader,
  NTreeSelect,
}

const COMPONENTS_WITH_CLEARABLE = new Set([
  'NInput', 'NSelect', 'NDatePicker', 'NCascader', 'NTreeSelect',
])

const warnedComponents = new Set<string>()

const props = withDefaults(defineProps<{
  /**
   * @deprecated 请改用 fields
   */
  config?: SearchConfigItem[]
  fields?: UnifiedFieldConfig[]
  showAllSearchField?: boolean
  showSearchButton?: boolean
  /** 栅格总列数，默认 24 */
  cols?: number
  /** 每个搜索项默认占用列数，默认 4 */
  col?: number
  columnGap?: string
  rowGap?: string
  bindSearch?: Record<string, unknown>
  bindSlot?: Record<string, unknown>
  components?: Record<string, Component>
  /** 始终展开，不显示「更多」 */
  alwaysExpanded?: boolean
}>(), {
  config: () => [],
  fields: () => [],
  showAllSearchField: false,
  showSearchButton: true,
  cols: 24,
  col: 4,
  columnGap: '1rem',
  rowGap: '0',
  bindSearch: () => ({}),
  bindSlot: () => ({}),
  components: () => ({}),
  alwaysExpanded: false,
})

const searchModel = defineModel<Record<string, unknown>>('searchModel', { required: true })

const emit = defineEmits<{
  search: [payload: Record<string, unknown>]
  resetForm: []
}>()

const themeVars = useThemeVars()
const panelBgStyle = computed(() => ({
  backgroundColor: themeVars.value.cardColor,
}))

const slots = useSlots()
const searchFormRef = ref<InstanceType<typeof NForm>>()
const fieldsRef = ref<HTMLElement>()

const resolvedConfig = computed(() => {
  if (props.fields.length)
    return toSearchConfig(props.fields)
  return props.config
})

const visibleFields = computed(() =>
  resolvedConfig.value.filter(item => props.showAllSearchField || item.isSearch),
)

const componentMap = computed(() => ({
  ...SEARCH_COMPONENTS,
  ...props.components,
}))

function getFieldSpan(item: SearchConfigItem): number {
  const span = item.span ?? item.col ?? props.col
  return Math.min(Math.max(1, span), props.cols)
}

/** 字段按栅格是否超过一行（超过才显示「更多」） */
const showToggle = computed(() => {
  if (props.alwaysExpanded)
    return false
  let used = 0
  for (const item of visibleFields.value) {
    const span = getFieldSpan(item)
    if (used > 0 && used + span > props.cols)
      return true
    used += span
    if (used > props.cols)
      return true
  }
  return false
})

const {
  expanded,
  oneRowHeight,
  isMeasuring,
  isCollapsedLayout,
  measureRowHeight,
  toggleExpand,
} = useSearchPanelCollapse({
  fieldsRef,
  fieldCount: () => visibleFields.value.length,
  alwaysExpanded: () => props.alwaysExpanded,
  showToggle: () => showToggle.value,
})

function fieldItemStyle(item: SearchConfigItem) {
  const span = getFieldSpan(item)
  const gap = props.columnGap
  return {
    flex: `0 0 calc(${(span / props.cols) * 100}% - ${gap} * ${(props.cols - span) / props.cols})`,
    maxWidth: `calc(${(span / props.cols) * 100}% - ${gap} * ${(props.cols - span) / props.cols})`,
  }
}

const fieldsGridStyle = computed(() => ({
  display: 'flex',
  flexWrap: 'wrap' as const,
  columnGap: props.columnGap,
  rowGap: props.rowGap,
  alignItems: 'flex-start',
  width: '100%',
}))

const collapsedOuterStyle = computed(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  columnGap: props.columnGap,
  width: '100%',
}))

const collapsedFieldsStyle = computed(() => {
  const clip = !isMeasuring.value && showToggle.value && !expanded.value
  return {
    flex: '1 1 0%',
    minWidth: 0,
    overflow: clip ? 'hidden' : 'visible',
    maxHeight: clip ? `${oneRowHeight.value}px` : 'none',
  }
})

const expandedOuterStyle = computed(() => ({
  display: 'flex',
  flexWrap: 'wrap' as const,
  columnGap: props.columnGap,
  rowGap: props.rowGap,
  alignItems: 'flex-start',
  width: '100%',
}))

const actionsStyle = {
  display: 'flex',
  flexWrap: 'nowrap' as const,
  alignItems: 'center',
  gap: '8px',
  flexShrink: 0,
  marginBottom: '12px',
}

const expandedActionsStyle = {
  ...actionsStyle,
  marginLeft: 'auto',
}

function resolveArrayValue<T>(value: T | T[] | undefined, index?: number, fallback?: T): T | undefined {
  if (index !== undefined && Array.isArray(value))
    return value[index] ?? fallback
  if (!Array.isArray(value))
    return value ?? fallback
  return value[0] ?? fallback
}

function resolveBind(item: SearchConfigItem, index?: number): FieldBind {
  return resolveArrayValue(item.bind, index, {})!
}

function resolveComponentName(item: SearchConfigItem, index?: number): string {
  return resolveArrayValue(item.component, index, 'NInput')!
}

function resolveType(item: SearchConfigItem, index?: number): string {
  return resolveArrayValue(item.type, index, 'input')!
}

function resolveOptions(item: SearchConfigItem, index?: number) {
  const options = item.options
  // 多字段场景才是「选项数组的数组」；普通字段的 options 本身就是选项列表，不能取 [0]
  if (
    index !== undefined
    && Array.isArray(options)
    && options.length > 0
    && Array.isArray(options[0])
  ) {
    return options[index]
  }
  return options
}

function resolveEvents(item: SearchConfigItem, index?: number): Record<string, (...args: unknown[]) => void> {
  return resolveArrayValue(item.on, index, {})!
}

const BIND_META_KEYS = new Set([
  'required', 'hidden', 'visible', 'slotName', 'render', 'dateValueSuffix',
])

function pickControlBind(bind: FieldBind): Record<string, unknown> {
  const controlBind: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(bind)) {
    if (!BIND_META_KEYS.has(key))
      controlBind[key] = value
  }
  return controlBind
}

function resolveRenderFn(item: SearchConfigItem, bind: FieldBind): FieldRenderFn | undefined {
  return (bind.render ?? item.render) as FieldRenderFn | undefined
}

function hasCustomRender(item: SearchConfigItem, bind: FieldBind) {
  return !!(resolveRenderFn(item, bind) || bind.slotName)
}

function resolveComponent(componentName: string): Component {
  const component = componentMap.value[componentName]
  if (component)
    return component
  if (import.meta.env.DEV && !warnedComponents.has(componentName)) {
    warnedComponents.add(componentName)
    console.warn(`[SearchPanel] 未知组件 "${componentName}"，已回退为 NInput`)
  }
  return NInput
}

function renderControlSlots(
  slotDef: SearchConfigItem['slot'],
  item: SearchConfigItem,
  fieldKey: string,
) {
  if (!slotDef || typeof slotDef !== 'object')
    return undefined

  const curData = searchModel.value[fieldKey]
  const slotRenderers: Record<string, () => VNode | string> = {}
  for (const [name, fn] of Object.entries(slotDef)) {
    if (typeof fn === 'function')
      slotRenderers[name] = () => fn(item, searchModel.value, curData) as VNode | string
  }
  return Object.keys(slotRenderers).length ? slotRenderers : undefined
}

function renderFieldControl(item: SearchConfigItem, index?: number) {
  const bind = resolveBind(item, index)
  const fieldKey = typeof item.key === 'string' ? item.key : item.key[index ?? 0]
  const componentName = resolveComponentName(item, index)
  const Component = resolveComponent(componentName)
  const model = searchModel.value
  const dateSuffix = (bind.dateValueSuffix as string | undefined) ?? 'value'

  const commonProps = {
    class: 'w-full',
    type: resolveType(item, index),
    options: resolveOptions(item, index),
    ...(COMPONENTS_WITH_CLEARABLE.has(componentName) ? { clearable: true } : {}),
    ...pickControlBind(bind),
    ...resolveEvents(item, index),
  }

  if (componentName === 'NDatePicker') {
    return (
      <Component
        {...commonProps}
        v-model:value={model[`${fieldKey}${dateSuffix}`]}
        v-model:formatted-value={model[fieldKey]}
      >
        {renderControlSlots(item.slot, item, fieldKey)}
      </Component>
    )
  }

  return (
    <Component {...commonProps} v-model:value={model[fieldKey]}>
      {renderControlSlots(item.slot, item, fieldKey)}
    </Component>
  )
}

function safeRenderCustom(item: SearchConfigItem, bind: FieldBind) {
  const fieldKey = typeof item.key === 'string' ? item.key : item.key[0]
  const renderFn = resolveRenderFn(item, bind)
  try {
    if (renderFn)
      return renderFn(item, searchModel.value, searchModel.value[fieldKey])
    if (bind.slotName && slots[bind.slotName as string])
      return slots[bind.slotName as string]!({ row: item })
  }
  catch (error) {
    if (import.meta.env.DEV)
      console.error('[SearchPanel] render 渲染失败:', error)
    return <span class="text-red-500">渲染失败</span>
  }
  return null
}

function renderSearchField(item: SearchConfigItem, index: number) {
  const bind = resolveBind(item)

  if (typeof item.key === 'string') {
    const custom = hasCustomRender(item, bind)
    return (
      <NFormItem
        key={`search-${index}-${item.key}`}
        class="search-field-item"
        label={item.label ?? item.title}
        {...item.bindItem}
      >
        {custom ? safeRenderCustom(item, bind) : renderFieldControl(item)}
      </NFormItem>
    )
  }

  return (
    <NFormItem
      key={`search-${index}-${item.key.join('_')}`}
      class="search-field-item"
      label={item.label ?? item.title}
      {...item.bindItem}
    >
      <NGrid xGap={12} cols={item.key.length}>
        {item.key.map((fieldKey, subIndex) => {
          const subBind = resolveBind(item, subIndex)
          const subCustom = hasCustomRender(item, subBind)
          return (
            <NFormItemGi key={fieldKey}>
              {subCustom
                ? safeRenderCustom({ ...item, key: fieldKey }, subBind)
                : renderFieldControl({ ...item, key: fieldKey }, subIndex)}
            </NFormItemGi>
          )
        })}
      </NGrid>
    </NFormItem>
  )
}

function getList() {
  emit('search', searchModel.value)
}

function resetForm() {
  for (const item of resolvedConfig.value) {
    if (typeof item.key === 'string')
      searchModel.value[item.key] = null
    else
      item.key.forEach(k => { searchModel.value[k] = null })
  }
  emit('resetForm')
  searchModel.value.pageNum = 1
  getList()
}

watch(
  () => searchModel.value,
  () => {
    if (!props.showSearchButton)
      getList()
  },
  { deep: true },
)

watch(
  () => [visibleFields.value.length, props.cols, props.col, props.alwaysExpanded, props.columnGap] as const,
  () => {
    if (props.alwaysExpanded)
      expanded.value = true
    measureRowHeight()
  },
)

onMounted(() => {
  if (props.alwaysExpanded)
    expanded.value = true
  measureRowHeight()
  window.addEventListener('resize', measureRowHeight)
})

onActivated(() => {
  measureRowHeight()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measureRowHeight)
})

function renderActions(style: Record<string, unknown>) {
  return (
    <div class="search-actions" {...props.bindSearch} style={style}>
      {showToggle.value && (
        <NButton text type="primary" onClick={toggleExpand}>
          {{
            icon: () => (
              <NIcon size={14}>
                {expanded.value ? <ChevronUpOutline /> : <ChevronDownOutline />}
              </NIcon>
            ),
            default: () => (expanded.value ? '收起' : '展开'),
          }}
        </NButton>
      )}

      {props.showSearchButton && (
        <>
          <NButton type="primary" onClick={getList}>
            {{
              icon: () => (
                <NIcon size={14}>
                  <SearchOutline />
                </NIcon>
              ),
              default: () => '查询',
            }}
          </NButton>
          <NButton type="primary" ghost onClick={resetForm}>
            {{
              icon: () => (
                <NIcon size={14}>
                  <RefreshOutline />
                </NIcon>
              ),
              default: () => '重置',
            }}
          </NButton>
        </>
      )}

      {slots.searchSlot?.()}
      <div class="search-actions__extra" {...props.bindSlot} style={{ display: 'contents' }}>
        {slots.default?.()}
      </div>
    </div>
  )
}

function renderFieldNodes() {
  return visibleFields.value.map((item, index) => (
    <div
      key={typeof item.key === 'string' ? item.key : item.key.join('_')}
      class="search-field-wrap"
      style={fieldItemStyle(item)}
    >
      {renderSearchField(item, index)}
    </div>
  ))
}

function RenderRoot() {
  // 折叠：字段区只露一行，操作区并排贴在第一行右侧
  // 展开：字段与操作区同一流式布局，操作区在最后一行右侧
  if (isCollapsedLayout.value) {
    return (
      <div class="search-panel relative w-full rounded-t-lg p-3 pb-0" style={panelBgStyle.value}>
        <NForm ref={searchFormRef} labelPlacement="left" labelWidth="auto" model={searchModel.value}>
          <div class="search-row" style={collapsedOuterStyle.value}>
            <div ref={fieldsRef} class="search-fields" style={collapsedFieldsStyle.value}>
              <div style={fieldsGridStyle.value}>
                {renderFieldNodes()}
              </div>
            </div>
            {renderActions(actionsStyle)}
          </div>
        </NForm>
      </div>
    )
  }

  return (
    <div class="search-panel relative w-full rounded-t-lg p-3 pb-0" style={panelBgStyle.value}>
      <NForm ref={searchFormRef} labelPlacement="left" labelWidth="auto" model={searchModel.value}>
        <div ref={fieldsRef} class="search-row" style={expandedOuterStyle.value}>
          {renderFieldNodes()}
          {renderActions(expandedActionsStyle)}
        </div>
      </NForm>
    </div>
  )
}

defineExpose({
  getList,
  resetForm,
  measure: measureRowHeight,
  searchFormRef,
})
</script>

<template>
  <RenderRoot />
</template>

<style scoped>
/* RenderRoot 为子组件，内部节点拿不到本组件 scoped 属性，布局相关样式须用 :deep 或内联 */
.search-panel :deep(.n-form-item-feedback-wrapper) {
  display: none !important;
}

.search-panel :deep(.search-field-wrap) {
  min-width: 0;
  box-sizing: border-box;
}

.search-panel :deep(.search-field-item) {
  margin-bottom: 12px;
}

.search-panel :deep(.search-field-item .n-form-item-blank) {
  min-width: 0;
}

.search-panel :deep(.search-actions .n-button .n-icon),
.search-panel :deep(.search-actions__extra .n-button .n-icon) {
  font-size: 14px !important;
}

.search-panel :deep(.search-actions .n-button .n-icon svg),
.search-panel :deep(.search-actions__extra .n-button .n-icon svg) {
  width: 1em;
  height: 1em;
}
</style>
