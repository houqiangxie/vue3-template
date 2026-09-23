<template>
  <div v-if="todoTask" class="bpm-ops">
    <n-space>
      <n-button
        v-for="btn in enabledButtons"
        :key="btn.id"
        :type="buttonType(btn.id)"
        @click="openAction(btn.id)"
      >
        {{ btn.displayName }}
      </n-button>
      <n-button v-if="canDeleteSign" @click="openDeleteSign">减签</n-button>
      <n-button v-if="canCancel" @click="openCancel">取消流程</n-button>
    </n-space>

    <n-modal
      v-model:show="reasonVisible"
      preset="dialog"
      :title="reasonTitle"
      positive-text="确认"
      negative-text="取消"
      :loading="submitting"
      :style="{ width: hasApproveForm && currentAction === OperationButtonType.APPROVE ? 'min(640px, 94vw)' : 'min(520px, 94vw)' }"
      @positive-click="submitReason"
    >
      <n-form label-placement="top">
        <n-card
          v-if="hasApproveForm && currentAction === OperationButtonType.APPROVE"
          size="small"
          class="bpm-ops__approve-form"
          :title="`填写表单【${todoTask?.formName || '办理子表单'}】`"
        >
          <BpmProcessForm
            ref="approveFormRef"
            :form-conf="todoTask?.formConf"
            :form-fields="todoTask?.formFields"
            :form-variables="todoTask?.formVariables"
            :disabled="false"
          />
        </n-card>
        <n-form-item v-if="needUser" :label="userLabel" required>
          <UserSelect
            v-model:value="targetUserId"
            :multiple="isMultiUser"
            placeholder="请选择用户"
          />
        </n-form-item>
        <n-form-item v-if="needSignType" label="加签方式" required>
          <n-radio-group v-model:value="signType">
            <n-space>
              <n-radio value="before">向前加签</n-radio>
              <n-radio value="after">向后加签</n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>
        <n-form-item v-if="needDeleteSign" label="减签人员" required>
          <n-select
            v-model:value="deleteSignTaskId"
            :options="deleteSignOptions"
            placeholder="请选择减签人员"
          />
        </n-form-item>
        <n-form-item v-if="needReturnNode" label="退回节点" required>
          <n-select
            v-model:value="returnNodeKey"
            :options="returnNodeOptions"
            placeholder="请选择退回节点"
          />
        </n-form-item>
        <n-form-item
          v-for="node in nextAssigneeNodes"
          :key="node.id"
          :label="`选择「${node.name}」审批人`"
          required
        >
          <UserSelect
            :value="nextAssignees[node.id] || []"
            multiple
            placeholder="请选择审批人"
            @update:value="(v) => onNextAssigneeChange(node.id, v)"
          />
        </n-form-item>
        <n-form-item v-if="needHandSign" label="签名" required>
          <n-space align="center">
            <n-button @click="signRef?.open()">点击签名</n-button>
            <img v-if="signPicUrl" :src="signPicUrl" alt="签名" class="bpm-ops__sign-preview">
          </n-space>
        </n-form-item>
        <n-form-item label="审批意见">
          <n-input
            v-model:value="reason"
            type="textarea"
            :rows="3"
            placeholder="请输入审批意见"
          />
        </n-form-item>
      </n-form>
    </n-modal>

    <SignDialog ref="signRef" @success="onSignSuccess" />
  </div>
  <div v-else-if="canCancel" class="bpm-ops">
    <n-button @click="openCancel">取消流程</n-button>
    <n-modal
      v-model:show="reasonVisible"
      preset="dialog"
      title="取消流程"
      positive-text="确认"
      negative-text="取消"
      :loading="submitting"
      @positive-click="submitCancel"
    >
      <n-input v-model:value="reason" type="textarea" :rows="3" placeholder="请输入取消原因" />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import {
  approveTask,
  copyTask,
  delegateTask,
  getChildrenTaskList,
  getTaskListByReturn,
  rejectTask,
  returnTask,
  signCreateTask,
  signDeleteTask,
  transferTask,
} from '@/api/bpm/task'
import {
  cancelProcessInstanceByStartUser,
  getNextApprovalNodes,
} from '@/api/bpm/processInstance'
import {
  CandidateStrategy,
  OperationButtonType,
} from '@/components/SimpleProcessDesignerV2/src/consts'
import UserSelect from '@/components/common/UserSelect.vue'
import { BpmProcessInstanceStatus } from '@/utils/constants'
import BpmProcessForm from '../components/BpmProcessForm.vue'
import SignDialog from './SignDialog.vue'

defineOptions({ name: 'ProcessInstanceOperationButton' })

const props = defineProps<{
  processInstanceId: string
  processInstanceStatus?: number
  allowCancel?: boolean
  /** 校验主表单并返回全部值 */
  validateForm?: () => Promise<Record<string, unknown>>
  /** 仅返回可编辑字段变量 */
  getWritableVariables?: () => Record<string, unknown>
}>()

const emit = defineEmits<{
  success: []
}>()

const message = useMessage()
const todoTask = ref<any>(null)
const childTasks = ref<any[]>([])
const reasonVisible = ref(false)
const reasonTitle = ref('')
const reason = ref('')
const submitting = ref(false)
const currentAction = ref<number | 'cancel' | 'deleteSign' | null>(null)
const targetUserId = ref<number | number[] | null>(null)
const returnNodeKey = ref<string | null>(null)
const returnNodeOptions = ref<Array<{ label: string, value: string }>>([])
const signType = ref<'before' | 'after'>('before')
const deleteSignTaskId = ref<string | null>(null)
const signRef = ref<InstanceType<typeof SignDialog> | null>(null)
const signPicUrl = ref('')
const nextAssigneeNodes = ref<any[]>([])
const nextAssignees = ref<Record<string, number[]>>({})
const approveFormRef = ref<InstanceType<typeof BpmProcessForm> | null>(null)

const hasApproveForm = computed(() => {
  const task = todoTask.value
  if (!task?.formId)
    return false
  return !!(task.formConf || (task.formFields || []).length)
})

const enabledButtons = computed(() => {
  const settings = todoTask.value?.buttonsSetting
  if (Array.isArray(settings) && settings.length)
    return settings.filter((b: any) => b.enable)
  return [
    { id: OperationButtonType.APPROVE, displayName: '通过', enable: true },
    { id: OperationButtonType.REJECT, displayName: '拒绝', enable: true },
  ]
})

const canCancel = computed(() =>
  props.allowCancel !== false
  && props.processInstanceStatus === BpmProcessInstanceStatus.RUNNING,
)

const canDeleteSign = computed(() => childTasks.value.length > 0)

const isMultiUser = computed(() =>
  currentAction.value === OperationButtonType.COPY
  || currentAction.value === OperationButtonType.ADD_SIGN,
)

const needUser = computed(() =>
  currentAction.value === OperationButtonType.TRANSFER
  || currentAction.value === OperationButtonType.DELEGATE
  || currentAction.value === OperationButtonType.COPY
  || currentAction.value === OperationButtonType.ADD_SIGN,
)

const needSignType = computed(() => currentAction.value === OperationButtonType.ADD_SIGN)
const needDeleteSign = computed(() => currentAction.value === 'deleteSign')
const needReturnNode = computed(() => currentAction.value === OperationButtonType.RETURN)
const needHandSign = computed(() =>
  currentAction.value === OperationButtonType.APPROVE && !!todoTask.value?.signEnable,
)

const userLabel = computed(() => {
  if (currentAction.value === OperationButtonType.COPY)
    return '抄送人'
  if (currentAction.value === OperationButtonType.ADD_SIGN)
    return '加签处理人'
  if (currentAction.value === OperationButtonType.DELEGATE)
    return '接收人'
  if (currentAction.value === OperationButtonType.TRANSFER)
    return '新审批人'
  return '选择用户'
})

const deleteSignOptions = computed(() =>
  childTasks.value.map((t: any) => ({
    label: getDeleteSignUserLabel(t),
    value: t.id,
  })),
)

function hasSelectedUser() {
  if (Array.isArray(targetUserId.value))
    return targetUserId.value.length > 0
  return targetUserId.value != null
}

function resolveUserIds(): number[] {
  if (Array.isArray(targetUserId.value))
    return targetUserId.value.map(Number)
  if (targetUserId.value != null)
    return [Number(targetUserId.value)]
  return []
}

function getDeleteSignUserLabel(task: any): string {
  const nickname = task?.assigneeUser?.nickname || task?.ownerUser?.nickname || task?.assigneeUserNickname || '未知'
  const deptName = task?.assigneeUser?.deptName || task?.ownerUser?.deptName
  return deptName ? `${nickname}（所属部门：${deptName}）` : nickname
}

function buttonType(id: number): 'default' | 'primary' | 'error' | 'warning' | 'info' {
  if (id === OperationButtonType.APPROVE)
    return 'primary'
  if (id === OperationButtonType.REJECT)
    return 'error'
  if (id === OperationButtonType.RETURN)
    return 'warning'
  return 'default'
}

function onSignSuccess(url: string) {
  signPicUrl.value = url
}

function onNextAssigneeChange(nodeId: string, value: number | number[] | null) {
  const ids = Array.isArray(value)
    ? value.map(Number)
    : value != null
      ? [Number(value)]
      : []
  nextAssignees.value = { ...nextAssignees.value, [nodeId]: ids }
}

async function loadChildTasks(taskId?: string) {
  if (!taskId) {
    childTasks.value = []
    return
  }
  try {
    const list = await getChildrenTaskList(taskId) as any[]
    childTasks.value = Array.isArray(list) ? list : []
  }
  catch {
    childTasks.value = Array.isArray(todoTask.value?.children) ? todoTask.value.children : []
  }
}

function loadTodoTask(task: any) {
  todoTask.value = task || null
  childTasks.value = Array.isArray(task?.children) ? task.children : []
  if (task?.id)
    loadChildTasks(task.id)
}

function getMergedVariables() {
  return {
    ...(props.getWritableVariables?.() || {}),
    ...(approveFormRef.value?.getValues?.() || {}),
  }
}

async function validateApproveForm() {
  if (!hasApproveForm.value)
    return true
  try {
    await approveFormRef.value?.validate?.()
    return true
  }
  catch {
    message.warning('办理子表单校验不通过，请先完善')
    return false
  }
}

async function loadNextAssignees() {
  nextAssigneeNodes.value = []
  nextAssignees.value = {}
  try {
    const variables = getMergedVariables()
    const data = await getNextApprovalNodes({
      processInstanceId: props.processInstanceId,
      taskId: todoTask.value.id,
      processVariablesStr: JSON.stringify(variables),
    }) as any[]
    const nodes = (data || []).filter((node: any) => {
      const needSelect = CandidateStrategy.APPROVE_USER_SELECT === node.candidateStrategy
        || (
          CandidateStrategy.START_USER_SELECT === node.candidateStrategy
          && !(node.tasks || []).length
          && !(node.candidateUsers || []).length
        )
      return needSelect
    })
    nextAssigneeNodes.value = nodes
    for (const node of nodes) {
      const preset = (node.candidateUsers || []).map((u: any) => Number(u.id)).filter(Boolean)
      nextAssignees.value[node.id] = preset
    }
  }
  catch {
    nextAssigneeNodes.value = []
  }
}

async function openAction(id: number) {
  currentAction.value = id
  reason.value = ''
  targetUserId.value = id === OperationButtonType.COPY || id === OperationButtonType.ADD_SIGN ? [] : null
  returnNodeKey.value = null
  signType.value = 'before'
  deleteSignTaskId.value = null
  signPicUrl.value = ''
  nextAssigneeNodes.value = []
  nextAssignees.value = {}
  reasonTitle.value = enabledButtons.value.find((b: any) => b.id === id)?.displayName || '操作'

  if (id === OperationButtonType.APPROVE || id === OperationButtonType.REJECT) {
    try {
      if (props.validateForm)
        await props.validateForm()
    }
    catch {
      message.warning('表单校验不通过，请先完善表单')
      return
    }
  }

  if (id === OperationButtonType.RETURN) {
    const list = await getTaskListByReturn(todoTask.value.id) as any[]
    returnNodeOptions.value = (list || []).map((n: any) => ({
      label: n.name,
      value: n.taskDefinitionKey || n.id,
    }))
    if (!returnNodeOptions.value.length) {
      message.warning('当前没有可退回的节点')
      return
    }
  }

  reasonVisible.value = true
  if (id === OperationButtonType.APPROVE) {
    await nextTick()
    await loadNextAssignees()
  }
}

async function openDeleteSign() {
  await loadChildTasks(todoTask.value?.id)
  if (!childTasks.value.length) {
    message.warning('当前没有可减签的人员')
    return
  }
  currentAction.value = 'deleteSign'
  reasonTitle.value = '减签'
  reason.value = ''
  deleteSignTaskId.value = null
  reasonVisible.value = true
}

function openCancel() {
  currentAction.value = 'cancel'
  reasonTitle.value = '取消流程'
  reason.value = ''
  reasonVisible.value = true
}

function validateNextAssignees() {
  for (const node of nextAssigneeNodes.value) {
    if (!nextAssignees.value[node.id]?.length) {
      message.warning(`请选择「${node.name}」的审批人`)
      return false
    }
  }
  return true
}

async function submitReason() {
  if (currentAction.value === 'cancel')
    return await submitCancel()

  if (!todoTask.value?.id)
    return false
  if (needUser.value && !hasSelectedUser()) {
    message.warning(`请选择${userLabel.value}`)
    return false
  }
  if (needReturnNode.value && !returnNodeKey.value) {
    message.warning('请选择退回节点')
    return false
  }
  if (needDeleteSign.value && !deleteSignTaskId.value) {
    message.warning('请选择减签人员')
    return false
  }
  if (needHandSign.value && !signPicUrl.value) {
    message.warning('请完成签名')
    return false
  }
  if (currentAction.value === OperationButtonType.APPROVE && !validateNextAssignees())
    return false
  if (currentAction.value === OperationButtonType.APPROVE && !(await validateApproveForm()))
    return false

  submitting.value = true
  try {
    const id = todoTask.value?.id
    const payload: any = { id, reason: reason.value }
    const userIds = resolveUserIds()
    switch (currentAction.value) {
      case OperationButtonType.APPROVE: {
        if (props.validateForm)
          await props.validateForm()
        const variables = getMergedVariables()
        await approveTask({
          ...payload,
          variables,
          nextAssignees: nextAssignees.value,
          ...(needHandSign.value ? { signPicUrl: signPicUrl.value } : {}),
        })
        message.success('审批通过')
        break
      }
      case OperationButtonType.REJECT:
        await rejectTask(payload)
        message.success('已拒绝')
        break
      case OperationButtonType.RETURN:
        await returnTask({ ...payload, targetTaskDefinitionKey: returnNodeKey.value })
        message.success('已退回')
        break
      case OperationButtonType.DELEGATE:
        await delegateTask({ ...payload, delegateUserId: userIds[0] })
        message.success('已委派')
        break
      case OperationButtonType.TRANSFER:
        await transferTask({ ...payload, assigneeUserId: userIds[0] })
        message.success('已转办')
        break
      case OperationButtonType.COPY:
        await copyTask({
          ...payload,
          copyUserIds: userIds,
        })
        message.success('已抄送')
        break
      case OperationButtonType.ADD_SIGN:
        await signCreateTask({
          ...payload,
          type: signType.value,
          userIds,
        })
        message.success('加签成功')
        break
      case 'deleteSign':
        await signDeleteTask({
          id: deleteSignTaskId.value,
          reason: reason.value,
        })
        message.success('减签成功')
        break
      default:
        message.warning('暂不支持该操作')
        return false
    }
    emit('success')
    return true
  }
  catch (e: any) {
    message.error(e?.message || '操作失败')
    return false
  }
  finally {
    submitting.value = false
  }
}

async function submitCancel() {
  if (!reason.value.trim()) {
    message.warning('请输入取消原因')
    return false
  }
  submitting.value = true
  try {
    await cancelProcessInstanceByStartUser(props.processInstanceId, reason.value)
    message.success('已取消')
    emit('success')
    return true
  }
  catch (e: any) {
    message.error(e?.message || '取消失败')
    return false
  }
  finally {
    submitting.value = false
  }
}

defineExpose({ loadTodoTask })
</script>

<style scoped>
.bpm-ops {
  padding: 12px 0;
}
.bpm-ops__sign-preview {
  width: 90px;
  height: 40px;
  object-fit: contain;
  border: 1px solid var(--n-border-color);
  border-radius: 4px;
  background: #fff;
}
.bpm-ops__approve-form {
  margin-bottom: 12px;
}
</style>
