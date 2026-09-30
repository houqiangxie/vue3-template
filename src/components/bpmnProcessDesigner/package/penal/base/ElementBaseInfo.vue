<template>
  <div class="panel-tab__content">
    <n-form label-width="90px" :model="needProps" :rules="rules">
      <div v-if="needProps.type == 'bpmn:Process'">
        <!-- 如果是 Process 信息的时候，使用自定义表单 -->
        <n-form-item label="流程标识" path="id">
          <n-input
            v-model:value="needProps.id"
            placeholder="请输入流标标识"
            :disabled="needProps.id !== undefined && needProps.id.length > 0"
            @update:value="handleKeyUpdate"
          />
        </n-form-item>
        <n-form-item label="流程名称" path="name">
          <n-input
            v-model:value="needProps.name"
            placeholder="请输入流程名称"
            clearable
            @update:value="handleNameUpdate"
          />
        </n-form-item>
      </div>
      <div v-else>
        <n-form-item label="ID">
          <n-input v-model:value="elementBaseInfo.id" clearable @update:value="() => updateBaseInfo('id')" />
        </n-form-item>
        <n-form-item label="名称">
          <n-input v-model:value="elementBaseInfo.name" clearable @update:value="() => updateBaseInfo('name')" />
        </n-form-item>
      </div>
      <n-form-item label="文档">
        <n-input
          v-model:value="documentation"
          type="textarea"
          :rows="3"
          placeholder="元素说明（写入 BPMN Documentation）"
          clearable
          @update:value="handleDocumentationUpdate"
        />
      </n-form-item>
    </n-form>
  </div>
</template>
<script lang="ts" setup>
defineOptions({ name: 'ElementBaseInfo' })

const props = defineProps({
  businessObject: {
    type: Object,
    default: () => {}
  },
  model: {
    type: Object,
    default: () => {}
  }
})
const needProps = ref<any>({})
const bpmnElement = ref()
const elementBaseInfo = ref<any>({})
const documentation = ref('')
// 流程模型的校验
const rules = reactive({
  id: [{ required: true, message: '流程标识不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '流程名称不能为空', trigger: 'blur' }]
})

const bpmnInstances = () => (window as any)?.bpmnInstances

function readDocumentation(businessObject: any): string {
  const list = businessObject?.documentation
  if (!Array.isArray(list) || !list.length)
    return ''
  return String(list[0]?.text ?? list[0]?.body ?? '')
}

const resetBaseInfo = () => {
  bpmnElement.value = bpmnInstances()?.bpmnElement
  elementBaseInfo.value = bpmnElement.value.businessObject
  needProps.value['type'] = bpmnElement.value.businessObject.$type
  documentation.value = readDocumentation(bpmnElement.value.businessObject)
}
const handleKeyUpdate = (value: string) => {
  // 校验 value 的值，只有 XML NCName 通过的情况下，才进行赋值。否则，会导致流程图报错，无法绘制的问题
  if (!value) {
    return
  }
  if (!value.match(/[a-zA-Z_][\-_.0-9a-zA-Z$]*/)) {
    return
  }

  // 在 BPMN 的 XML 中，流程标识 key，其实对应的是 id 节点
  elementBaseInfo.value['id'] = value

  setTimeout(() => {
    updateBaseInfo('id')
  }, 100)
}
const handleNameUpdate = (value: string) => {
  if (!value) {
    return
  }
  elementBaseInfo.value['name'] = value

  setTimeout(() => {
    updateBaseInfo('name')
  }, 100)
}

const handleDocumentationUpdate = (value: string) => {
  documentation.value = value ?? ''
  const moddle = bpmnInstances()?.moddle
  const modeling = bpmnInstances()?.modeling
  const element = toRaw(bpmnElement.value)
  if (!moddle || !modeling || !element)
    return

  const text = documentation.value.trim()
  const docs = text
    ? [moddle.create('bpmn:Documentation', { text })]
    : undefined
  modeling.updateProperties(element, { documentation: docs })
}

const updateBaseInfo = (key: string) => {
  const attrObj = Object.create(null)
  attrObj[key] = elementBaseInfo.value[key]
  needProps.value = { ...elementBaseInfo.value, ...needProps.value }

  if (key === 'id') {
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
      id: elementBaseInfo.value[key],
      di: { id: `${elementBaseInfo.value[key]}_di` }
    })
  } else {
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), attrObj)
  }
}

watch(
  () => props.businessObject,
  (val) => {
    if (val) {
      resetBaseInfo()
    }
  }
)

watch(
  () => props.model?.key,
  (val) => {
    // 针对上传的 bpmn 流程图时，保证 key 和 name 的更新
    if (val) {
      handleKeyUpdate(props.model.key)
      handleNameUpdate(props.model.name)
    }
  },
  {
    immediate: true
  }
)

onBeforeUnmount(() => {
  bpmnElement.value = null
})
</script>
