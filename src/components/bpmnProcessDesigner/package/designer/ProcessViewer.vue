<template>
  <div class="process-viewer" :style="bpmnThemeStyle">
    <div style="height: 100%" ref="processCanvas" v-show="!isLoading"> </div>
    <!-- 自定义箭头样式，用于已完成状态下流程连线箭头 -->
    <defs ref="customDefs">
      <marker id="sequenceflow-end-white-success" viewBox="0 0 20 20" refX="11" refY="10" markerWidth="10"
        markerHeight="10" orient="auto">
        <path class="success-arrow" d="M 1 5 L 11 10 L 1 15 Z"
          style="stroke-width: 1px; stroke-linecap: round; stroke-dasharray: 10000, 1" />
      </marker>
      <marker id="conditional-flow-marker-white-success" viewBox="0 0 20 20" refX="-1" refY="10" markerWidth="10"
        markerHeight="10" orient="auto">
        <path class="success-conditional" d="M 0 10 L 8 6 L 16 10 L 8 14 Z"
          style="stroke-width: 1px; stroke-linecap: round; stroke-dasharray: 10000, 1" />
      </marker>
    </defs>

    <!-- 审批记录 -->
    <Dialog v-model="dialogVisible" :title="dialogTitle || '审批记录'" width="1000px" :scroll="true">
      <CommonTable
        :data="selectTasks"
        :fields="taskTableFields"
        :show-pagination="false"
        :csv-export="false"
        :flex-height="false"
        show-index
        :table-props="{ size: 'small', bordered: true, singleLine: false }"
      />
    </Dialog>

    <!-- Zoom：放大、缩小 -->
    <div style="position: absolute; top: 0; left: 0; width: 100%">
      <div style="display: flex; justify-content: flex-end">
        <n-button-group>
          <n-button :disabled="defaultZoom <= 0.3" @click="processZoomOut()">
            <template #icon>
              <n-icon :component="RemoveOutline" />
            </template>
          </n-button>
          <n-button style="width: 90px" disabled>
            {{ Math.floor(defaultZoom * 10 * 10) + '%' }}
          </n-button>
          <n-button :disabled="defaultZoom >= 3.9" @click="processZoomIn()">
            <template #icon>
              <n-icon :component="AddOutline" />
            </template>
          </n-button>
          <n-button @click="processReZoom()">
            <template #icon>
              <n-icon :component="ExpandOutline" />
            </template>
          </n-button>
        </n-button-group>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { AddOutline, ExpandOutline, RemoveOutline } from '@vicons/ionicons5'
import { h } from 'vue'
import '../theme/index.scss'
import { useBpmnTheme } from '../theme/useBpmnTheme'
import BpmnViewer from 'bpmn-js/lib/Viewer'
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas'
import { Dialog } from '@/components/Dialog'
import DictTag from '@/components/bpm/DictTag.vue'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate, formatPast2 } from '@/utils/formatTime'
import { BpmProcessInstanceStatus } from '@/utils/constants'
import { defineFields } from '@/utils/schema'

const { bpmnThemeStyle } = useBpmnTheme()

const props = defineProps({
  xml: {
    type: String,
    required: true
  },
  view: {
    type: Object,
    require: true
  }
})

const processCanvas = ref()
const bpmnViewer = ref<BpmnViewer | null>(null)
const customDefs = ref()
const defaultZoom = ref(1) // 默认缩放比例
const isLoading = ref(false) // 是否加载中

const processInstance = ref<any>({}) // 流程实例
const tasks = ref([]) // 流程任务

const dialogVisible = ref(false) // 弹窗可见性
const dialogTitle = ref<string | undefined>(undefined) // 弹窗标题
const selectActivityType = ref<string | undefined>(undefined) // 选中 Task 的活动编号
const selectTasks = ref<any[]>([]) // 选中的任务数组

const taskTableFields = computed(() => {
  const isUserTask = selectActivityType.value === 'bpmn:UserTask'
  const fields = defineFields([
    {
      key: 'assignee',
      label: isUserTask ? '审批人' : '发起人',
      form: false,
      search: false,
      table: {
        minWidth: 100,
        align: 'center',
        render: (row: any) =>
          isUserTask
            ? (row.assigneeUser?.name || row.ownerUser?.name || '')
            : (row.assigneeUser?.name || ''),
      },
    },
    {
      key: 'dept',
      label: '部门',
      form: false,
      search: false,
      table: {
        minWidth: 100,
        align: 'center',
        render: (row: any) => row.assigneeUser?.deptName || row.ownerUser?.deptName || '',
      },
    },
    {
      key: 'createTime',
      label: '开始时间',
      form: false,
      search: false,
      table: {
        minWidth: 140,
        align: 'center',
        render: (row: any) => formatDate(row.createTime),
      },
    },
    {
      key: 'endTime',
      label: '结束时间',
      form: false,
      search: false,
      table: {
        minWidth: 140,
        align: 'center',
        render: (row: any) => formatDate(row.endTime),
      },
    },
    {
      key: 'status',
      label: '审批状态',
      form: false,
      search: false,
      table: {
        minWidth: 90,
        align: 'center',
        render: (row: any) =>
          h(DictTag, { type: DICT_TYPE.BPM_TASK_STATUS, value: row.status }),
      },
    },
  ])

  if (isUserTask) {
    fields.push({
      key: 'reason',
      label: '审批建议',
      form: false,
      search: false,
      table: { minWidth: 120, align: 'center' },
    } as any)
  }

  fields.push({
    key: 'durationInMillis',
    label: '耗时',
    form: false,
    search: false,
    table: {
      width: 100,
      align: 'center',
      render: (row: any) => formatPast2(row.durationInMillis),
    },
  } as any)

  return fields
})

/** Zoom：恢复 */
const processReZoom = () => {
  defaultZoom.value = 1
  bpmnViewer.value?.get('canvas').zoom('fit-viewport', 'auto')
}

/** Zoom：放大 */
const processZoomIn = (zoomStep = 0.1) => {
  let newZoom = Math.floor(defaultZoom.value * 100 + zoomStep * 100) / 100
  if (newZoom > 4) {
    throw new Error('[Process Designer Warn ]: The zoom ratio cannot be greater than 4')
  }
  defaultZoom.value = newZoom
  bpmnViewer.value?.get('canvas').zoom(defaultZoom.value)
}

/** Zoom：缩小 */
const processZoomOut = (zoomStep = 0.1) => {
  let newZoom = Math.floor(defaultZoom.value * 100 - zoomStep * 100) / 100
  if (newZoom < 0.2) {
    throw new Error('[Process Designer Warn ]: The zoom ratio cannot be less than 0.2')
  }
  defaultZoom.value = newZoom
  bpmnViewer.value?.get('canvas').zoom(defaultZoom.value)
}

/** 流程图预览清空 */
const clearViewer = () => {
  if (processCanvas.value) {
    processCanvas.value.innerHTML = ''
  }
  if (bpmnViewer.value) {
    bpmnViewer.value.destroy()
  }
  bpmnViewer.value = null
}

/** 添加自定义箭头 */
// TODO 芋艿：自定义箭头不生效，有点奇怪！！！！相关的 marker-end、marker-start 暂时也注释了！！！
const addCustomDefs = () => {
  if (!bpmnViewer.value) {
    return
  }
  const canvas = bpmnViewer.value?.get('canvas')
  const svg = canvas?._svg
  svg.appendChild(customDefs.value)
}

/** 节点选中 */
const onSelectElement = (element: any) => {
  // 清空原选中
  selectActivityType.value = undefined
  dialogTitle.value = undefined
  if (!element || !processInstance.value?.id) {
    return
  }

  // UserTask 的情况
  const activityType = element.type
  selectActivityType.value = activityType
  if (activityType === 'bpmn:UserTask') {
    dialogTitle.value = element.businessObject ? element.businessObject.name : undefined
    selectTasks.value = tasks.value.filter((item: any) => item?.taskDefinitionKey === element.id)
    dialogVisible.value = true
  } else if (activityType === 'bpmn:EndEvent' || activityType === 'bpmn:StartEvent') {
    dialogTitle.value = '审批信息'
    selectTasks.value = [
      {
        assigneeUser: processInstance.value.startUser,
        createTime: processInstance.value.startTime,
        endTime: processInstance.value.endTime,
        status: processInstance.value.status,
        durationInMillis: processInstance.value.durationInMillis
      }
    ]
    dialogVisible.value = true
  }
}

/** 初始化 BPMN 视图 */
const importXML = async (xml: string) => {
  // 清空流程图
  clearViewer()

  // 初始化流程图
  if (xml != null && xml !== '') {
    try {
      bpmnViewer.value = new BpmnViewer({
        additionalModules: [MoveCanvasModule],
        container: processCanvas.value
      })
      // 增加点击事件
      bpmnViewer.value.on('element.click', ({ element }) => {
        onSelectElement(element)
      })

      // 初始化 BPMN 视图
      isLoading.value = true
      await bpmnViewer.value.importXML(xml)
      // 自定义成功的箭头
      addCustomDefs()
    } catch (e) {
      clearViewer()
    } finally {
      isLoading.value = false
      // 高亮流程
      setProcessStatus(props.view)
    }
  }
}

/** 高亮流程 */
const setProcessStatus = (view: any) => {
  // 设置相关变量
  if (!view || !view.processInstance) {
    return
  }
  processInstance.value = view.processInstance
  tasks.value = view.tasks
  if (isLoading.value || !bpmnViewer.value) {
    return
  }
  const {
    unfinishedTaskActivityIds,
    finishedTaskActivityIds,
    finishedSequenceFlowActivityIds,
    rejectedTaskActivityIds
  } = view
  const canvas = bpmnViewer.value.get('canvas')
  const elementRegistry = bpmnViewer.value.get('elementRegistry')

  // 已完成节点
  if (Array.isArray(finishedSequenceFlowActivityIds)) {
    finishedSequenceFlowActivityIds.forEach((item: any) => {
      if (item != null) {
        canvas.addMarker(item, 'success')
        const element = elementRegistry.get(item)
        const conditionExpression = element.businessObject.conditionExpression
        if (conditionExpression) {
          canvas.addMarker(item, 'condition-expression')
        }
      }
    })
  }
  if (Array.isArray(finishedTaskActivityIds)) {
    finishedTaskActivityIds.forEach((item: any) => canvas.addMarker(item, 'success'))
  }

  // 未完成节点
  if (Array.isArray(unfinishedTaskActivityIds)) {
    unfinishedTaskActivityIds.forEach((item: any) => canvas.addMarker(item, 'primary'))
  }

  // 被拒绝节点
  if (Array.isArray(rejectedTaskActivityIds)) {
    rejectedTaskActivityIds.forEach((item: any) => {
      if (item != null) {
        canvas.addMarker(item, 'danger')
      }
    })
  }

  // 特殊：处理 end 节点的高亮。因为 end 在拒绝、取消时，被后端计算成了 finishedTaskActivityIds 里
  if (
    [BpmProcessInstanceStatus.CANCEL, BpmProcessInstanceStatus.REJECT].includes(
      processInstance.value.status
    )
  ) {
    const endNodes = elementRegistry.filter((element: any) => element.type === 'bpmn:EndEvent')
    endNodes.forEach((item: any) => {
      canvas.removeMarker(item.id, 'success')
      if (processInstance.value.status === BpmProcessInstanceStatus.CANCEL) {
        canvas.addMarker(item.id, 'cancel')
      } else {
        canvas.addMarker(item.id, 'danger')
      }
    })
  }
}

watch(
  () => props.xml,
  (newXml) => {
    importXML(newXml)
  },
  { immediate: true }
)

watch(
  () => props.view,
  (newView) => {
    setProcessStatus(newView)
  },
  { immediate: true }
)

/** mounted：初始化 */
onMounted(() => {
  importXML(props.xml)
  setProcessStatus(props.view)
})

/** unmount：销毁 */
onBeforeUnmount(() => {
  clearViewer()
})
</script>
