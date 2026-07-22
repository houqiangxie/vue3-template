<script setup lang="tsx">
import type { Component, VNode } from 'vue'
import type { FormItemRule } from 'naive-ui'
import { toFormConfig, type FieldRenderFn, type UnifiedFieldConfig } from './fieldSchema'
import {
  NCheckbox,
  NCheckboxGroup,
  NColorPicker,
  NConfigProvider,
  NDatePicker,
  NCascader,
  NDynamicInput,
  NEllipsis,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NRadio,
  NRadioButton,
  NRadioGroup,
  NRate,
  NSelect,
  NSlider,
  NSwitch,
  NTransfer,
  NTreeSelect,
  NUpload,
} from 'naive-ui'

const VALIDATE_REG = {
  default: /^.+$/,
  phone: /^[1][3,4,5,6,7,8,9][0-9]{9}$/,
  phone_prefix: /\d{3,4}/,
  phone_suffix: /\d{7,8}/,
  phone_number: /^((0\d{2,3}-\d{7,8})|(1[3456789]\d{9}))$/,
} as const

export type ValidatePatternType = keyof typeof VALIDATE_REG

export type NaiveComponentName =
  | 'NInput' | 'NSelect' | 'NDatePicker' | 'NUpload' | 'NInputNumber'
  | 'NDynamicInput' | 'NSwitch' | 'NCheckboxGroup' | 'NRadioGroup'
  | 'NRadio' | 'NRadioButton' | 'NCheckbox' | 'NTransfer' | 'NCascader'
  | 'NTreeSelect' | 'NSlider' | 'NColorPicker' | 'NRate'
  | 'Checkbox' | 'Radio' | 'RadioButton'

export type HiddenValue = boolean | ((model: Record<string, unknown>) => boolean)

/** visible 与 hidden 等价，visible: false 即隐藏 */
export type VisibleValue = HiddenValue

export interface FormMessages {
  required?: (label: string) => string
  pattern?: (label: string) => string
}

export interface FieldBind {
  required?: boolean
  hidden?: HiddenValue
  visible?: VisibleValue
  hiddenClear?: boolean
  notValidate?: boolean
  defaultValue?: unknown
  message?: string
  label?: string
  title?: string
  pattern?: RegExp
  patternType?: ValidatePatternType | string
  fileType?: FormItemRule['type']
  extendRule?: FormItemRule
  extendRules?: FormItemRule[]
  rules?: FormItemRule | FormItemRule[]
  slotName?: string
  render?: FieldRenderFn
  options?: Array<{ label: string; value: string | number | boolean; disabled?: boolean }>
  col?: number
  multiple?: boolean
  disabled?: boolean
  readonly?: boolean
  button?: boolean
  /** NDatePicker 时间戳字段后缀，默认 `value` → `{key}value */
  dateValueSuffix?: string
  [key: string]: unknown
}

/** 同一 label 渲染多个组件时，key / component / bind / bindItem / slot 等需使用数组形式 */
export interface ConfigItem {
  id?: string
  label?: string
  title?: string
  key: string | string[]
  required?: boolean | boolean[]
  hidden?: HiddenValue
  visible?: VisibleValue
  hiddenClear?: boolean
  notValidate?: boolean
  defaultValue?: unknown
  component?: NaiveComponentName | string | Array<NaiveComponentName | string>
  options?: unknown | unknown[]
  type?: string | string[]
  on?: Record<string, (...args: unknown[]) => void> | Array<Record<string, (...args: unknown[]) => void>>
  bind?: FieldBind | FieldBind[]
  slot?: Record<string, (item: ConfigItem, formModel: Record<string, unknown>, curData: unknown) => VNode | string> | Array<Record<string, (item: ConfigItem, formModel: Record<string, unknown>, curData: unknown) => VNode | string>>
  bindItem?: Record<string, unknown> | Array<Record<string, unknown>>
  render?: FieldRenderFn
  cols?: number
  class?: string
  showFeedback?: boolean
  /** 占几列，如 2 表示跨两列 */
  span?: number
}

const props = withDefaults(defineProps<{
  /** 直接传表单 config（与 fields 二选一，fields 优先） */
  config?: ConfigItem[]
  /** 统一字段配置，自动转换为表单 config */
  fields?: UnifiedFieldConfig[]
  cols?: number
  basePath?: string
  disabledHideBorder?: boolean
  components?: Record<string, Component>
  validators?: Record<string, RegExp>
  messages?: FormMessages
  disabled?: boolean
  readonly?: boolean
  labelWidth?: number | string | 'auto'
  columnGap?: string
  rowGap?: string
  compact?: boolean
  /** 区块标题（纯展示，不影响校验） */
  title?: string
  description?: string
  size?: 'small' | 'medium' | 'large'
  /** 字段隐藏时是否清空值（字段级 hiddenClear 优先） */
  hiddenClear?: boolean
  showRequireMark?: boolean
}>(), {
  config: () => [],
  cols: 2,
  basePath: '',
  disabledHideBorder: false,
  components: () => ({}),
  validators: () => ({}),
  messages: () => ({}),
  disabled: false,
  readonly: false,
  columnGap: '1.25rem',
  rowGap: '0',
  compact: false,
  hiddenClear: false,
})

/** CommonForm 是表单项渲染器，需放在 NForm 内；多个实例共享同一 formModel，一次 validate 即可 */
const formModel = defineModel<Record<string, unknown>>('formModel', { required: true })

const resolvedConfig = computed(() => {
  if (props.fields?.length)
    return toFormConfig(props.fields) as ConfigItem[]
  return props.config
})

const slots = useSlots()

const THEME_OVERRIDES = {
  common: { iconColorDisabled: 'rgba(209, 209, 209, 0)' },
  Input: { borderDisabled: 'none' },
}

const NAIVE_COMPONENTS: Record<string, Component> = {
  NInput,
  NSelect,
  NDatePicker,
  NUpload,
  NInputNumber,
  NDynamicInput,
  NSwitch,
  NCheckboxGroup,
  NRadioGroup,
  NRadio,
  NRadioButton,
  NCheckbox,
  NTransfer,
  NCascader,
  NTreeSelect,
  NSlider,
  NColorPicker,
  NRate,
}

const CUSTOM_COMPONENTS: Record<string, Component> = {
  file: defineAsyncComponent(() => import('@/components/common/UploadFile.vue')),
  // Editor: defineAsyncComponent(() => import('@/components/common/Editor.vue')),
}

const COMPONENTS_WITH_CLEARABLE = new Set([
  'NInput', 'NSelect', 'NDatePicker', 'NInputNumber', 'NCascader', 'NTreeSelect',
])

const BIND_META_KEYS = new Set([
  'required', 'hidden', 'visible', 'hiddenClear', 'notValidate', 'defaultValue', 'message', 'label', 'title',
  'pattern', 'patternType', 'fileType', 'extendRule', 'extendRules', 'rules',
  'slotName', 'render', 'col', 'button', 'dateValueSuffix',
])

const warnedComponents = new Set<string>()
const warnedPaths = new Set<string>()
const hiddenStateMap = new Map<string, boolean>()

const componentMap = computed(() => ({
  ...NAIVE_COMPONENTS,
  ...CUSTOM_COMPONENTS,
  ...props.components,
}))

const validateRegMap = computed(() => ({
  ...VALIDATE_REG,
  ...props.validators,
}))

const themeOverrides = computed(() => (props.disabledHideBorder ? THEME_OVERRIDES : {}))

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${props.cols}, minmax(0, 1fr))`,
  columnGap: props.columnGap,
  rowGap: props.rowGap,
}))

const defaultBindItem = computed(() => ({
  ...(props.labelWidth !== undefined ? { labelWidth: props.labelWidth } : {}),
  ...(props.showRequireMark !== undefined ? { showRequireMark: props.showRequireMark } : {}),
}))

function resolveArrayValue<T>(value: T | T[] | undefined, index?: number, fallback?: T): T | undefined {
  if (index !== undefined && Array.isArray(value))
    return value[index] ?? fallback
  if (!Array.isArray(value))
    return value ?? fallback
  return value[0] ?? fallback
}

function requiredMessage(label: string) {
  return props.messages.required?.(label) ?? `${label}不能为空`
}

function patternMessage(label: string) {
  return props.messages.pattern?.(label) ?? `${label}格式不正确`
}

function resolveBind(item: ConfigItem, index?: number): FieldBind {
  return resolveArrayValue(item.bind, index, {})!
}

function resolveBindItem(item: ConfigItem, index?: number): Record<string, unknown> {
  return { ...defaultBindItem.value, ...resolveArrayValue(item.bindItem, index, {})! }
}

function resolveSlot(item: ConfigItem, index?: number) {
  return resolveArrayValue(item.slot, index)
}

function resolveComponentName(item: ConfigItem, index?: number): string {
  return resolveArrayValue(item.component, index, 'NInput')!
}

function resolveFieldKey(item: ConfigItem, index?: number): string {
  if (typeof item.key === 'string')
    return item.key
  return resolveArrayValue(item.key, index, item.key[0])!
}

function resolveOptions(item: ConfigItem, index?: number) {
  return resolveArrayValue(item.options, index)
}

function resolveType(item: ConfigItem, index?: number): string {
  return resolveArrayValue(item.type, index, 'input')!
}

function resolveEvents(item: ConfigItem, index?: number): Record<string, (...args: unknown[]) => void> {
  return resolveArrayValue(item.on, index, {})!
}

function resolveFieldPath(item: ConfigItem, index?: number): string {
  return props.basePath + resolveFieldKey(item, index)
}

function resolveItemKey(item: ConfigItem, index?: number): string {
  if (item.id)
    return item.id
  if (Array.isArray(item.key) && item.key.length > 1)
    return `${props.basePath}__group__${item.key.join('_')}`
  return resolveFieldPath(item, index)
}

function isEmptyValue(val: unknown): boolean {
  if (val === null || val === undefined || val === '')
    return true
  if (Array.isArray(val) && val.length === 0)
    return true
  return false
}

function resolveHidden(hidden: HiddenValue | undefined): boolean {
  if (hidden === undefined)
    return false
  if (typeof hidden === 'function')
    return hidden(formModel.value)
  return hidden
}

function resolveVisible(visible: VisibleValue | undefined): boolean | undefined {
  if (visible === undefined)
    return undefined
  if (typeof visible === 'function')
    return visible(formModel.value)
  return visible
}

function isHidden(item: ConfigItem, bind: FieldBind, index?: number): boolean {
  const currentBind = index !== undefined && Array.isArray(item.bind) ? resolveBind(item, index) : bind
  const visible = resolveVisible(currentBind.visible ?? item.visible)
  if (visible !== undefined)
    return !visible
  return resolveHidden(currentBind.hidden ?? item.hidden)
}

function shouldClearOnHidden(item: ConfigItem, index?: number): boolean {
  const bind = resolveBind(item, index)
  return !!(bind.hiddenClear ?? item.hiddenClear ?? props.hiddenClear)
}

function clearFieldValue(fieldKey: string, item: ConfigItem, index?: number) {
  const model = formModel.value
  const componentName = resolveComponentName(item, index)
  const bind = resolveBind(item, index)
  const dateSuffix = bind.dateValueSuffix ?? 'value'

  if (componentName === 'NDatePicker') {
    delete model[fieldKey]
    delete model[`${fieldKey}${dateSuffix}`]
    return
  }
  model[fieldKey] = undefined
}

function trackHiddenClear(items: ConfigItem[]) {
  for (const item of items) {
    if (Array.isArray(item.key)) {
      item.key.forEach((subKey, subIndex) => {
        trackFieldHiddenClear(item, subKey, subIndex)
      })
    }
    else {
      trackFieldHiddenClear(item, item.key)
    }
  }
}

function trackFieldHiddenClear(item: ConfigItem, fieldKey: string, index?: number) {
  const bind = resolveBind(item, index)
  const path = props.basePath + fieldKey
  const hidden = isHidden(item, bind, index)
  const wasHidden = hiddenStateMap.get(path) ?? false
  hiddenStateMap.set(path, hidden)
  if (hidden && !wasHidden && shouldClearOnHidden(item, index))
    clearFieldValue(fieldKey, item, index)
}

watch(
  () => ({ model: formModel.value, config: resolvedConfig.value, basePath: props.basePath }),
  ({ config }) => trackHiddenClear(config),
  { deep: true, immediate: true },
)

function resolveComponent(componentName: string): Component {
  const component = componentMap.value[componentName]
  if (component)
    return component

  if (import.meta.env.DEV && !warnedComponents.has(componentName)) {
    warnedComponents.add(componentName)
    console.warn(`[CommonForm] 未知组件 "${componentName}"，已回退为 NInput`)
  }
  return NInput
}

function warnDuplicatePath(path: string) {
  if (!import.meta.env.DEV || !path)
    return
  if (warnedPaths.has(path)) {
    console.warn(`[CommonForm] 重复的校验 path "${path}"，可能导致校验冲突`)
    return
  }
  warnedPaths.add(path)
}

function pickControlBind(bind: FieldBind): Record<string, unknown> {
  const controlBind: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(bind)) {
    if (!BIND_META_KEYS.has(key))
      controlBind[key] = value
  }
  return controlBind
}

function resolveControlState(bind: FieldBind) {
  return {
    disabled: bind.disabled ?? props.disabled,
    readonly: bind.readonly ?? props.readonly,
  }
}

function inferFieldType(item: ConfigItem, value: unknown, componentName: string): FormItemRule['type'] {
  const bind = resolveBind(item)
  if (bind.multiple)
    return 'array'
  switch (componentName) {
    case 'NCheckboxGroup':
    case 'NTransfer':
    case 'UploadFile':
      return 'array'
    case 'NRate':
    case 'NInputNumber':
    case 'NSlider':
      return 'number'
    default:
      return typeof value === 'number' ? 'number' : 'string'
  }
}

function setRule(item: ConfigItem, index?: number): FormItemRule | FormItemRule[] {
  const bind = resolveBind(item, index)

  if (isHidden(item, bind, index))
    return [{ validator: () => true }]
  if (bind.rules)
    return bind.rules
  if (bind.notValidate || item.notValidate)
    return [{ validator: () => true }]

  const label = bind.label ?? bind.title ?? item.label ?? item.title ?? '字段'
  const fieldKey = resolveFieldKey(item, index)
  const componentName = resolveComponentName(item, index)
  const value = formModel.value[fieldKey]

  const required = bind.required ?? (
    Array.isArray(item.required) && index !== undefined
      ? item.required[index]
      : item.required
  )

  const rule: FormItemRule = {
    required: !!required,
    trigger: required ? ['input', 'blur'] : [],
    type: bind.fileType ?? inferFieldType(item, value, componentName),
    message: bind.message ?? requiredMessage(label),
  }

  if (bind.patternType || bind.pattern) {
    const patternKey = bind.patternType ?? 'default'
    const pattern = bind.pattern ?? validateRegMap.value[patternKey as string]
    if (!pattern && import.meta.env.DEV)
      console.warn(`[CommonForm] 未找到校验规则 "${patternKey}"`)
    const isDefaultPattern = !bind.pattern && patternKey === 'default'
    rule.message = bind.message ?? (isDefaultPattern ? requiredMessage(label) : patternMessage(label))
    rule.validator = (_rule, val) => {
      if (isHidden(item, bind, index))
        return true
      if (!required && isEmptyValue(val))
        return true
      const text = val != null ? String(val) : ''
      if (!pattern?.test(text))
        return new Error(rule.message as string)
      return true
    }
  }

  if (bind.extendRule)
    return [{ ...rule, ...bind.extendRule }]
  if (bind.extendRules)
    return [rule, ...bind.extendRules]
  return [rule]
}

function initDefaultValues(items: ConfigItem[]) {
  const model = formModel.value
  for (const item of items) {
    if (Array.isArray(item.key)) {
      item.key.forEach((key, index) => {
        const bind = resolveBind(item, index)
        const defaultValue = bind.defaultValue ?? item.defaultValue
        if (defaultValue !== undefined && model[key] === undefined)
          model[key] = defaultValue
      })
    }
    else {
      const bind = resolveBind(item)
      const defaultValue = bind.defaultValue ?? item.defaultValue
      if (defaultValue !== undefined && model[item.key] === undefined)
        model[item.key] = defaultValue
    }
  }
}

watch(() => resolvedConfig.value, config => initDefaultValues(config), { immediate: true, deep: true })

function hasCustomRender(item: ConfigItem, bind: FieldBind) {
  return !!(bind.render ?? item.render ?? bind.slotName)
}

function fieldGridStyle(item: ConfigItem) {
  if (!item.span || item.span <= 1)
    return undefined
  return { gridColumn: `span ${Math.min(item.span, props.cols)}` }
}

function renderLabel(item: ConfigItem, bind: FieldBind) {
  const text = item.label ?? item.title ?? bind.label ?? bind.title
  if (!text)
    return undefined
  const { disabled } = resolveControlState(bind)
  return () => (
    <NEllipsis
      class={['w-full pr-2', props.disabledHideBorder && disabled ? 'text-[#757575]' : '']}
    >
      {text}
    </NEllipsis>
  )
}

function renderControlSlots(
  slotDef: ConfigItem['slot'],
  item: ConfigItem,
  fieldKey: string,
) {
  if (!slotDef || typeof slotDef !== 'object' || Array.isArray(slotDef))
    return undefined

  const curData = formModel.value[fieldKey]
  const slotRenderers: Record<string, () => VNode | string> = {}
  for (const [name, fn] of Object.entries(slotDef)) {
    if (typeof fn === 'function')
      slotRenderers[name] = () => fn(item, formModel.value, curData)
  }
  return Object.keys(slotRenderers).length ? slotRenderers : undefined
}

function renderGroupControl(
  item: ConfigItem,
  bind: FieldBind,
  groupType: 'Checkbox' | 'Radio' | 'RadioButton',
  fieldKey: string,
) {
  const GroupComponent = groupType === 'Checkbox' ? NCheckboxGroup : NRadioGroup
  const ItemComponent = groupType === 'RadioButton' ? NRadioButton : groupType === 'Checkbox' ? NCheckbox : NRadio
  const options = bind.options ?? []
  const controlBind = pickControlBind(bind)
  const model = formModel.value

  return (
    <GroupComponent
      class="w-full"
      {...controlBind}
      {...resolveControlState(bind)}
      v-model:value={model[fieldKey]}
    >
      <NGrid cols={item.cols ?? 2} xGap={1}>
        {options.map(option => (
          <NGridItem key={String(option.value)} span={bind.col ?? 1}>
            <ItemComponent value={option.value} disabled={option.disabled}>
              {option.label}
            </ItemComponent>
          </NGridItem>
        ))}
      </NGrid>
    </GroupComponent>
  )
}

function resolveGroupType(componentName: string, bind: FieldBind): 'Checkbox' | 'Radio' | 'RadioButton' | null {
  if (componentName === 'Checkbox')
    return 'Checkbox'
  if (componentName === 'RadioButton' || bind.button)
    return 'RadioButton'
  if (componentName === 'Radio')
    return 'Radio'
  return null
}

function renderFieldControl(item: ConfigItem, index?: number) {
  const bind = resolveBind(item, index)
  const fieldKey = resolveFieldKey(item, index)
  const componentName = resolveComponentName(item, index)
  const slotDef = resolveSlot(item, index)
  const events = resolveEvents(item, index)
  const options = resolveOptions(item, index)
  const type = resolveType(item, index)
  const model = formModel.value
  const controlState = resolveControlState(bind)

  const groupType = resolveGroupType(componentName, bind)
  if (groupType)
    return renderGroupControl(item, bind, groupType, fieldKey)

  const Component = resolveComponent(componentName)
  const controlSlots = renderControlSlots(slotDef, item, fieldKey)
  const dateSuffix = bind.dateValueSuffix ?? 'value'

  const commonProps = {
    class: 'w-full',
    type,
    options,
    ...(props.size ? { size: props.size } : {}),
    ...(COMPONENTS_WITH_CLEARABLE.has(componentName) ? { clearable: true } : {}),
    ...pickControlBind(bind),
    ...controlState,
    ...events,
  }

  if (componentName === 'NDatePicker') {
    return (
      <Component
        {...commonProps}
        v-model:value={model[`${fieldKey}${dateSuffix}`]}
        v-model:formatted-value={model[fieldKey]}
      >
        {controlSlots}
      </Component>
    )
  }

  return (
    <Component {...commonProps} v-model:value={model[fieldKey]}>
      {controlSlots}
    </Component>
  )
}

function safeRenderCustomContent(item: ConfigItem, bind: FieldBind) {
  const fieldKey = resolveFieldKey(item)
  const renderFn = bind.render ?? item.render
  try {
    if (renderFn)
      return renderFn(item, formModel.value, formModel.value[fieldKey])

    const slotName = bind.slotName
    if (slotName && slots[slotName])
      return slots[slotName]({ row: item })
  }
  catch (error) {
    if (import.meta.env.DEV)
      console.error('[CommonForm] render 渲染失败:', error)
    return <span class="text-red-500">渲染失败</span>
  }
  return null
}

function renderStandardFormItem(
  item: ConfigItem,
  options: {
    itemKey: string
    fieldPath?: string
    nested?: boolean
    label?: string
    showFeedback?: boolean
    bindItem?: Record<string, unknown>
    labelSlot?: ReturnType<typeof renderLabel>
    children: VNode | string | null
  },
) {
  const labelSlotProp = options.labelSlot ? { label: options.labelSlot } : undefined
  return (
    <NFormItem
      key={options.itemKey}
      class={['col-span-1', item.class]}
      style={fieldGridStyle(item)}
      label={options.label}
      path={options.fieldPath}
      rule={options.fieldPath ? setRule(item) : undefined}
      showFeedback={options.showFeedback ?? item.showFeedback ?? true}
      v-slots={labelSlotProp}
      {...options.bindItem}
    >
      {options.children}
    </NFormItem>
  )
}

function renderFormField(item: ConfigItem, nested = false) {
  const bind = resolveBind(item)
  const bindItem = resolveBindItem(item)

  if (isHidden(item, bind))
    return null

  const isMultiKey = Array.isArray(item.key) && item.key.length > 1
  const customRender = hasCustomRender(item, bind)
  const fieldPath = resolveFieldPath(item)
  const itemKey = resolveItemKey(item)
  const labelSlot = renderLabel(item, bind)

  if (isMultiKey && !nested && !customRender) {
    return renderStandardFormItem(item, {
      itemKey,
      label: item.label ?? item.title,
      showFeedback: false,
      bindItem,
      labelSlot,
      children: (
        <NGrid cols={item.cols ?? props.cols} xGap={12}>
          {item.key.map((subKey, subIndex) => {
            if (isHidden(item, bind, subIndex))
              return null
            return (
              <NGridItem key={subKey} span={resolveBind(item, subIndex).col ?? 1}>
                {renderFormField(
                  {
                    ...item,
                    required: undefined,
                    id: item.id ? `${item.id}_${subKey}` : undefined,
                    key: subKey,
                    label: resolveBindItem(item, subIndex).label as string | undefined ?? item.label,
                    component: resolveComponentName(item, subIndex),
                    bind: resolveBind(item, subIndex),
                    bindItem: resolveBindItem(item, subIndex),
                    slot: resolveSlot(item, subIndex),
                  },
                  true,
                )}
              </NGridItem>
            )
          })}
        </NGrid>
      ),
    })
  }

  if (customRender && !nested) {
    return renderStandardFormItem(item, {
      itemKey,
      label: item.label ?? item.title,
      bindItem,
      labelSlot,
      children: safeRenderCustomContent(item, bind),
    })
  }

  if (fieldPath)
    warnDuplicatePath(fieldPath)

  return renderStandardFormItem(item, {
    itemKey: nested ? resolveItemKey(item, 0) : itemKey,
    fieldPath,
    label: nested ? undefined : (item.label ?? item.title),
    bindItem,
    labelSlot,
    children: renderFieldControl(item),
  })
}

function RenderRoot() {
  if (import.meta.env.DEV)
    warnedPaths.clear()

  return (
    <div class={[
      'w-full bg-white common-form',
      props.compact ? 'p-2' : 'p-5',
      props.disabledHideBorder ? 'hide-border' : '',
    ]}
    >
      <NConfigProvider theme-overrides={themeOverrides.value}>
        {(props.title || props.description) && (
          <div class="mb-4">
            {props.title && <div class="text-base font-medium text-[#333]">{props.title}</div>}
            {props.description && <div class="mt-1 text-sm text-[#999]">{props.description}</div>}
          </div>
        )}
        <div class="form_box w-full" style={gridStyle.value}>
          {resolvedConfig.value.map(item => renderFormField(item))}
          {slots.default?.()}
        </div>
      </NConfigProvider>
    </div>
  )
}

function collectFieldPaths(items: ConfigItem[] = resolvedConfig.value, prefix = props.basePath): string[] {
  const paths: string[] = []
  for (const item of items) {
    const bind = resolveBind(item)
    if (isHidden(item, bind))
      continue

    if (Array.isArray(item.key) && item.key.length > 1 && !hasCustomRender(item, bind)) {
      item.key.forEach((subKey, subIndex) => {
        if (!isHidden(item, bind, subIndex))
          paths.push(`${prefix}${subKey}`)
      })
      continue
    }

    if (!hasCustomRender(item, bind))
      paths.push(`${prefix}${resolveFieldKey(item)}`)
  }
  return paths
}

defineExpose({
  collectFieldPaths,
  initDefaultValues: () => initDefaultValues(resolvedConfig.value),
  syncHiddenClear: () => trackHiddenClear(resolvedConfig.value),
})
</script>

<template>
  <RenderRoot />
</template>

<style lang="scss" scoped>
.common-form.hide-border {
  :deep(.n-form-item-blank) {
    .n-base-selection--disabled {
      .n-base-selection__border {
        border: none;
      }

      .n-base-loading.n-base-suffix {
        display: none !important;
      }
    }

    .n-date-picker--disabled {
      .n-base-selection__border {
        border: none;
      }

      .n-input__suffix {
        display: none !important;
      }
    }

    .n-tag--disabled {
      border: none;

      .n-base-selection__border {
        border: none;
      }

      button {
        display: none !important;
      }
    }

    .n-input--disabled {
      .n-input-word-count {
        display: none;
      }
    }
  }

  :deep(.user-select .label) {
    border: none !important;
  }
}

:deep(.n-input.n-input--disabled .n-input__input-el, .n-input.n-input--disabled .n-input__textarea-el) {
  cursor: default !important;
}

:deep(.n-input.n-input--disabled) {
  cursor: default !important;
}

:deep(.n-base-selection.n-base-selection--disabled) {
  cursor: default !important;
}

:deep(.n-base-selection.n-base-selection--disabled .n-base-selection-label) {
  cursor: default !important;
}

:deep(.n-input-number) {
  .n-input__suffix {
    display: none;
  }
}
</style>
