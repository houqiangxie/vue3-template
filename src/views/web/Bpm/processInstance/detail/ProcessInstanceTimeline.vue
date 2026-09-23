<template>
  <n-timeline>
    <n-timeline-item
      v-for="(node, index) in nodes"
      :key="`${node.id}-${index}`"
      :type="statusType(node.status)"
      :title="node.name"
    >
      <template #header>
        <div class="bpm-timeline__header">
          <span class="bpm-timeline__name">
            {{ node.name }}
            <span v-if="node.status === TaskStatusEnum.SKIP">【跳过】</span>
          </span>
          <n-tag size="small" :type="statusType(node.status)" :bordered="false">
            {{ statusLabel(node.status) }}
          </n-tag>
        </div>
      </template>
      <div class="bpm-timeline__body">
        <div v-if="node.startTime || node.endTime || nodeDuration(node)" class="bpm-timeline__time">
          <span v-if="node.startTime">开始：{{ node.startTime }}</span>
          <span v-if="node.endTime">结束：{{ node.endTime }}</span>
          <span v-if="nodeDuration(node)">耗时：{{ nodeDuration(node) }}</span>
        </div>

        <div v-if="node.nodeType === NodeType.CHILD_PROCESS_NODE" class="bpm-timeline__child">
          <n-button
            size="tiny"
            type="primary"
            secondary
            :disabled="!node.processInstanceId"
            @click="handleChildProcess(node)"
          >
            查看子流程
          </n-button>
        </div>

        <!-- 自选审批人 -->
        <div v-if="needSelectUser(node)" class="bpm-timeline__select">
          <UserSelect
            :value="(customApproveUsers[node.id] || []).map((u: any) => u.id)"
            multiple
            :placeholder="`选择「${node.name}」审批人`"
            @update:value="(v) => onSelectUsers(node.id, v)"
          />
        </div>

        <template v-else>
          <div v-for="task in (node.tasks || [])" :key="task.id" class="bpm-timeline__task">
            <n-avatar round size="small" :style="{ background: 'var(--n-primary-color)' }">
              {{ (task.assigneeUser?.nickname || task.ownerUser?.nickname || '?').slice(0, 1) }}
            </n-avatar>
            <div class="bpm-timeline__task-info">
              <div>{{ task.assigneeUser?.nickname || task.ownerUser?.nickname || '未分配' }}</div>
              <div v-if="task.reason" class="bpm-timeline__reason">意见：{{ task.reason }}</div>
              <n-image
                v-if="task.signPicUrl"
                :src="task.signPicUrl"
                width="90"
                height="40"
                object-fit="contain"
                class="bpm-timeline__sign"
              />
            </div>
          </div>
          <div
            v-if="!(node.tasks || []).length && (node.candidateUsers || []).length"
            class="bpm-timeline__candidates"
          >
            <div
              v-for="user in node.candidateUsers"
              :key="user.id"
              class="bpm-timeline__chip"
            >
              <n-avatar round size="small" :style="{ background: 'var(--n-primary-color)' }">
                {{ (user.nickname || '?').slice(0, 1) }}
              </n-avatar>
              {{ user.nickname }}
            </div>
          </div>
        </template>
      </div>
    </n-timeline-item>
  </n-timeline>
</template>

<script setup lang="ts">
import type { ApprovalNodeInfo } from '@/api/bpm/processInstance'
import { TaskStatusEnum } from '@/api/bpm/task'
import {
  CandidateStrategy,
  NodeType,
} from '@/components/SimpleProcessDesignerV2/src/consts'
import UserSelect from '@/components/common/UserSelect.vue'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { formatPast2 } from '@/utils/formatTime'
import { pushBpmProcessDetail } from '@/views/web/Bpm/routeNames'
import { getSimpleUserList } from '@/api/system/user'

defineOptions({ name: 'ProcessInstanceTimeline' })

const props = withDefaults(defineProps<{
  nodes: ApprovalNodeInfo[]
  enableApproveUserSelect?: boolean
}>(), {
  enableApproveUserSelect: false,
})

const emit = defineEmits<{
  selectUserConfirm: [id: string, userList: any[]]
}>()

const router = useRouter()
const customApproveUsers = ref<Record<string, any[]>>({})
const userCache = ref<Map<number, any>>(new Map())

function statusLabel(status?: number) {
  return getDictLabel(DICT_TYPE.BPM_TASK_STATUS, status ?? TaskStatusEnum.NOT_START)
}

function nodeDuration(node: ApprovalNodeInfo & { durationInMillis?: number }) {
  if (node.durationInMillis != null && Number(node.durationInMillis) > 0)
    return formatPast2(node.durationInMillis)
  if (node.startTime && node.endTime) {
    const start = Date.parse(String(node.startTime).replace(/-/g, '/'))
    const end = Date.parse(String(node.endTime).replace(/-/g, '/'))
    if (Number.isFinite(start) && Number.isFinite(end) && end > start)
      return formatPast2(end - start)
  }
  return ''
}

function statusType(status?: number): 'default' | 'info' | 'success' | 'warning' | 'error' {
  switch (status) {
    case TaskStatusEnum.APPROVE:
      return 'success'
    case TaskStatusEnum.REJECT:
    case TaskStatusEnum.CANCEL:
      return 'error'
    case TaskStatusEnum.RUNNING:
    case TaskStatusEnum.WAIT:
    case TaskStatusEnum.APPROVING:
      return 'info'
    case TaskStatusEnum.RETURN:
      return 'warning'
    default:
      return 'default'
  }
}

function isEmpty(val: unknown) {
  return !Array.isArray(val) || val.length === 0
}

function needSelectUser(node: ApprovalNodeInfo) {
  if (!isEmpty(node.tasks))
    return false
  if (
    CandidateStrategy.START_USER_SELECT === node.candidateStrategy
    && isEmpty(node.candidateUsers)
  ) {
    return true
  }
  return props.enableApproveUserSelect
    && CandidateStrategy.APPROVE_USER_SELECT === node.candidateStrategy
}

async function ensureUserCache() {
  if (userCache.value.size)
    return
  try {
    const list = await getSimpleUserList()
    const map = new Map<number, any>()
    for (const u of list || [])
      map.set(Number(u.id), u)
    userCache.value = map
  }
  catch {
    // ignore
  }
}

async function onSelectUsers(nodeId: string, value: number | number[] | null) {
  await ensureUserCache()
  const ids = Array.isArray(value)
    ? value.map(Number)
    : value != null
      ? [Number(value)]
      : []
  const users = ids.map((id) => {
    const cached = userCache.value.get(id)
    return cached
      ? { id, nickname: cached.nickname || cached.name || String(id), avatar: cached.avatar }
      : { id, nickname: `用户${id}` }
  })
  customApproveUsers.value = { ...customApproveUsers.value, [nodeId]: users }
  emit('selectUserConfirm', nodeId, users)
}

function handleChildProcess(node: any) {
  if (!node.processInstanceId)
    return
  pushBpmProcessDetail(router, { id: String(node.processInstanceId) })
}

function setCustomApproveUsers(activityId: string, users: any[]) {
  customApproveUsers.value = {
    ...customApproveUsers.value,
    [activityId]: users || [],
  }
}

function batchSetCustomApproveUsers(data: Record<string, any[]>) {
  customApproveUsers.value = {
    ...customApproveUsers.value,
    ...Object.fromEntries(
      Object.keys(data || {}).map(id => [id, data[id] || []]),
    ),
  }
}

defineExpose({ setCustomApproveUsers, batchSetCustomApproveUsers })
</script>

<style scoped>
.bpm-timeline__header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bpm-timeline__name {
  font-weight: 600;
}
.bpm-timeline__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0 12px;
  color: var(--n-text-color-2);
  font-size: 13px;
}
.bpm-timeline__time {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  opacity: 0.8;
}
.bpm-timeline__task {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.bpm-timeline__task-info {
  line-height: 1.4;
}
.bpm-timeline__reason {
  margin-top: 2px;
  color: var(--n-text-color-3);
}
.bpm-timeline__sign {
  margin-top: 6px;
  border: 1px solid var(--n-border-color);
  border-radius: 4px;
  background: #fff;
}
.bpm-timeline__candidates {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.bpm-timeline__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px 2px 2px;
  border-radius: 999px;
  background: var(--n-color-embedded, #f5f5f5);
}
.bpm-timeline__select {
  max-width: 100%;
}
.bpm-timeline__child {
  margin: 2px 0;
}
</style>
