<template>
  <n-form
    v-if="runtimeFields.length"
    ref="formRef"
    :model="model"
    :label-placement="settings.labelPlacement"
    :label-width="settings.labelWidth"
    :size="settings.size"
    :show-require-mark="settings.showRequireMark"
  >
    <CommonForm
      v-model:form-model="model"
      :fields="runtimeFields"
      :cols="settings.formCols"
      :label-width="settings.labelWidth"
      :label-suffix="settings.labelSuffix"
      :size="settings.size"
      :show-require-mark="settings.showRequireMark"
      :show-feedback="settings.showFeedback"
      :disabled="disabled"
    />
  </n-form>
  <n-empty v-else description="暂无表单字段" />
</template>

<script setup lang="ts">
import type { FormInst } from 'naive-ui'
import {
  DEFAULT_BPM_FORM_SETTINGS,
  isFormBuilderConf,
  resolveFieldDictOptions,
  toBpmFormSettings,
  unpackBpmForm,
  type BpmFormSettings,
} from '@/components/common/FormBuilder/bpmForm'
import { getRuntimeField } from '@/components/common/FormBuilder/compile'
import {
  cloneFormModel,
  compileFormEvents,
  createFormEventApi,
  emitFormFieldChanges,
  type CompiledFormEvents,
  type FormEventApi,
} from '@/components/common/FormBuilder/formEvents'
import { FieldPermissionType } from '@/components/SimpleProcessDesigner/src/consts'
import { fetchDictOptions } from '@/hooks/useDict'

defineOptions({ name: 'BpmProcessForm' })

const props = withDefaults(defineProps<{
  formConf?: string | Record<string, any> | null
  formFields?: Array<string | Record<string, any>> | null
  formVariables?: Record<string, unknown> | null
  /** fieldKey → permission */
  permissions?: Record<string, string> | null
  disabled?: boolean
}>(), {
  formConf: null,
  formFields: () => [],
  formVariables: () => ({}),
  permissions: null,
  disabled: true,
})

const formRef = ref<FormInst | null>(null)
const model = ref<Record<string, unknown>>({})
const settings = ref<BpmFormSettings>({ ...DEFAULT_BPM_FORM_SETTINGS })
const baseFields = ref<any[]>([])
let loadToken = 0
let formEvents: CompiledFormEvents = {}
let formApi: FormEventApi | null = null
let modelSnapshot: Record<string, unknown> = {}
let changeReady = false

function rebuildFormEventApi() {
  formEvents = compileFormEvents(settings.value)
  formApi = createFormEventApi({
    getModel: () => model.value,
    setModel: (next) => {
      model.value = next
    },
    validate: async () => formRef.value?.validate(),
    reset: () => {
      model.value = { ...(props.formVariables || {}) }
    },
  })
}

const runtimeFields = computed(() => {
  const perms = props.permissions
  const hasPerms = !!(perms && Object.keys(perms).length)
  return baseFields.value
    .map((f) => {
      const key = String(f.key)
      const permission = hasPerms ? perms![key] : undefined
      if (permission === FieldPermissionType.NONE)
        return null
      const field = { ...f }
      if (props.disabled) {
        field.bind = { ...(field.bind || {}), disabled: true }
      }
      else if (hasPerms) {
        // 有权限表：未声明或 READ 只读，WRITE 可写
        if (permission === FieldPermissionType.WRITE)
          field.bind = { ...(field.bind || {}), disabled: false }
        else
          field.bind = { ...(field.bind || {}), disabled: true }
      }
      else {
        // 无权限表（如办理子表单）：跟随 disabled
        field.bind = { ...(field.bind || {}), disabled: false }
      }
      return field
    })
    .filter(Boolean)
})

/** 仅 conf / fields / variables 引用变化时重载，避免 deep 触发反复 onCreated */
watch(
  () => [props.formConf, props.formFields, props.formVariables] as const,
  async () => {
    const token = ++loadToken
    changeReady = false
    if (!isFormBuilderConf(props.formConf) && !(props.formFields || []).length) {
      baseFields.value = []
      settings.value = { ...DEFAULT_BPM_FORM_SETTINGS }
      model.value = { ...(props.formVariables || {}) }
      rebuildFormEventApi()
      modelSnapshot = cloneFormModel(model.value)
      return
    }
    const unpacked = unpackBpmForm(props.formConf, props.formFields)
    settings.value = toBpmFormSettings(unpacked)
    const runtime = unpacked.fields
      .map(f => getRuntimeField(f))
      .filter(f => f.form !== false)
    const withDict = await resolveFieldDictOptions(runtime, fetchDictOptions)
    if (token !== loadToken)
      return
    baseFields.value = withDict
    model.value = { ...(props.formVariables || {}) }
    rebuildFormEventApi()
    modelSnapshot = cloneFormModel(model.value)
    try {
      await formEvents.onCreated?.(formApi!)
    }
    catch (e) {
      console.warn('[BpmProcessForm] onCreated', e)
    }
    await nextTick()
    if (token !== loadToken)
      return
    try {
      await formEvents.onMounted?.(formApi!)
    }
    catch (e) {
      console.warn('[BpmProcessForm] onMounted', e)
    }
    modelSnapshot = cloneFormModel(model.value)
    changeReady = true
  },
  { immediate: true },
)

watch(model, (next) => {
  if (!changeReady || !formEvents.onChange)
    return
  emitFormFieldChanges(modelSnapshot, next, formEvents.onChange)
  modelSnapshot = cloneFormModel(next)
}, { deep: true })

/** 仅字段校验，不触发 onSubmit（审批弹窗预检等） */
async function validate() {
  await formRef.value?.validate()
  return { ...model.value }
}

/**
 * 校验通过后触发 onSubmit；错误向上抛出以中止业务流程。
 * formData 为活引用，可直接改字段或用 api.setValue。
 */
async function submit() {
  await formRef.value?.validate()
  if (formEvents.onSubmit && formApi)
    await formEvents.onSubmit(model.value, formApi)
  return { ...model.value }
}

function getValues() {
  return { ...model.value }
}

const writableKeys = computed(() => {
  if (props.disabled)
    return []
  const perms = props.permissions
  const hasPerms = !!(perms && Object.keys(perms).length)
  return baseFields.value
    .map(f => String(f.key))
    .filter((key) => {
      if (!hasPerms)
        return true
      return perms![key] === FieldPermissionType.WRITE
    })
})

function getWritableValues() {
  const values = getValues()
  const keys = writableKeys.value
  if (!keys.length)
    return {}
  const result: Record<string, unknown> = {}
  for (const key of keys)
    result[key] = values[key]
  return result
}

defineExpose({ validate, submit, getValues, getWritableValues, writableKeys, model })
</script>
