<template>
  <div class="end-node-wrapper">
    <div class="end-node-box cursor-pointer" :class="`${useTaskStatusClass(currentNode?.activityStatus)}`"
      @click="nodeClick">
      <span class="node-fixed-name" title="结束">结束</span>
    </div>
  </div>
  <Dialog v-model="dialogVisible" title="审批信息" width="1000px" :scroll="true">
    <CommonTable
      :data="processInstanceInfos"
      :fields="tableFields"
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
import { SimpleFlowNode } from '../consts'
import { useWatchNode, useTaskStatusClass } from '../node'
import { formatDate, formatPast2 } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import DictTag from '@/components/bpm/DictTag.vue'
import { Dialog } from '@/components/Dialog'
import { defineFields } from '@/utils/schema'

defineOptions({ name: 'EndEventNode' })

const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    default: () => null,
  },
})

const currentNode = useWatchNode(props)
const readonly = inject<Boolean>('readonly')
const processInstance = inject<Ref<any>>('processInstance', ref({}))
const dialogVisible = ref(false)
const processInstanceInfos = ref<any[]>([])

const tableFields = defineFields([
  {
    key: 'assigneeUser.name',
    label: '发起人',
    form: false,
    search: false,
    table: {
      minWidth: 100,
      align: 'center',
      render: (row: any) => row.assigneeUser?.name || '',
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
        h(DictTag, { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, value: row.status }),
    },
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

const nodeClick = () => {
  if (readonly) {
    if (processInstance && processInstance.value) {
      processInstanceInfos.value = [
        {
          assigneeUser: processInstance.value.startUser,
          createTime: processInstance.value.startTime,
          endTime: processInstance.value.endTime,
          status: processInstance.value.status,
          durationInMillis: processInstance.value.durationInMillis,
        },
      ]
      dialogVisible.value = true
    }
  }
}
</script>
<style lang="scss" scoped></style>
