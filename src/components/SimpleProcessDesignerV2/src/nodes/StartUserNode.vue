<template>
  <div class="node-wrapper">
    <div class="node-container">
      <div
        class="node-box"
        :class="[
          { 'node-config-error': !currentNode.showText },
          `${useTaskStatusClass(currentNode?.activityStatus)}`,
        ]"
      >
        <div class="node-title-container">
          <div class="node-title-icon start-user"><span class="iconfont icon-start-user"></span></div>
          <input
            v-if="!readonly && showInput"
            type="text"
            class="editable-title-input"
            v-mountedFocus
            v-model="currentNode.name"
            :placeholder="currentNode.name"
            @blur="blurEvent()"
          />
          <div v-else class="node-title" @click="clickTitle">
            {{ currentNode.name }}
          </div>
        </div>
        <div class="node-content" @click="nodeClick">
          <div class="node-text" :title="currentNode.showText" v-if="currentNode.showText">
            {{ currentNode.showText }}
          </div>
          <div class="node-text" v-else>
            {{ NODE_DEFAULT_TEXT.get(NodeType.START_USER_NODE) }}
          </div>
          <Icon icon="ep:arrow-right-bold" v-if="!readonly" />
        </div>
      </div>
      <NodeHandler
        v-if="currentNode"
        v-model:child-node="currentNode.childNode"
        :current-node="currentNode"
      />
    </div>
  </div>
  <StartUserNodeConfig v-if="!readonly && currentNode" ref="nodeSetting" :flow-node="currentNode" />
  <Dialog
    v-model="dialogVisible"
    :title="dialogTitle || '审批记录'"
    width="1000px"
    :scroll="true"
  >
    <CommonTable
      :data="selectTasks"
      :fields="taskTableFields"
      :show-pagination="false"
      :csv-export="false"
      :flex-height="false"
      show-index
      :table-props="{ size: 'small', bordered: true }"
    />
  </Dialog>
</template>

<script setup lang="ts">
import { h } from 'vue'
import NodeHandler from '../NodeHandler.vue'
import { useWatchNode, useNodeName2, useTaskStatusClass } from '../node'
import { SimpleFlowNode, NODE_DEFAULT_TEXT, NodeType } from '../consts'
import StartUserNodeConfig from '../nodes-config/StartUserNodeConfig.vue'
import { formatDate, formatPast2 } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import DictTag from '@/components/bpm/DictTag.vue'
import { Dialog } from '@/components/Dialog'
import { defineFields } from '@/utils/schema'

defineOptions({ name: 'StartEventNode' })

const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    default: () => null,
  },
})

const readonly = inject<Boolean>('readonly')
const tasks = inject<Ref<any[]>>('tasks', ref([]))
defineEmits<{ 'update:modelValue': [node: SimpleFlowNode | undefined] }>()

const currentNode = useWatchNode(props)
const { showInput, blurEvent, clickTitle } = useNodeName2(currentNode, NodeType.START_USER_NODE)
const nodeSetting = ref()
const dialogVisible = ref(false)
const dialogTitle = ref<string | undefined>()
const selectTasks = ref<any[]>([])

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

function nodeClick() {
  if (readonly) {
    if (tasks?.value) {
      dialogTitle.value = currentNode.value.name
      selectTasks.value = tasks.value.filter(
        (item: any) => item?.taskDefinitionKey === currentNode.value.id,
      )
      dialogVisible.value = true
    }
  }
  else {
    nodeSetting.value.showStartUserNodeConfig(currentNode.value)
    nodeSetting.value.openDrawer()
  }
}
</script>

<style lang="scss" scoped></style>
