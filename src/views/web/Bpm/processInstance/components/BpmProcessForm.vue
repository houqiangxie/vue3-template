<template>
  <CommonForm
    v-if="runtimeFields.length"
    ref="formRef"
    v-model:form-model="model"
    :fields="runtimeFields"
    :cols="formCols"
    :label-width="100"
    :disabled="disabled"
  />
  <n-empty v-else description="暂无表单字段" />
</template>

<script setup lang="ts">
import {
  isFormBuilderConf,
  unpackBpmForm,
} from '@/components/FormCreate/src/bpmFormBuilder'
import { getRuntimeField } from '@/components/common/FormBuilder/compile'
import { FieldPermissionType } from '@/components/SimpleProcessDesignerV2/src/consts'

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

const formRef = ref<{ validate?: () => Promise<void> } | null>(null)
const model = ref<Record<string, unknown>>({})
const formCols = ref(2)
const baseFields = ref<any[]>([])

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

watch(
  () => [props.formConf, props.formFields, props.formVariables] as const,
  () => {
    if (!isFormBuilderConf(props.formConf) && !(props.formFields || []).length) {
      baseFields.value = []
      model.value = { ...(props.formVariables || {}) }
      return
    }
    const unpacked = unpackBpmForm(props.formConf, props.formFields)
    formCols.value = unpacked.formCols
    baseFields.value = unpacked.fields
      .map(f => getRuntimeField(f))
      .filter(f => f.form !== false)
    model.value = { ...(props.formVariables || {}) }
  },
  { immediate: true, deep: true },
)

async function validate() {
  await formRef.value?.validate?.()
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

defineExpose({ validate, getValues, getWritableValues, writableKeys, model })
</script>
