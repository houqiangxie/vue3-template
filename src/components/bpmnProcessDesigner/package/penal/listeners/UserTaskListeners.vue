<template>
  <div class="panel-tab__content">
    <CommonTable
      :data="elementListenersList"
      :fields="listenerTableFields"
      :show-pagination="false"
      :csv-export="false"
      :flex-height="false"
      show-index
      :table-props="{ size: 'small', bordered: true }"
    />
    <div class="element-drawer__button">
      <XButton
        size="small"
        type="primary"
        preIcon="ep:plus"
        title="添加监听器"
        @click="openListenerForm(null)"
      />
      <XButton
        type="success"
        preIcon="ep:select"
        title="选择监听器"
        size="small"
        @click="openProcessListenerDialog"
      />
    </div>

    <CommonModal
      v-model:show="listenerFormVisible"
      v-model:form-model="listenerForm"
      :config="listenerModalConfig"
      :width="width"
      @confirm="saveListenerConfig"
    >
      <template #fields>
        <p class="listener-filed__title">
          <span><Icon icon="ep:menu" />注入字段：</span>
          <XButton
            size="small"
            type="primary"
            title="添加字段"
            @click="openListenerFieldForm(null)"
          />
        </p>
        <CommonTable
          :data="fieldsListOfListener"
          :fields="fieldTableFields"
          :show-pagination="false"
          :csv-export="false"
          :flex-height="false"
          show-index
          :table-props="{ size: 'small', bordered: true, maxHeight: 240 }"
        />
      </template>
    </CommonModal>

    <CommonModal
      v-model:show="fieldFormVisible"
      v-model:form-model="fieldFormData"
      :config="fieldModalConfig"
      @confirm="saveListenerFiled"
    />
  </div>

  <ProcessListenerDialog ref="processListenerDialogRef" @select="selectProcessListener" />
</template>

<script lang="ts" setup>
import { createListenerObject, updateElementExtensions } from '../../utils'
import {
  initListenerForm,
  initListenerType,
  eventType,
  listenerType,
  fieldType,
  initListenerForm2,
} from './utilSelf'
import ProcessListenerDialog from '@/components/bpmnProcessDesigner/package/penal/listeners/ProcessListenerDialog.vue'
import { useFormModal } from '@/hooks/useFormModal'
import { defineFields, defineModal, extractFormDefaults } from '@/utils/schema'

defineOptions({ name: 'UserTaskListeners' })

const props = defineProps({
  id: String,
  type: String,
})
const prefix = inject('prefix')
const width = inject('width', 480)
const elementListenersList = ref<any[]>([])
const listenerEventTypeObject = ref(eventType)
const listenerTypeObject = ref(listenerType)
const fieldTypeObject = ref(fieldType)
const fieldsListOfListener = ref<any[]>([])
const editingListenerIndex = ref(-1)
const editingListenerFieldIndex = ref(-1)
const bpmnElementListeners = ref<any[]>([])
const otherExtensionList = ref<any[]>([])
const bpmnInstances = () => (window as any)?.bpmnInstances

const listenerFormFields = computed(() => defineFields([
  {
    key: 'event',
    label: '事件类型',
    component: 'NSelect',
    options: Object.keys(listenerEventTypeObject.value).map(i => ({
      label: listenerEventTypeObject.value[i],
      value: i,
    })),
    form: { required: true },
    search: false,
    table: false,
  },
  {
    key: 'id',
    label: '监听器ID',
    component: 'NInput',
    form: { required: true },
    search: false,
    table: false,
  },
  {
    key: 'listenerType',
    label: '监听器类型',
    component: 'NSelect',
    options: Object.keys(listenerTypeObject.value).map(i => ({
      label: listenerTypeObject.value[i],
      value: i,
    })),
    form: { required: true },
    search: false,
    table: false,
  },
  {
    key: 'class',
    label: 'Java类',
    component: 'NInput',
    form: {
      required: true,
      visible: (m: Record<string, unknown>) => m.listenerType === 'classListener',
    },
    search: false,
    table: false,
  },
  {
    key: 'expression',
    label: '表达式',
    component: 'NInput',
    form: {
      required: true,
      visible: (m: Record<string, unknown>) => m.listenerType === 'expressionListener',
    },
    search: false,
    table: false,
  },
  {
    key: 'delegateExpression',
    label: '代理表达式',
    component: 'NInput',
    form: {
      required: true,
      visible: (m: Record<string, unknown>) => m.listenerType === 'delegateExpressionListener',
    },
    search: false,
    table: false,
  },
  {
    key: 'scriptFormat',
    label: '脚本格式',
    component: 'NInput',
    form: {
      required: true,
      message: '请填写脚本格式',
      visible: (m: Record<string, unknown>) => m.listenerType === 'scriptListener',
    },
    search: false,
    table: false,
  },
  {
    key: 'scriptType',
    label: '脚本类型',
    component: 'NSelect',
    options: [
      { label: '内联脚本', value: 'inlineScript' },
      { label: '外部脚本', value: 'externalScript' },
    ],
    form: {
      required: true,
      message: '请选择脚本类型',
      visible: (m: Record<string, unknown>) => m.listenerType === 'scriptListener',
    },
    search: false,
    table: false,
  },
  {
    key: 'value',
    label: '脚本内容',
    component: 'NInput',
    form: {
      required: true,
      message: '请填写脚本内容',
      visible: (m: Record<string, unknown>) =>
        m.listenerType === 'scriptListener' && m.scriptType === 'inlineScript',
    },
    search: false,
    table: false,
  },
  {
    key: 'resource',
    label: '资源地址',
    component: 'NInput',
    form: {
      required: true,
      message: '请填写资源地址',
      visible: (m: Record<string, unknown>) =>
        m.listenerType === 'scriptListener' && m.scriptType === 'externalScript',
    },
    search: false,
    table: false,
  },
  {
    key: 'eventDefinitionType',
    label: '定时器类型',
    component: 'NSelect',
    options: [
      { label: '日期', value: 'date' },
      { label: '持续时长', value: 'duration' },
      { label: '循环', value: 'cycle' },
      { label: '无', value: 'null' },
    ],
    form: {
      visible: (m: Record<string, unknown>) => m.event === 'timeout',
    },
    search: false,
    table: false,
  },
  {
    key: 'eventTimeDefinitions',
    label: '定时器',
    component: 'NInput',
    form: {
      required: true,
      message: '请填写定时器配置',
      visible: (m: Record<string, unknown>) =>
        m.event === 'timeout'
        && !!m.eventDefinitionType
        && m.eventDefinitionType !== 'null',
    },
    search: false,
    table: false,
  },
]))

const {
  formVisible: listenerFormVisible,
  formData: listenerForm,
  openCreate: openListenerCreate,
  openEdit: openListenerEdit,
} = useFormModal(() => ({
  event: undefined,
  id: '',
  listenerType: undefined,
  class: '',
  expression: '',
  delegateExpression: '',
  scriptFormat: '',
  scriptType: undefined,
  value: '',
  resource: '',
  eventDefinitionType: undefined,
  eventTimeDefinitions: '',
  fields: [],
}))

const listenerModalConfig = computed(() => defineModal({
  title: '任务监听器',
  width: Number(width) || 480,
  confirmText: '保存',
  sections: [
    {
      type: 'form',
      key: 'main',
      fields: listenerFormFields.value,
      formProps: { labelWidth: 96 },
    },
    {
      type: 'slot',
      key: 'fields',
      slotName: 'fields',
    },
  ],
}))

const fieldFormFields = computed(() => defineFields([
  {
    key: 'name',
    label: '字段名称',
    component: 'NInput',
    form: { required: true },
    search: false,
    table: false,
  },
  {
    key: 'fieldType',
    label: '字段类型',
    component: 'NSelect',
    options: Object.keys(fieldTypeObject.value).map(i => ({
      label: fieldTypeObject.value[i],
      value: i,
    })),
    form: { required: true },
    search: false,
    table: false,
  },
  {
    key: 'string',
    label: '字段值',
    component: 'NInput',
    form: {
      required: true,
      visible: (m: Record<string, unknown>) => m.fieldType === 'string',
    },
    search: false,
    table: false,
  },
  {
    key: 'expression',
    label: '表达式',
    component: 'NInput',
    form: {
      required: true,
      visible: (m: Record<string, unknown>) => m.fieldType === 'expression',
    },
    search: false,
    table: false,
  },
]))

const {
  formVisible: fieldFormVisible,
  formData: fieldFormData,
  openCreate: openFieldCreate,
  openEdit: openFieldEdit,
} = useFormModal(() => extractFormDefaults(fieldFormFields.value))

const fieldModalConfig = computed(() => defineModal({
  title: '字段配置',
  width: 600,
  sections: [{
    type: 'form',
    key: 'main',
    fields: fieldFormFields.value,
    formProps: { labelWidth: 96 },
  }],
}))

const listenerFields = defineFields([
  {
    key: 'event',
    label: '事件类型',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      minWidth: 80,
      ellipsis: { tooltip: true },
      render: (row: any) => listenerEventTypeObject.value[row.event],
    },
  },
  {
    key: 'id',
    label: '事件id',
    component: 'NInput',
    form: false,
    search: false,
    table: { minWidth: 80, ellipsis: { tooltip: true } },
  },
  {
    key: 'listenerType',
    label: '监听器类型',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      minWidth: 80,
      ellipsis: { tooltip: true },
      render: (row: any) => listenerTypeObject.value[row.listenerType],
    },
  },
])

const listenerTableFields = computed(() => [
  ...listenerFields,
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
            openListenerForm(row, elementListenersList.value.indexOf(row))
          },
        },
        {
          key: 'remove',
          label: '移除',
          type: 'error' as const,
          confirm: '确认移除该监听器吗？',
          onClick: () => {
            removeListener(elementListenersList.value.indexOf(row))
          },
        },
      ],
    },
  },
])

const fieldFields = defineFields([
  {
    key: 'name',
    label: '字段名称',
    component: 'NInput',
    form: false,
    search: false,
    table: { minWidth: 100, ellipsis: { tooltip: true } },
  },
  {
    key: 'fieldType',
    label: '字段类型',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      minWidth: 80,
      ellipsis: { tooltip: true },
      render: (row: any) => fieldTypeObject.value[row.fieldType],
    },
  },
  {
    key: 'valueOrExpression',
    label: '字段值/表达式',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      minWidth: 100,
      ellipsis: { tooltip: true },
      render: (row: any) => row.string || row.expression,
    },
  },
])

const fieldTableFields = computed(() => [
  ...fieldFields,
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
            openListenerFieldForm(row, fieldsListOfListener.value.indexOf(row))
          },
        },
        {
          key: 'remove',
          label: '移除',
          type: 'error' as const,
          confirm: '确认移除该字段吗？',
          onClick: () => {
            removeListenerField(fieldsListOfListener.value.indexOf(row))
          },
        },
      ],
    },
  },
])

const resetListenersList = () => {
  const instances = bpmnInstances()
  if (!instances || !instances.bpmnElement)
    return

  const bpmnElement = instances.bpmnElement
  const businessObject = bpmnElement.businessObject

  otherExtensionList.value =
    businessObject?.extensionElements?.values?.filter(
      (ex: any) => ex.$type !== `${prefix}:TaskListener`,
    ) ?? []
  bpmnElementListeners.value =
    businessObject?.extensionElements?.values?.filter(
      (ex: any) => ex.$type === `${prefix}:TaskListener`,
    ) ?? []
  elementListenersList.value = bpmnElementListeners.value.map((listener: any) =>
    initListenerType(listener),
  )
}

const openListenerForm = (listener: any, index?: number) => {
  if (listener) {
    openListenerEdit(initListenerForm(listener))
    editingListenerIndex.value = index ?? -1
  }
  else {
    openListenerCreate({ fields: [] })
    editingListenerIndex.value = -1
  }
  if (listener && listener.fields) {
    fieldsListOfListener.value = listener.fields.map((field: any) => ({
      ...field,
      fieldType: field.string ? 'string' : 'expression',
    }))
  }
  else {
    fieldsListOfListener.value = []
    listenerForm.value.fields = []
  }
}

const removeListener = (index: number) => {
  if (index < 0)
    return
  const instances = bpmnInstances()
  if (!instances || !instances.bpmnElement)
    return

  bpmnElementListeners.value.splice(index, 1)
  elementListenersList.value.splice(index, 1)
  updateElementExtensions(
    instances.bpmnElement,
    otherExtensionList.value.concat(bpmnElementListeners.value),
  )
}

const saveListenerConfig = () => {
  const instances = bpmnInstances()
  if (!instances || !instances.bpmnElement)
    return

  const bpmnElement = instances.bpmnElement
  const listenerObject = createListenerObject(listenerForm.value, true, prefix)

  if (editingListenerIndex.value === -1) {
    bpmnElementListeners.value.push(listenerObject)
    elementListenersList.value.push(listenerForm.value)
  }
  else {
    bpmnElementListeners.value.splice(editingListenerIndex.value, 1, listenerObject)
    elementListenersList.value.splice(editingListenerIndex.value, 1, listenerForm.value)
  }
  otherExtensionList.value =
    bpmnElement.businessObject?.extensionElements?.values?.filter(
      (ex: any) => ex.$type !== `${prefix}:TaskListener`,
    ) ?? []
  updateElementExtensions(
    bpmnElement,
    otherExtensionList.value.concat(bpmnElementListeners.value),
  )
  listenerFormVisible.value = false
  listenerForm.value = {}
}

const openListenerFieldForm = (field: any, index?: number) => {
  editingListenerFieldIndex.value = field ? (index ?? -1) : -1
  if (field)
    openFieldEdit(JSON.parse(JSON.stringify(field)))
  else
    openFieldCreate()
}

const saveListenerFiled = () => {
  if (editingListenerFieldIndex.value === -1) {
    fieldsListOfListener.value.push({ ...fieldFormData.value })
    ;(listenerForm.value.fields as any[]).push({ ...fieldFormData.value })
  }
  else {
    fieldsListOfListener.value.splice(editingListenerFieldIndex.value, 1, { ...fieldFormData.value })
    ;(listenerForm.value.fields as any[]).splice(editingListenerFieldIndex.value, 1, { ...fieldFormData.value })
  }
  fieldFormVisible.value = false
  nextTick(() => {
    fieldFormData.value = {}
  })
}

const removeListenerField = (index: number) => {
  if (index < 0)
    return
  fieldsListOfListener.value.splice(index, 1)
  ;(listenerForm.value.fields as any[]).splice(index, 1)
}

const processListenerDialogRef = ref()
const openProcessListenerDialog = async () => {
  processListenerDialogRef.value.open('task')
}
const selectProcessListener = (listener: any) => {
  const instances = bpmnInstances()
  if (!instances || !instances.bpmnElement)
    return

  const bpmnElement = instances.bpmnElement
  const form = initListenerForm2(listener)
  const listenerObject = createListenerObject(form, true, prefix)
  bpmnElementListeners.value.push(listenerObject)
  elementListenersList.value.push(form)

  otherExtensionList.value =
    bpmnElement.businessObject?.extensionElements?.values?.filter(
      (ex: any) => ex.$type !== `${prefix}:TaskListener`,
    ) ?? []
  updateElementExtensions(
    bpmnElement,
    otherExtensionList.value.concat(bpmnElementListeners.value),
  )
}

watch(
  () => props.id,
  (val) => {
    val
    && val.length
    && nextTick(() => {
      resetListenersList()
    })
  },
  { immediate: true },
)
</script>
