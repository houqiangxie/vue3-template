<template>
  <div v-if="definition" class="bpm-create-detail">
    <div class="bpm-create-detail__head">
      <n-button quaternary @click="emit('cancel')">返回</n-button>
      <span class="bpm-create-detail__title">发起「{{ definition.name }}」</span>
    </div>

    <n-tabs v-model:value="activeTab" type="line" class="bpm-create-detail__tabs">
      <n-tab-pane name="form" tab="表单填写">
        <div class="bpm-create-detail__body">
          <n-card size="small" title="填写表单" class="bpm-create-detail__main">
            <BpmProcessForm
              v-if="definition.formType === BpmModelFormType.NORMAL"
              ref="formRef"
              :form-conf="formConf"
              :form-fields="formFields"
              :form-variables="initialVariables"
              :permissions="formFieldsPermission"
              :disabled="false"
            />
            <div v-else class="bpm-create-detail__biz">
              <n-alert type="warning" title="业务表单">
                请前往业务发起页：{{ definition.formCustomCreatePath || '未配置' }}
              </n-alert>
              <n-button
                v-if="definition.formCustomCreatePath"
                type="primary"
                secondary
                @click="openBusinessCreate"
              >
                打开业务发起页
              </n-button>
            </div>

            <n-space class="bpm-create-detail__actions">
              <n-button
                v-if="definition.formType === BpmModelFormType.NORMAL"
                type="primary"
                :loading="submitting"
                @click="handleSubmit"
              >
                提交
              </n-button>
              <n-button @click="emit('cancel')">取消</n-button>
            </n-space>
          </n-card>

          <n-card size="small" title="审批预览" class="bpm-create-detail__side">
            <ProcessInstanceTimeline
              ref="timelineRef"
              :nodes="activityNodes"
              :enable-approve-user-select="true"
              @select-user-confirm="onSelectUserConfirm"
            />
          </n-card>
        </div>
      </n-tab-pane>

      <n-tab-pane name="diagram" tab="流程图">
        <div class="bpm-create-detail__diagram">
          <template v-if="activeTab === 'diagram'">
            <SimpleProcessViewer
              v-if="definition.modelType === BpmModelType.SIMPLE && simpleModel"
              :flow-node="simpleModel"
            />
            <ProcessViewer
              v-else-if="definition.modelType === BpmModelType.BPMN && bpmnXml"
              :xml="bpmnXml"
              :view="{}"
            />
            <n-empty v-else description="暂无流程图" />
          </template>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import {
  createProcessInstance,
  getApprovalDetail,
  type ApprovalNodeInfo,
} from '@/api/bpm/processInstance'
import { getProcessDefinition } from '@/api/bpm/definition'
import { getForm } from '@/api/bpm/form'
import { BpmModelFormType, BpmModelType } from '@/utils/constants'
import {
  CandidateStrategy,
  NodeId,
} from '@/components/SimpleProcessDesignerV2/src/consts'
import { SimpleProcessViewer } from '@/components/SimpleProcessDesignerV2/src'
import ProcessViewer from '@/components/bpmnProcessDesigner/package/designer/ProcessViewer.vue'
import BpmProcessForm from '../components/BpmProcessForm.vue'
import ProcessInstanceTimeline from '../detail/ProcessInstanceTimeline.vue'
import { openBusinessFormPath } from '@/views/web/Bpm/utils/businessForm'

defineOptions({ name: 'ProcessDefinitionDetail' })

const emit = defineEmits<{
  cancel: []
  success: [id: string]
}>()

const message = useMessage()
const router = useRouter()
const definition = ref<any>(null)
const formConf = ref<string>('')
const formFields = ref<string[]>([])
const initialVariables = ref<Record<string, unknown>>({})
const formFieldsPermission = ref<Record<string, string>>({})
const formRef = ref<InstanceType<typeof BpmProcessForm> | null>(null)
const timelineRef = ref<InstanceType<typeof ProcessInstanceTimeline> | null>(null)
const submitting = ref(false)
const activeTab = ref('form')
const activityNodes = ref<ApprovalNodeInfo[]>([])
const startUserSelectTasks = ref<any[]>([])
const startUserSelectAssignees = ref<Record<string, number[]>>({})
const tempStartUserSelectAssignees = ref<Record<string, number[]>>({})
const bpmnXml = ref('')
const simpleModel = ref<any>(null)

async function initProcessInfo(row: any, formVariables?: Record<string, unknown>) {
  definition.value = row
  initialVariables.value = { ...(formVariables || {}) }
  formConf.value = ''
  formFields.value = []
  formFieldsPermission.value = {}
  activityNodes.value = []
  startUserSelectTasks.value = []
  startUserSelectAssignees.value = {}
  tempStartUserSelectAssignees.value = {}
  bpmnXml.value = ''
  simpleModel.value = null
  activeTab.value = 'form'

  if (row.formType === BpmModelFormType.CUSTOM && row.formCustomCreatePath) {
    openBusinessCreate()
    return
  }

  if (row.formType === BpmModelFormType.NORMAL && row.formId) {
    const form = await getForm(row.formId) as any
    formConf.value = form?.conf || ''
    formFields.value = form?.fields || []
  }
  else if (row.formConf) {
    formConf.value = row.formConf
    formFields.value = row.formFields || []
  }

  await nextTick()
  await Promise.all([
    loadApprovalDetail(JSON.stringify(initialVariables.value)),
    loadDiagram(row.id),
  ])
}

async function loadDiagram(processDefinitionId?: string) {
  if (!processDefinitionId)
    return
  try {
    const detail = await getProcessDefinition(processDefinitionId) as any
    if (!detail)
      return
    bpmnXml.value = detail.bpmnXml || ''
    const raw = detail.simpleModel
    if (!raw) {
      simpleModel.value = null
      return
    }
    simpleModel.value = typeof raw === 'string' ? JSON.parse(raw) : raw
  }
  catch {
    bpmnXml.value = ''
    simpleModel.value = null
  }
}

async function loadApprovalDetail(processVariablesStr: string) {
  if (!definition.value?.id)
    return
  try {
    const data = await getApprovalDetail({
      processDefinitionId: definition.value.id,
      activityId: NodeId.START_USER_NODE_ID,
      processVariablesStr,
    }) as any
    if (!data)
      return

    formFieldsPermission.value = data.formFieldsPermission || {}
    activityNodes.value = data.activityNodes || []
    startUserSelectTasks.value = activityNodes.value.filter(
      (node: any) => CandidateStrategy.START_USER_SELECT === node.candidateStrategy,
    )

    const next: Record<string, number[]> = {}
    const restoreUsers: Record<string, any[]> = {}
    for (const node of startUserSelectTasks.value) {
      const ids = tempStartUserSelectAssignees.value[node.id]?.length
        ? [...tempStartUserSelectAssignees.value[node.id]]
        : []
      next[node.id] = ids
      restoreUsers[node.id] = ids.map(id => ({ id, nickname: `用户${id}` }))
    }
    startUserSelectAssignees.value = next
    await nextTick()
    timelineRef.value?.batchSetCustomApproveUsers(restoreUsers)
  }
  catch {
    // 预测失败不阻断发起
  }
}

function onSelectUserConfirm(id: string, userList: any[]) {
  startUserSelectAssignees.value = {
    ...startUserSelectAssignees.value,
    [id]: (userList || []).map((u: any) => Number(u.id)),
  }
}

function openBusinessCreate() {
  const path = definition.value?.formCustomCreatePath
  if (!path) {
    message.warning('未配置业务发起路径')
    return
  }
  if (!openBusinessFormPath(router, path))
    message.warning(`无法打开业务发起页：${path}`)
}

async function handleSubmit() {
  if (!definition.value)
    return
  submitting.value = true
  try {
    let variables: Record<string, unknown> = {}
    if (formRef.value)
      variables = await formRef.value.validate()

    for (const task of startUserSelectTasks.value) {
      if (!startUserSelectAssignees.value[task.id]?.length) {
        message.warning(`请选择「${task.name}」的候选人`)
        return
      }
    }

    const id = await createProcessInstance({
      processDefinitionId: definition.value.id,
      variables,
      startUserSelectAssignees: startUserSelectAssignees.value,
    }) as string
    message.success('发起成功')
    emit('success', String(id))
  }
  catch (e: any) {
    message.error(e?.message || '发起失败，请检查表单')
  }
  finally {
    submitting.value = false
  }
}

let predictTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => formRef.value?.model,
  (model) => {
    if (!definition.value?.id || !model)
      return
    if (predictTimer)
      clearTimeout(predictTimer)
    predictTimer = setTimeout(() => {
      tempStartUserSelectAssignees.value = { ...startUserSelectAssignees.value }
      loadApprovalDetail(JSON.stringify(model))
    }, 400)
  },
  { deep: true },
)

defineExpose({ initProcessInfo })
</script>

<style scoped>
.bpm-create-detail__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.bpm-create-detail__title {
  font-size: 16px;
  font-weight: 600;
}
.bpm-create-detail__tabs {
  min-height: 0;
}
.bpm-create-detail__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 12px;
  align-items: start;
}
.bpm-create-detail__diagram {
  height: 480px;
  min-height: 480px;
  overflow: hidden;
  padding: 8px 0;
  box-sizing: border-box;
}
.bpm-create-detail__diagram :deep(.process-viewer) {
  height: 100%;
  min-height: 100%;
}
.bpm-create-detail__actions {
  margin-top: 16px;
}
.bpm-create-detail__biz {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}
@media (max-width: 960px) {
  .bpm-create-detail__body {
    grid-template-columns: 1fr;
  }
}
</style>
