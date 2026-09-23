<template>
  <div v-loading="loading" class="bpm-detail">
    <n-card v-if="processInstance?.id" size="small" class="bpm-detail__header">
      <div class="bpm-detail__title-row">
        <div>
          <div class="bpm-detail__title">{{ processInstance.name }}</div>
          <div class="bpm-detail__meta">
            <n-tag size="small" :type="statusTagType" :bordered="false">
              {{ statusLabel }}
            </n-tag>
            <span>编号：{{ processInstance.id }}</span>
            <span>
              发起人：{{ processInstance.startUser?.nickname || processInstance.startUserNickname }}
            </span>
            <span>发起时间：{{ processInstance.startTime || processInstance.createTime }}</span>
            <span v-if="processInstance.durationInMillis">
              耗时：{{ formatDurationOrDash(processInstance.durationInMillis) }}
            </span>
          </div>
        </div>
        <n-space>
          <n-button quaternary @click="handlePrint">打印</n-button>
          <n-button quaternary @click="goBack">返回</n-button>
        </n-space>
      </div>
      <img
        v-if="statusWatermark"
        class="bpm-detail__watermark"
        :src="statusWatermark"
        alt=""
      >
    </n-card>

    <div v-if="processInstance?.id" class="bpm-detail__body">
      <n-card size="small" class="bpm-detail__main" title="申请信息">
        <n-tabs v-model:value="activeTab" type="line">
          <n-tab-pane name="form" tab="表单信息">
            <BpmProcessForm
              v-if="processDefinition.formType === BpmModelFormType.NORMAL"
              ref="formRef"
              :form-conf="processDefinition.formConf"
              :form-fields="processDefinition.formFields"
              :form-variables="processInstance.formVariables"
              :permissions="formFieldsPermission"
              :disabled="!canEditForm"
            />
            <div v-else class="bpm-detail__biz-form">
              <BpmBusinessFormView
                v-if="canEmbedBizForm"
                :path="processDefinition.formCustomViewPath"
                :business-key="processInstance.businessKey"
              />
              <template v-else>
                <n-alert type="info" title="业务表单">
                  当前为业务表单（{{ processDefinition.formCustomViewPath || '未配置查看路径' }}）。
                </n-alert>
                <n-button
                  v-if="processDefinition.formCustomViewPath"
                  type="primary"
                  secondary
                  class="bpm-detail__biz-btn"
                  @click="openBusinessForm"
                >
                  打开业务详情
                </n-button>
              </template>
            </div>
          </n-tab-pane>
          <n-tab-pane name="diagram" tab="流程图">
            <div class="bpm-detail__diagram">
              <template v-if="activeTab === 'diagram'">
                <SimpleProcessViewer
                  v-if="processDefinition.modelType === BpmModelType.SIMPLE && simpleModel"
                  :flow-node="simpleModel"
                  :tasks="modelViewTasks"
                  :process-instance="processInstance"
                />
                <ProcessViewer
                  v-else-if="processDefinition.modelType === BpmModelType.BPMN && bpmnXml"
                  :xml="bpmnXml"
                  :view="bpmnView"
                />
                <n-empty v-else description="暂无流程图" />
              </template>
            </div>
          </n-tab-pane>
          <n-tab-pane name="tasks" tab="流转记录">
            <n-data-table
              :columns="taskColumns"
              :data="taskList"
              :bordered="false"
              size="small"
            />
          </n-tab-pane>
          <n-tab-pane name="comment" tab="流转评论">
            <ProcessInstanceComment
              v-if="processInstance.id"
              :process-instance-id="String(processInstance.id)"
            />
          </n-tab-pane>
        </n-tabs>

        <ProcessInstanceOperationButton
          ref="operationRef"
          class="bpm-detail__ops"
          :process-instance-id="String(processInstance.id)"
          :process-instance-status="processInstance.status"
          :allow-cancel="processDefinition.allowCancelRunningProcess !== false"
          :validate-form="validateForm"
          :get-writable-variables="getWritableVariables"
          @success="refresh"
        />
      </n-card>

      <n-card size="small" class="bpm-detail__side" title="审批进度">
        <ProcessInstanceTimeline :nodes="activityNodes" />
      </n-card>
    </div>

    <n-empty v-else-if="!loading" description="未找到流程实例" />

    <PrintDialog ref="printRef" />

    <n-modal
      v-model:show="taskFormVisible"
      preset="card"
      :title="viewingTask?.formName ? `办理子表单【${viewingTask.formName}】` : '办理子表单'"
      style="width: min(640px, 94vw)"
      :bordered="false"
    >
      <BpmProcessForm
        v-if="taskFormVisible"
        :form-conf="viewingTask?.formConf"
        :form-fields="viewingTask?.formFields"
        :form-variables="viewingTask?.formVariables"
        disabled
      />
    </n-modal>
  </div>
</template>

<script setup lang="tsx">
import { useRoute, useRouter } from 'vue-router'
import type { DataTableColumns } from 'naive-ui'
import {
  getApprovalDetail,
  getProcessInstanceBpmnModelView,
  type ApprovalNodeInfo,
} from '@/api/bpm/processInstance'
import { getTaskListByProcessInstanceId } from '@/api/bpm/task'
import { BpmModelFormType, BpmModelType, BpmProcessInstanceStatus } from '@/utils/constants'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import runningSvg from '@/assets/svgs/bpm/running.svg'
import approveSvg from '@/assets/svgs/bpm/approve.svg'
import rejectSvg from '@/assets/svgs/bpm/reject.svg'
import cancelSvg from '@/assets/svgs/bpm/cancel.svg'
import { FieldPermissionType } from '@/components/SimpleProcessDesignerV2/src/consts'
import { SimpleProcessViewer } from '@/components/SimpleProcessDesignerV2/src'
import ProcessViewer from '@/components/bpmnProcessDesigner/package/designer/ProcessViewer.vue'
import BpmProcessForm from '../components/BpmProcessForm.vue'
import BpmBusinessFormView from '../../components/BpmBusinessFormView.vue'
import ProcessInstanceTimeline from './ProcessInstanceTimeline.vue'
import ProcessInstanceOperationButton from './ProcessInstanceOperationButton.vue'
import ProcessInstanceComment from './ProcessInstanceComment.vue'
import PrintDialog from './PrintDialog.vue'
import { resolveBpmRouteName } from '@/views/web/Bpm/routeNames'
import { canEmbedBusinessForm, openBusinessFormPath } from '@/views/web/Bpm/utils/businessForm'
import { setSimpleModelNodeTaskStatus } from '@/views/web/Bpm/utils/simpleModelStatus'
import { formatDurationOrDash } from '@/utils/formatTime'
import { NButton, NSpace } from 'naive-ui'

defineOptions({ name: 'BpmProcessInstanceDetail' })

const route = useRoute()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const activeTab = ref('form')
const processInstance = ref<any>({})
const processDefinition = ref<any>({})
const activityNodes = ref<ApprovalNodeInfo[]>([])
const formFieldsPermission = ref<Record<string, string>>({})
const operationRef = ref<InstanceType<typeof ProcessInstanceOperationButton> | null>(null)
const formRef = ref<InstanceType<typeof BpmProcessForm> | null>(null)
const printRef = ref<InstanceType<typeof PrintDialog> | null>(null)
const todoTask = ref<any>(null)
const simpleModel = ref<any>(null)
const bpmnXml = ref('')
const modelViewTasks = ref<any[]>([])
const bpmnModelView = ref<Record<string, any> | null>(null)
const taskList = ref<any[]>([])
const taskFormVisible = ref(false)
const viewingTask = ref<any>(null)
const bpmnView = computed(() => ({
  ...(bpmnModelView.value || {}),
  processInstance: processInstance.value,
  tasks: modelViewTasks.value,
  bpmnXml: bpmnXml.value,
}))

const id = computed(() => String(route.query.id || route.params.id || ''))
const taskId = computed(() => (route.query.taskId ? String(route.query.taskId) : undefined))
const activityId = computed(() => (route.query.activityId ? String(route.query.activityId) : undefined))

const canEditForm = computed(() => {
  if (!todoTask.value)
    return false
  return Object.values(formFieldsPermission.value || {}).some(p => p === FieldPermissionType.WRITE)
})

const statusLabel = computed(() =>
  getDictLabel(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, processInstance.value?.status),
)

const statusTagType = computed(() => {
  switch (processInstance.value?.status) {
    case 2: return 'success'
    case 3:
    case 4: return 'error'
    case 1: return 'info'
    default: return 'default'
  }
})

const auditIconsMap: Record<number, string> = {
  [BpmProcessInstanceStatus.RUNNING]: runningSvg,
  [BpmProcessInstanceStatus.APPROVE]: approveSvg,
  [BpmProcessInstanceStatus.REJECT]: rejectSvg,
  [BpmProcessInstanceStatus.CANCEL]: cancelSvg,
}

const statusWatermark = computed(() => {
  const status = processInstance.value?.status
  return status != null ? auditIconsMap[status] : undefined
})

const taskColumns: DataTableColumns<any> = [
  { title: '任务', key: 'name', ellipsis: { tooltip: true } },
  {
    title: '处理人',
    key: 'assigneeUserNickname',
    width: 120,
    render: (row) => row.assigneeUser?.nickname || row.assigneeUserNickname || '-',
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => getDictLabel(DICT_TYPE.BPM_TASK_STATUS, row.status),
  },
  { title: '开始时间', key: 'createTime', width: 160 },
  { title: '结束时间', key: 'endTime', width: 160 },
  {
    title: '耗时',
    key: 'durationInMillis',
    width: 120,
    render: (row) => formatDurationOrDash(row.durationInMillis),
  },
  {
    title: '意见',
    key: 'reason',
    ellipsis: { tooltip: true },
    render: (row) => (
      <NSpace size={8} align="center">
        <span>{row.reason || '-'}</span>
        {row.formId > 0 && (
          <NButton size="tiny" secondary type="primary" onClick={() => openTaskForm(row)}>
            查看表单
          </NButton>
        )}
      </NSpace>
    ),
  },
]

function openTaskForm(row: any) {
  viewingTask.value = row
  taskFormVisible.value = true
}

async function loadDetail() {
  if (!id.value) {
    message.error('缺少流程实例编号')
    return
  }
  loading.value = true
  try {
    const data = await getApprovalDetail({
      processInstanceId: id.value,
      taskId: taskId.value,
      activityId: activityId.value,
    }) as any
    if (!data?.processInstance || !data?.processDefinition) {
      message.error('查询不到审批详情信息')
      return
    }
    processInstance.value = data.processInstance
    processDefinition.value = data.processDefinition
    activityNodes.value = data.activityNodes || []
    formFieldsPermission.value = data.formFieldsPermission || {}
    todoTask.value = data.todoTask || null
    await nextTick()
    operationRef.value?.loadTodoTask(data.todoTask)

    await Promise.all([loadModelView(), loadTaskList()])
  }
  finally {
    loading.value = false
  }
}

async function validateForm() {
  if (!formRef.value)
    return {}
  return await formRef.value.validate()
}

function getWritableVariables() {
  return formRef.value?.getWritableValues?.() || {}
}

const canEmbedBizForm = computed(() =>
  canEmbedBusinessForm(processDefinition.value?.formCustomViewPath),
)

function openBusinessForm() {
  const path = processDefinition.value?.formCustomViewPath
  if (!path) {
    message.warning('未配置业务表单查看路径')
    return
  }
  const businessKey = processInstance.value?.businessKey
  const query = businessKey ? { id: String(businessKey) } : undefined
  if (!openBusinessFormPath(router, path, query))
    message.warning(`无法打开业务表单：${path}`)
}

async function loadModelView() {
  try {
    const data = await getProcessInstanceBpmnModelView(id.value) as any
    if (!data)
      return
    bpmnModelView.value = data
    bpmnXml.value = data.bpmnXml || ''
    modelViewTasks.value = data.tasks || []

    const model = data.simpleModel || null
    if (model) {
      setSimpleModelNodeTaskStatus(
        model,
        data.processInstance?.status ?? processInstance.value?.status,
        data.rejectedTaskActivityIds || [],
        data.unfinishedTaskActivityIds || [],
        data.finishedTaskActivityIds || [],
        data.finishedSequenceFlowActivityIds || [],
      )
    }
    simpleModel.value = model
  }
  catch {
    // ignore
  }
}

async function loadTaskList() {
  try {
    taskList.value = (await getTaskListByProcessInstanceId(id.value) as any[]) || []
  }
  catch {
    taskList.value = []
  }
}

function refresh() {
  loadDetail()
}

function handlePrint() {
  if (!id.value) {
    message.warning('缺少流程实例编号')
    return
  }
  printRef.value?.open(id.value)
}

function goBack() {
  if (window.history.length > 1)
    router.back()
  else {
    const name = resolveBpmRouteName(router, 'Bpm-ProcessInstance', 'BpmProcessInstance')
    router.push({ name })
  }
}

watch(id, () => loadDetail(), { immediate: true })
</script>

<style scoped>
.bpm-detail {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: auto;
}
.bpm-detail__header {
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}
.bpm-detail__watermark {
  position: absolute;
  right: 24px;
  top: 8px;
  width: 120px;
  height: auto;
  pointer-events: none;
  opacity: 0.85;
  z-index: 1;
}
.bpm-detail__title-row {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.bpm-detail__title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}
.bpm-detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  color: var(--n-text-color-3);
  font-size: 13px;
}
.bpm-detail__body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 12px;
}
.bpm-detail__main,
.bpm-detail__side {
  min-height: 0;
}
.bpm-detail__diagram {
  height: 480px;
  min-height: 480px;
  overflow: hidden;
}
.bpm-detail__diagram :deep(.process-viewer) {
  height: 100%;
  min-height: 100%;
}
.bpm-detail__ops {
  margin-top: 12px;
  border-top: 1px solid var(--n-border-color);
  padding-top: 8px;
}
.bpm-detail__biz-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}
.bpm-detail__biz-btn {
  margin-left: 0;
}
@media (max-width: 960px) {
  .bpm-detail__body {
    grid-template-columns: 1fr;
  }
}
</style>
