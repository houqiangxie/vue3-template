<template>
  <div class="simple-process-model-container position-relative">
    <div class="simple-process-model__toolbar">
      <n-button-group size="medium">
        <n-button v-if="!readonly" size="medium" @click="exportJson">
          <Icon icon="ep:download" /> 导出
        </n-button>
        <n-button v-if="!readonly" size="medium" @click="importJson">
          <Icon icon="ep:upload" />导入
        </n-button>
        <!-- 用于打开本地文件-->
        <input
          v-if="!readonly"
          type="file"
          id="files"
          ref="refFile"
          style="display: none"
          accept=".json"
          @change="importLocalFile"
        />
        <n-button size="medium" @click="processReZoom()">
          <template #icon>
            <n-icon :component="ExpandOutline" />
          </template>
        </n-button>
        <n-button size="medium" @click="zoomOut()">
          <template #icon>
            <n-icon :component="RemoveOutline" />
          </template>
        </n-button>
        <n-button size="medium" class="w-80px"> {{ scaleValue }}% </n-button>
        <n-button size="medium" @click="zoomIn()">
          <template #icon>
            <n-icon :component="AddOutline" />
          </template>
        </n-button>
        <n-button size="medium" @click="resetPosition">重置</n-button>
      </n-button-group>
    </div>
    <div
      ref="modelEl"
      class="simple-process-model"
      :style="{ cursor: isDragging ? 'grabbing' : 'grab' }"
      @mousedown="startDrag"
    >
      <ProcessNodeTree v-if="processNodeTree" v-model:flow-node="processNodeTree" />
    </div>
  </div>
  <n-modal
  v-model:show="errorDialogVisible"
  preset="card"
  title="保存失败"
  :style="{ width: '400px' }"
  :bordered="false"
  display-directive="if"
  class="app-dialog"
>
    <div class="mb-2">以下节点内容不完善，请修改后保存</div>
    <div
      class="mb-3 b-rounded-1 bg-gray-100 p-2 line-height-normal"
      v-for="(item, index) in errorNodes"
      :key="index"
    >
      {{ item.name }} : {{ NODE_DEFAULT_TEXT.get(item.type) }}
    </div>
    <template #footer>
      <n-button type="primary" @click="errorDialogVisible = false">知道了</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import ProcessNodeTree from './ProcessNodeTree.vue'
import { SimpleFlowNode, NodeType, NODE_DEFAULT_TEXT } from './consts'
import { useWatchNode } from './node'
import { AddOutline, ExpandOutline, RemoveOutline } from '@vicons/ionicons5'
import { isString } from '@/utils/is'
import download from '@/utils/download'
// 直接引用 Viewer/Designer 时也需加载样式（不依赖 barrel index.ts）
import '../theme/simple-process-designer.scss'

defineOptions({
  name: 'SimpleProcessModel'
})

const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  },
  readonly: {
    type: Boolean,
    required: false,
    default: true
  }
})

const emits = defineEmits<{
  save: [node: SimpleFlowNode | undefined]
}>()

const processNodeTree = useWatchNode(props)

provide('readonly', props.readonly)

/** 拖拽 / 缩放：位移走 DOM transform，避免每帧触发 Vue 重渲染导致卡顿 */
const modelEl = ref<HTMLElement | null>(null)
const scaleValue = ref(100)
const MAX_SCALE_VALUE = 200
const MIN_SCALE_VALUE = 50
const isDragging = ref(false)
let startX = 0
let startY = 0
let currentX = 0
let currentY = 0
let initialX = 0
let initialY = 0
let dragRaf = 0

const applyTransform = () => {
  if (!modelEl.value)
    return
  modelEl.value.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scaleValue.value / 100})`
}

const startDrag = (e: MouseEvent) => {
  if (e.button !== 0)
    return
  isDragging.value = true
  startX = e.clientX - currentX
  startY = e.clientY - currentY
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value)
    return
  e.preventDefault()
  currentX = e.clientX - startX
  currentY = e.clientY - startY
  if (dragRaf)
    return
  dragRaf = requestAnimationFrame(() => {
    dragRaf = 0
    applyTransform()
  })
}

const stopDrag = () => {
  if (!isDragging.value)
    return
  isDragging.value = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  if (dragRaf) {
    cancelAnimationFrame(dragRaf)
    dragRaf = 0
  }
  applyTransform()
}

const zoomIn = () => {
  if (scaleValue.value == MAX_SCALE_VALUE) {
    return
  }
  scaleValue.value += 10
  nextTick(applyTransform)
}

const zoomOut = () => {
  if (scaleValue.value == MIN_SCALE_VALUE) {
    return
  }
  scaleValue.value -= 10
  nextTick(applyTransform)
}

const processReZoom = () => {
  scaleValue.value = 100
  nextTick(applyTransform)
}

const resetPosition = () => {
  currentX = initialX
  currentY = initialY
  applyTransform()
}

/** 校验节点设置 */
const errorDialogVisible = ref(false)
let errorNodes: SimpleFlowNode[] = []

const validateNode = (node: SimpleFlowNode | undefined, errorNodes: SimpleFlowNode[]) => {
  if (node) {
    const { type, showText, conditionNodes } = node
    if (type == NodeType.END_EVENT_NODE) {
      return
    }
    if (type == NodeType.START_USER_NODE) {
      // 发起人节点暂时不用校验，直接校验孩子节点
      validateNode(node.childNode, errorNodes)
    }

    if (
      type === NodeType.USER_TASK_NODE ||
      type === NodeType.COPY_TASK_NODE ||
      type === NodeType.CONDITION_NODE
    ) {
      if (!showText) {
        errorNodes.push(node)
      }
      validateNode(node.childNode, errorNodes)
    }

    if (
      type == NodeType.CONDITION_BRANCH_NODE ||
      type == NodeType.PARALLEL_BRANCH_NODE ||
      type == NodeType.INCLUSIVE_BRANCH_NODE
    ) {
      // 分支节点
      // 1. 先校验各个分支
      conditionNodes?.forEach((item) => {
        validateNode(item, errorNodes)
      })
      // 2. 校验孩子节点
      validateNode(node.childNode, errorNodes)
    }
  }
}

/** 获取当前流程数据 */
const getCurrentFlowData = async () => {
  try {
    errorNodes = []
    validateNode(processNodeTree.value, errorNodes)
    if (errorNodes.length > 0) {
      errorDialogVisible.value = true
      return undefined
    }
    return processNodeTree.value
  } catch (error) {
    console.error('获取流程数据失败:', error)
    return undefined
  }
}

defineExpose({
  getCurrentFlowData
})

/** 导出 JSON */
const exportJson = () => {
  download.json(new Blob([JSON.stringify(processNodeTree.value)]), 'model.json')
}

/** 导入 JSON */
const refFile = ref()
const importJson = () => {
  refFile.value.click()
}
const importLocalFile = () => {
  const file = refFile.value.files[0]
  const reader = new FileReader()
  reader.readAsText(file)
  reader.onload = function () {
    if (isString(this.result)) {
      processNodeTree.value = JSON.parse(this.result)
      emits('save', processNodeTree.value)
    }
  }
}

// 在组件初始化时记录初始位置
onMounted(() => {
  initialX = currentX
  initialY = currentY
  applyTransform()
})

onBeforeUnmount(() => {
  stopDrag()
})
</script>

<style lang="scss" scoped>
.simple-process-model-container {
  width: 100%;
  height: 100%;
  min-height: 0;
  position: relative;
  overflow: hidden;
  user-select: none;
}

.simple-process-model {
  position: relative;
  min-width: 100%;
  min-height: 100%;
}

.simple-process-model__toolbar {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  background: #fff;
  border: 1px solid #d0d0d5;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);

  :deep(.n-button-group) {
    display: flex;
  }

  /* 用容器描边 + 分隔线，避免 quaternary / 主题导致边线丢失 */
  :deep(.n-button) {
    --n-border: 1px solid transparent !important;
    --n-border-hover: 1px solid transparent !important;
    --n-border-pressed: 1px solid transparent !important;
    --n-border-focus: 1px solid transparent !important;
    border-radius: 0 !important;
  }

  :deep(.n-button:not(:last-child)) {
    box-shadow: inset -1px 0 0 #d0d0d5;
  }

  :deep(.n-button:hover),
  :deep(.n-button:focus) {
    z-index: 1;
  }
}
</style>
