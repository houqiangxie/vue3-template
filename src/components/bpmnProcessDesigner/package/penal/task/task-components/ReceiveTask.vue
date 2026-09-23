<template>
  <div style="margin-top: 16px">
    <n-form-item label="消息实例">
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: nowrap;
        "
      >
        <n-select
          v-model:value="bindMessageId"
          :options="messageOptions"
          @update:value="updateTaskMessage"
        />
        <XButton
          type="primary"
          preIcon="ep:plus"
          style="margin-left: 8px"
          @click="openMessageModel"
        />
      </div>
    </n-form-item>

    <CommonModal
      v-model:show="formVisible"
      v-model:form-model="formData"
      :config="formModalConfig"
      @confirm="createNewMessage"
    />
  </div>
</template>

<script lang="ts" setup>
import { useFormModal } from '@/hooks/useFormModal'
import { useMessage } from '@/hooks/web/useMessage'
import { defineFields, defineModal, extractFormDefaults } from '@/utils/schema'

defineOptions({ name: 'ReceiveTask' })

const props = defineProps({
  id: String,
  type: String,
})

const message = useMessage()

const bindMessageId = ref('')
const messageMap = ref<Record<string, string>>({})
const bpmnElement = ref<any>()
const bpmnMessageRefsMap = ref<Record<string, any>>({})
const bpmnRootElements = ref<any[]>([])

const messageFields = defineFields([
  {
    key: 'id',
    label: '消息ID',
    component: 'NInput',
    form: { required: true },
    search: false,
    table: false,
  },
  {
    key: 'name',
    label: '消息名称',
    component: 'NInput',
    form: {},
    search: false,
    table: false,
  },
])

const {
  formVisible,
  formData,
  openCreate,
} = useFormModal(() => extractFormDefaults(messageFields))

const formModalConfig = computed(() => defineModal({
  title: '创建新消息',
  width: 400,
  sections: [{
    type: 'form',
    key: 'main',
    fields: messageFields,
    formProps: { labelWidth: 90 },
  }],
}))

const messageOptions = computed(() =>
  Object.keys(messageMap.value).map(key => ({
    label: messageMap.value[key],
    value: key,
  })),
)

const bpmnInstances = () => (window as any).bpmnInstances

const getBindMessage = () => {
  bpmnElement.value = bpmnInstances().bpmnElement
  bindMessageId.value = bpmnElement.value.businessObject?.messageRef?.id || '-1'
}

const openMessageModel = () => {
  openCreate()
}

const createNewMessage = () => {
  const id = formData.value.id as string
  if (messageMap.value[id]) {
    message.error('该消息已存在，请修改id后重新保存')
    return
  }
  const newMessage = bpmnInstances().moddle.create('bpmn:Message', formData.value)
  bpmnRootElements.value.push(newMessage)
  messageMap.value[id] = (formData.value.name as string) || ''
  bpmnMessageRefsMap.value[id] = newMessage
  formVisible.value = false
}

const updateTaskMessage = (messageId: string) => {
  if (messageId === '-1') {
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
      messageRef: null,
    })
  }
  else {
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
      messageRef: bpmnMessageRefsMap.value[messageId],
    })
  }
}

onMounted(() => {
  bpmnMessageRefsMap.value = Object.create(null)
  bpmnRootElements.value = bpmnInstances().modeler.getDefinitions().rootElements
  bpmnRootElements.value
    .filter((el: any) => el.$type === 'bpmn:Message')
    .forEach((m: any) => {
      bpmnMessageRefsMap.value[m.id] = m
      messageMap.value[m.id] = m.name
    })
  messageMap.value['-1'] = '无'
})

onBeforeUnmount(() => {
  bpmnElement.value = null
})

watch(
  () => props.id,
  () => {
    nextTick(() => {
      getBindMessage()
    })
  },
  { immediate: true },
)
</script>
