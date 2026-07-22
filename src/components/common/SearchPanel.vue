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
  NInput,
  NSelect,
  NTreeSelect,
} from 'naive-ui'
import { toSearchConfig, type FieldBind, type FieldRenderFn, type SearchConfigItem, type UnifiedFieldConfig } from './fieldSchema'

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
  config?: SearchConfigItem[]
  fields?: UnifiedFieldConfig[]
  showAllSearchField?: boolean
  showSearchButton?: boolean
  cols?: number
  columnGap?: string
  rowGap?: string
  bindSearch?: Record<string, unknown>
  bindSlot?: Record<string, unknown>
  components?: Record<string, Component>
}>(), {
  config: () => [],
  fields: () => [],
  showAllSearchField: false,
  showSearchButton: true,
  cols: 7,
  columnGap: '1.25rem',
  rowGap: '0.75rem',
  bindSearch: () => ({}),
  bindSlot: () => ({}),
  components: () => ({}),
})

const searchModel = defineModel<Record<string, unknown>>('searchModel', { required: true })

const emit = defineEmits<{
  search: [payload: Record<string, unknown>]
  resetForm: []
}>()

const slots = useSlots()
const searchFormRef = ref<InstanceType<typeof NForm>>()

const resolvedConfig = computed(() => {
  if (props.fields.length)
    return toSearchConfig(props.fields)
  return props.config
})

const componentMap = computed(() => ({
  ...SEARCH_COMPONENTS,
  ...props.components,
}))

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${props.cols}, minmax(0, 1fr))`,
  columnGap: props.columnGap,
  rowGap: props.rowGap,
}))

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
  return resolveArrayValue(item.options, index)
}

function resolveEvents(item: SearchConfigItem, index?: number): Record<string, (...args: unknown[]) => void> {
  return resolveArrayValue(item.on, index, {})!
}

function isFieldVisible(item: SearchConfigItem) {
  return props.showAllSearchField || item.isSearch
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
  const visible = isFieldVisible(item)

  if (typeof item.key === 'string') {
    const custom = hasCustomRender(item, bind)
    return (
      <NFormItem
        key={`search-${index}-${item.key}`}
        label={item.label ?? item.title}
        style={{ display: visible ? undefined : 'none' }}
        {...item.bindItem}
      >
        {custom ? safeRenderCustom(item, bind) : renderFieldControl(item)}
      </NFormItem>
    )
  }

  return (
    <NFormItem
      key={`search-${index}-${item.key.join('_')}`}
      label={item.label ?? item.title}
      style={{ display: visible ? undefined : 'none' }}
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

function RenderRoot() {
  return (
    <div class="search-box relative w-full rounded-t-lg bg-white p-5">
      <NForm ref={searchFormRef} labelPlacement="left" model={searchModel.value}>
        <div class="box w-full" style={gridStyle.value}>
          {resolvedConfig.value.map((item, index) => renderSearchField(item, index))}

          {props.showSearchButton && (
            <NFormItem class="search-btn" {...props.bindSearch}>
              <NButton class="mr-2" type="info" onClick={getList}>
                <svg class="icon mr-1 text-xs text-white" aria-hidden="true">
                  <use xlink:href="#icon-search"></use>
                </svg>
                查询
              </NButton>
              <NButton class="mr-2" type="info" ghost onClick={resetForm}>
                <svg class="icon mr-1 text-xs text-[#2080f0]" aria-hidden="true">
                  <use xlink:href="#icon-reset"></use>
                </svg>
                重置
              </NButton>
              {slots.searchSlot?.()}
            </NFormItem>
          )}

          <NFormItem style={{ marginLeft: 'auto' }} {...props.bindSlot}>
            {slots.default?.()}
          </NFormItem>
        </div>
      </NForm>
    </div>
  )
}

defineExpose({
  getList,
  resetForm,
  searchFormRef,
})
</script>

<template>
  <RenderRoot />
</template>

<style scoped>
.search-box :deep(.n-form-item-feedback-wrapper) {
  display: none !important;
}
</style>
