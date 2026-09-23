<template>
  <div class="node-wrapper">
    <div class="node-container">
      <div class="node-box" :class="[
        { 'node-config-error': !currentNode.showText },
        `${useTaskStatusClass(currentNode?.activityStatus)}`
      ]">
        <div class="node-title-container">
          <div
            :class="`node-title-icon ${currentNode.type === NodeType.TRANSACTOR_NODE ? 'transactor-task' : 'user-task'}`">
            <span
              :class="`iconfont ${currentNode.type === NodeType.TRANSACTOR_NODE ? 'icon-transactor' : 'icon-approve'}`">
            </span>
          </div>
          <input v-if="!readonly && showInput" type="text" class="editable-title-input" @blur="blurEvent()"
            v-mountedFocus v-model="currentNode.name" :placeholder="currentNode.name" />
          <div v-else class="node-title" @click="clickTitle">
            {{ currentNode.name }}
          </div>
        </div>
        <div class="node-content" @click="nodeClick">
          <div class="node-text" :title="currentNode.showText" v-if="currentNode.showText">
            {{ currentNode.showText }}
          </div>
          <div class="node-text" v-else>
            {{ NODE_DEFAULT_TEXT.get(currentNode.type) }}
          </div>
          <Icon icon="ep:arrow-right-bold" v-if="!readonly" />
        </div>
        <div v-if="!readonly" class="node-toolbar">
          <div class="toolbar-icon">
            <Icon color="#0089ff" icon="ep:circle-close-filled" :size="18" @click="deleteNode" />
          </div>
        </div>
      </div>
      <!-- 传递子节点给添加节点组件。会在子节点前面添加节点 -->
      <NodeHandler v-if="currentNode" v-model:child-node="currentNode.childNode" :current-node="currentNode" />
    </div>
  </div>
  <UserTaskNodeConfig v-if="currentNode" ref="nodeSetting" :flow-node="currentNode"
    @find:return-task-nodes="findReturnTaskNodes" />
  <!-- 审批记录 -->
  <Dialog
    v-model="dialogVisible"
    :title="dialogTitle || '审批记录'"
    width="1000px"
    :scroll="true"
  >
    <CommonTable
      :data="selectTasks || []"
      :fields="taskTableFields"
      :show-pagination="false"
      :csv-export="false"
      :flex-height="false"
      show-index
      :table-props="{ size: 'small', bordered: true, singleLine: false }"
    />
  </Dialog>
</template>
<script setup lang="ts">
import { h } from 'vue'
import { SimpleFlowNode, NodeType, NODE_DEFAULT_TEXT } from '../consts'
import { useWatchNode, useNodeName2, useTaskStatusClass } from '../node'
import NodeHandler from '../NodeHandler.vue'
import UserTaskNodeConfig from '../nodes-config/UserTaskNodeConfig.vue'
import DictTag from '@/components/bpm/DictTag.vue'
import { Dialog } from '@/components/Dialog'
import { formatDate, formatPast2 } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { defineFields } from '@/utils/schema'

defineOptions({
  name: 'UserTaskNode',
})
const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true,
  },
})
const emits = defineEmits<{
  'update:flowNode': [node: SimpleFlowNode | undefined]
  'find:parentNode': [nodeList: SimpleFlowNode[], nodeType: NodeType]
}>()

const readonly = inject<Boolean>('readonly')
const tasks = inject<Ref<any[]>>('tasks', ref([]))
const currentNode = useWatchNode(props)
const { showInput, blurEvent, clickTitle } = useNodeName2(currentNode, NodeType.START_USER_NODE)
const nodeSetting = ref()

const nodeClick = () => {
  if (readonly) {
    if (tasks && tasks.value) {
      dialogTitle.value = currentNode.value.name
      selectTasks.value = tasks.value.filter(
        (item: any) => item?.taskDefinitionKey === currentNode.value.id,
      )
      dialogVisible.value = true
    }
  }
  else {
    nodeSetting.value.showUserTaskNodeConfig(currentNode.value)
    nodeSetting.value.openDrawer()
  }
}

const deleteNode = () => {
  emits('update:flowNode', currentNode.value.childNode)
}

const findReturnTaskNodes = (
  matchNodeList: SimpleFlowNode[],
) => {
  emits('find:parentNode', matchNodeList, NodeType.USER_TASK_NODE)
}

const dialogVisible = ref(false)
const dialogTitle = ref<string | undefined>(undefined)
const selectTasks = ref<any[] | undefined>([])

const taskTableFields = defineFields([
  {
    key: 'assignee',
    label: '审批人',
    form: false,
    search: false,
    table: {
      minWidth: 100,
      align: 'center',
      render: (row: any) => row.assigneeUser?.name || row.ownerUser?.name || '',
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
  {
    key: 'reason',
    label: '审批建议',
    form: false,
    search: false,
    table: { minWidth: 120, align: 'center' },
  },
  {
    key: 'durationInMillis',
    label: '耗时',
    form: false,
    search: false,
    table: {
      width: 100,
      align: 'center',
      render: (row: any) => formatPast2(row.durationInMillis),
    },
  },
])
</script>
<style lang="scss" scoped></style>
