<template>
  <div class="panel-tab__content">
    <n-form label-width="80px">
      <n-form-item label="流程表单">
        <n-select
          v-model:value="formKey"
          clearable
          :options="formList.map(form => ({ label: form.name, value: form.id }))"
          @update:value="updateElementFormKey"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<script lang="ts" setup>
import * as FormApi from '@/api/bpm/form'

defineOptions({ name: 'ElementForm' })

const props = defineProps({
  id: String,
  type: String,
})
const prefix = inject('prefix')

const formKey = ref<number | string | undefined>(undefined)
const businessKey = ref('')
const fieldList = ref<any[]>([])
const bpmnELement = ref()
const elExtensionElements = ref()
const formData = ref()
const otherExtensions = ref()
const formList = ref<{ id: number; name: string }[]>([])

const bpmnInstances = () => (window as any)?.bpmnInstances

const resetFormList = () => {
  bpmnELement.value = bpmnInstances().bpmnElement
  formKey.value = bpmnELement.value.businessObject.formKey

  elExtensionElements.value =
    bpmnELement.value.businessObject.get('extensionElements')
    || bpmnInstances().moddle.create('bpmn:ExtensionElements', { values: [] })

  formData.value =
    elExtensionElements.value.values.filter((ex: any) => ex.$type === `${prefix}:FormData`)?.[0]
    || bpmnInstances().moddle.create(`${prefix}:FormData`, { fields: [] })

  businessKey.value = formData.value.businessKey

  otherExtensions.value = elExtensionElements.value.values.filter(
    (ex: any) => ex.$type !== `${prefix}:FormData`,
  )

  fieldList.value = JSON.parse(JSON.stringify(formData.value.fields || []))
  updateElementExtensions()
}

const updateElementFormKey = () => {
  bpmnInstances().modeling.updateProperties(toRaw(bpmnELement.value), {
    formKey: formKey.value,
  })
}

const updateElementExtensions = () => {
  const newElExtensionElements = bpmnInstances().moddle.create(`bpmn:ExtensionElements`, {
    values: otherExtensions.value.concat(formData.value),
  })
  bpmnInstances().modeling.updateProperties(toRaw(bpmnELement.value), {
    extensionElements: newElExtensionElements,
  })
}

onMounted(async () => {
  formList.value = await FormApi.getFormSimpleList()
  if (formKey.value != null && formKey.value !== '')
    formKey.value = Number(formKey.value)
})

watch(
  () => props.id,
  (val) => {
    if (val?.length) {
      nextTick(() => {
        resetFormList()
      })
    }
  },
  { immediate: true },
)
</script>
