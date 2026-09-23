<template>
  <!-- BPMN设计器 -->
  <div v-if="modelData.type === BpmModelType.BPMN" class="process-design">
    <BpmModelEditor
      v-if="showDesigner"
      ref="bpmnEditorRef"
      :model-id="modelData.id"
      :model-key="modelData.key"
      :model-name="modelData.name"
      @success="handleDesignSuccess"
    />
  </div>

  <!-- Simple设计器 -->
  <div v-else class="process-design">
    <SimpleModelDesign
      v-if="showDesigner"
      ref="simpleEditorRef"
      :model-name="modelData.name"
      :model-form-id="modelData.formId"
      :model-form-type="modelData.formType"
      :start-user-ids="modelData.startUserIds"
      :start-dept-ids="modelData.startDeptIds"
      @success="handleDesignSuccess"
    />
  </div>
</template>

<script lang="ts" setup>
import { BpmModelType } from '@/utils/constants'
import {
  NodeType,
  NODE_DEFAULT_TEXT,
  type SimpleFlowNode
} from '@/components/SimpleProcessDesignerV2/src/consts'
import BpmModelEditor from './editor/index.vue'
import SimpleModelDesign from '../simple/SimpleModelDesign.vue'

// 创建本地数据副本
const modelData = defineModel<any>()

const processData = inject('processData') as Ref
const bpmnEditorRef = ref()
const simpleEditorRef = ref()
const message = useMessage()

/** 将 processData 写回模型字段 */
const applyProcessToModel = (data?: any) => {
  const payload = data ?? processData.value
  if (!payload) return
  if (modelData.value.type === BpmModelType.BPMN) {
    modelData.value = {
      ...modelData.value,
      bpmnXml: payload,
      simpleModel: null
    }
  } else {
    modelData.value = {
      ...modelData.value,
      bpmnXml: null,
      simpleModel: payload
    }
  }
}

/** 简易流程节点校验（设计器未挂载时也能跑） */
const validateSimpleNodes = (node: SimpleFlowNode | undefined, errorNodes: SimpleFlowNode[]) => {
  if (!node) return
  const { type, showText, conditionNodes } = node
  if (type === NodeType.END_EVENT_NODE) return
  if (type === NodeType.START_USER_NODE) {
    validateSimpleNodes(node.childNode, errorNodes)
    return
  }
  if (
    type === NodeType.USER_TASK_NODE ||
    type === NodeType.COPY_TASK_NODE ||
    type === NodeType.CONDITION_NODE
  ) {
    if (!showText) errorNodes.push(node)
    validateSimpleNodes(node.childNode, errorNodes)
  }
  if (
    type === NodeType.CONDITION_BRANCH_NODE ||
    type === NodeType.PARALLEL_BRANCH_NODE ||
    type === NodeType.INCLUSIVE_BRANCH_NODE
  ) {
    conditionNodes?.forEach((item) => validateSimpleNodes(item, errorNodes))
    validateSimpleNodes(node.childNode, errorNodes)
  }
}

/** 从表单/设计器同步最新流程数据到模型 */
const syncProcess = async () => {
  if (modelData.value.type === BpmModelType.BPMN) {
    if (bpmnEditorRef.value?.syncXml) {
      const xml = await bpmnEditorRef.value.syncXml()
      if (xml) applyProcessToModel(xml)
    } else {
      applyProcessToModel()
    }
  } else {
    if (simpleEditorRef.value?.validateAndSync) {
      const data = await simpleEditorRef.value.validateAndSync()
      applyProcessToModel(data)
    } else {
      const errorNodes: SimpleFlowNode[] = []
      validateSimpleNodes(processData.value, errorNodes)
      if (errorNodes.length > 0) {
        const tip = errorNodes
          .map((n) => `${n.name}: ${NODE_DEFAULT_TEXT.get(n.type)}`)
          .join('；')
        message.warning(tip || '请完善流程节点配置')
        throw new Error('请完善流程节点配置')
      }
      applyProcessToModel()
    }
  }
}

/** 表单校验（含同步） */
const validate = async () => {
  await syncProcess()
  if (!processData.value) {
    throw new Error('请设计流程')
  }
  return true
}

/** 处理设计器保存成功 */
const handleDesignSuccess = async (data?: any) => {
  if (data) {
    applyProcessToModel(data)
  }
}

/** 设计器 remount 后刷新 */
const refresh = async () => {
  await nextTick()
  if (modelData.value.type === BpmModelType.SIMPLE) {
    simpleEditorRef.value?.refresh?.()
  }
}

/** 是否显示设计器 */
const showDesigner = computed(() => {
  return Boolean(modelData.value?.key && modelData.value?.name)
})

defineExpose({
  validate,
  refresh,
  syncProcess
})
</script>

<style scoped>
.process-design {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.process-design > :deep(*) {
  flex: 1;
  min-height: 0;
  height: 100%;
}
</style>
