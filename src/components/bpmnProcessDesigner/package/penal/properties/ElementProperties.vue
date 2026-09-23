<template>
  <div class="panel-tab__content">
    <CommonTable
      :data="elementPropertyList"
      :fields="tableFields"
      :show-pagination="false"
      :flex-height="false"
      show-index
      :csv-export="false"
      :table-props="{ size: 'small', bordered: true }"
    />
    <div class="element-drawer__button">
      <XButton
        type="primary"
        preIcon="ep:plus"
        title="添加属性"
        @click="handleAdd"
      />
    </div>

    <CommonModal
      v-model:show="formVisible"
      v-model:form-model="formData"
      :config="formModalConfig"
      @confirm="saveAttribute"
    />
  </div>
</template>

<script lang="ts" setup>
import { useFormModal } from '@/hooks/useFormModal'
import { defineFields, defineModal, extractFormDefaults } from '@/utils/schema'

defineOptions({ name: 'ElementProperties' })

const props = defineProps({
  id: String,
  type: String,
})
const prefix = inject('prefix')

const elementPropertyList = ref<any[]>([])
const otherExtensionList = ref<any[]>([])
const bpmnElementProperties = ref<any[]>([])
const bpmnElementPropertyList = ref<any[]>([])
const editingPropertyIndex = ref(-1)
const bpmnInstances = () => (window as any)?.bpmnInstances

const propertyFields = defineFields([
  {
    key: 'name',
    label: '属性名',
    component: 'NInput',
    form: { required: true },
    search: false,
    table: { minWidth: 100, ellipsis: { tooltip: true } },
  },
  {
    key: 'value',
    label: '属性值',
    component: 'NInput',
    form: {},
    search: false,
    table: { minWidth: 100, ellipsis: { tooltip: true } },
  },
])

const {
  formVisible,
  formData,
  openCreate,
  openEdit,
} = useFormModal(() => extractFormDefaults(propertyFields))

const tableFields = computed(() => [
  ...propertyFields,
  {
    key: 'actions',
    label: '操作',
    form: false,
    search: false,
    table: {
      width: 110,
      actions: (row: any) => [
        {
          key: 'edit',
          label: '编辑',
          onClick: () => {
            editingPropertyIndex.value = elementPropertyList.value.indexOf(row)
            openEdit(row)
          },
        },
        {
          key: 'remove',
          label: '移除',
          type: 'error' as const,
          confirm: '确认移除该属性吗？',
          onClick: () => {
            removeAttributes(elementPropertyList.value.indexOf(row))
          },
        },
      ],
    },
  },
])

const formModalConfig = computed(() => defineModal({
  title: '属性配置',
  width: 600,
  sections: [{
    type: 'form',
    key: 'main',
    fields: propertyFields,
    formProps: { labelWidth: 80 },
  }],
}))

function handleAdd() {
  editingPropertyIndex.value = -1
  openCreate()
}

function resetAttributesList() {
  const instances = bpmnInstances()
  if (!instances || !instances.bpmnElement)
    return

  const businessObject = instances.bpmnElement.businessObject
  otherExtensionList.value = []
  bpmnElementProperties.value =
    businessObject?.extensionElements?.values?.filter((ex: any) => {
      if (ex.$type !== `${prefix}:Properties`)
        otherExtensionList.value.push(ex)
      return ex.$type === `${prefix}:Properties`
    }) ?? []

  bpmnElementPropertyList.value = bpmnElementProperties.value.reduce(
    (pre: any[], current: any) => pre.concat(current.values),
    [],
  )
  elementPropertyList.value = JSON.parse(JSON.stringify(bpmnElementPropertyList.value ?? []))
}

function removeAttributes(index: number) {
  if (index < 0)
    return
  elementPropertyList.value.splice(index, 1)
  bpmnElementPropertyList.value.splice(index, 1)
  const propertiesObject = bpmnInstances().moddle.create(`${prefix}:Properties`, {
    values: bpmnElementPropertyList.value,
  })
  updateElementExtensions(propertiesObject)
  resetAttributesList()
}

function saveAttribute() {
  const { name, value } = formData.value
  const instances = bpmnInstances()
  if (!instances || !instances.bpmnElement)
    return

  const bpmnElement = instances.bpmnElement
  if (editingPropertyIndex.value !== -1) {
    instances.modeling.updateModdleProperties(
      bpmnElement,
      bpmnElementPropertyList.value[editingPropertyIndex.value],
      { name, value },
    )
  }
  else {
    const newPropertyObject = instances.moddle.create(`${prefix}:Property`, { name, value })
    const propertiesObject = instances.moddle.create(`${prefix}:Properties`, {
      values: bpmnElementPropertyList.value.concat([newPropertyObject]),
    })
    updateElementExtensions(propertiesObject)
  }
  formVisible.value = false
  resetAttributesList()
}

function updateElementExtensions(properties: unknown) {
  const instances = bpmnInstances()
  if (!instances || !instances.bpmnElement)
    return

  const extensions = instances.moddle.create('bpmn:ExtensionElements', {
    values: otherExtensionList.value.concat([properties]),
  })
  instances.modeling.updateProperties(instances.bpmnElement, {
    extensionElements: extensions,
  })
}

watch(
  () => props.id,
  (val) => {
    if (val?.length)
      resetAttributesList()
  },
  { immediate: true },
)
</script>
