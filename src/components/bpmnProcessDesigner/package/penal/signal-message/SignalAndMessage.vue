<template>
  <div class="panel-tab__content">
    <div class="panel-tab__content--title">
      <span><Icon icon="ep:menu" class="bpmn-section-icon" />消息列表</span>
      <XButton type="primary" title="创建新消息" preIcon="ep:plus" @click="openModel('message')" />
    </div>
    <CommonTable
      :data="messageList"
      :fields="messageTableFields"
      :show-pagination="false"
      :csv-export="false"
      :flex-height="false"
      show-index
      :table-props="{ size: 'small', bordered: true }"
    />
    <div
      class="panel-tab__content--title"
      style="padding-top: 8px; margin-top: 8px; border-top: 1px solid #eee"
    >
      <span><Icon icon="ep:menu" class="bpmn-section-icon" />信号列表</span>
      <XButton type="primary" title="创建新信号" preIcon="ep:plus" @click="openModel('signal')" />
    </div>
    <CommonTable
      :data="signalList"
      :fields="signalTableFields"
      :show-pagination="false"
      :csv-export="false"
      :flex-height="false"
      show-index
      :table-props="{ size: 'small', bordered: true }"
    />

    <CommonModal
      v-model:show="formVisible"
      v-model:form-model="formData"
      :config="formModalConfig"
      @confirm="addNewObject"
    />
  </div>
</template>
<script lang="ts" setup>
import { useFormModal } from '@/hooks/useFormModal'
import { useMessage } from '@/hooks/web/useMessage'
import { defineFields, defineModal, extractFormDefaults } from '@/utils/schema'

defineOptions({ name: 'SignalAndMassage' })

const message = useMessage()
const signalList = ref<any[]>([])
const messageList = ref<any[]>([])
const modelType = ref<'message' | 'signal'>('message')
const rootElements = ref<any[]>([])
const messageIdMap = ref<Record<string, boolean>>({})
const signalIdMap = ref<Record<string, boolean>>({})
const editingIndex = ref(-1)
const bpmnInstances = () => (window as any)?.bpmnInstances

const objectFields = defineFields([
  {
    key: 'id',
    label: 'ID',
    component: 'NInput',
    form: { required: true },
    search: false,
    table: { minWidth: 120, ellipsis: { tooltip: true } },
  },
  {
    key: 'name',
    label: '名称',
    component: 'NInput',
    form: {},
    search: false,
    table: { minWidth: 120, ellipsis: { tooltip: true } },
  },
])

const {
  formVisible,
  formData,
  openCreate,
  openEdit,
} = useFormModal(() => extractFormDefaults(objectFields))

function buildTableFields(type: 'message' | 'signal') {
  const idLabel = type === 'message' ? '消息ID' : '信号ID'
  const nameLabel = type === 'message' ? '消息名称' : '信号名称'
  const list = type === 'message' ? messageList : signalList
  return computed(() => [
    {
      ...objectFields[0],
      label: idLabel,
    },
    {
      ...objectFields[1],
      label: nameLabel,
    },
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
              openEditModel(type, row, list.value.indexOf(row))
            },
          },
          {
            key: 'remove',
            label: '移除',
            type: 'error' as const,
            confirm: `确认移除该${type === 'message' ? '消息' : '信号'}吗？`,
            onClick: () => {
              removeObject(type, row)
            },
          },
        ],
      },
    },
  ])
}

const messageTableFields = buildTableFields('message')
const signalTableFields = buildTableFields('signal')

const formModalConfig = computed(() => {
  const isEdit = editingIndex.value !== -1
  const isMessage = modelType.value === 'message'
  return defineModal({
    title: isEdit
      ? (isMessage ? '编辑消息' : '编辑信号')
      : (isMessage ? '创建消息' : '创建信号'),
    width: 400,
    sections: [{
      type: 'form',
      key: 'main',
      fields: defineFields([
        {
          key: 'id',
          label: isMessage ? '消息ID' : '信号ID',
          component: 'NInput',
          form: { required: true },
          search: false,
          table: false,
        },
        {
          key: 'name',
          label: isMessage ? '消息名称' : '信号名称',
          component: 'NInput',
          form: {},
          search: false,
          table: false,
        },
      ]),
      formProps: { labelWidth: 90 },
    }],
  })
})

const generateStandardId = (type: string): string => {
  const prefix = type === 'message' ? 'Message_' : 'Signal_'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}${timestamp}_${random}`
}

const initDataList = () => {
  rootElements.value = bpmnInstances().modeler.getDefinitions().rootElements
  messageIdMap.value = {}
  signalIdMap.value = {}
  messageList.value = []
  signalList.value = []
  rootElements.value.forEach((el) => {
    if (el.$type === 'bpmn:Message') {
      messageIdMap.value[el.id] = true
      messageList.value.push({ ...el })
    }
    if (el.$type === 'bpmn:Signal') {
      signalIdMap.value[el.id] = true
      signalList.value.push({ ...el })
    }
  })
}

const openModel = (type: 'message' | 'signal') => {
  modelType.value = type
  editingIndex.value = -1
  openCreate({
    id: generateStandardId(type),
    name: '',
  })
}

const openEditModel = (type: 'message' | 'signal', row: any, index: number) => {
  modelType.value = type
  editingIndex.value = index
  openEdit({ ...row })
}

const addNewObject = () => {
  if (modelType.value === 'message') {
    if (editingIndex.value !== -1) {
      const targetMessage = messageList.value[editingIndex.value]
      const rootMessage = rootElements.value.find(
        el => el.$type === 'bpmn:Message' && el.id === targetMessage.id,
      )
      if (rootMessage) {
        rootMessage.id = formData.value.id
        rootMessage.name = formData.value.name
      }
    }
    else {
      if (messageIdMap.value[formData.value.id as string]) {
        message.error('该消息已存在，请修改id后重新保存')
        return
      }
      const messageRef = bpmnInstances().moddle.create('bpmn:Message', formData.value)
      rootElements.value.push(messageRef)
    }
  }
  else {
    if (editingIndex.value !== -1) {
      const targetSignal = signalList.value[editingIndex.value]
      const rootSignal = rootElements.value.find(
        el => el.$type === 'bpmn:Signal' && el.id === targetSignal.id,
      )
      if (rootSignal) {
        rootSignal.id = formData.value.id
        rootSignal.name = formData.value.name
      }
    }
    else {
      if (signalIdMap.value[formData.value.id as string]) {
        message.error('该信号已存在，请修改id后重新保存')
        return
      }
      const signalRef = bpmnInstances().moddle.create('bpmn:Signal', formData.value)
      rootElements.value.push(signalRef)
    }
  }
  formVisible.value = false
  saveChanges()
  initDataList()
}

const removeObject = (type: 'message' | 'signal', row: any) => {
  const targetType = type === 'message' ? 'bpmn:Message' : 'bpmn:Signal'
  const elementIndex = rootElements.value.findIndex(
    el => el.$type === targetType && el.id === row.id,
  )
  if (elementIndex !== -1)
    rootElements.value.splice(elementIndex, 1)
  saveChanges()
  initDataList()
  message.success('移除成功')
}

const saveChanges = () => {
  const modeler = bpmnInstances().modeler
  if (!modeler)
    return

  try {
    const canvas = modeler.get('canvas')
    const rootElement = canvas.getRootElement()
    const eventBus = modeler.get('eventBus')
    if (eventBus) {
      eventBus.fire('root.added', { element: rootElement })
      eventBus.fire('elements.changed', { elements: [rootElement] })
    }
    const commandStack = modeler.get('commandStack')
    if (commandStack && commandStack._stack) {
      commandStack.execute('element.updateProperties', {
        element: rootElement,
        properties: {},
      })
    }
  }
  catch (error) {
    console.warn('保存更改时出错:', error)
  }
}

onMounted(() => {
  initDataList()
})
</script>

<style scoped>
.bpmn-section-icon {
  margin-right: 8px;
  color: var(--bpmn-text-2, var(--n-text-color-2, #555));
}
</style>
