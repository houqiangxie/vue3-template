<template>
  <div v-loading="loading" class="bpm-leave-detail">
    <n-descriptions v-if="leave" :column="2" label-placement="left" bordered size="small">
      <n-descriptions-item label="请假类型">
        {{ typeLabel }}
      </n-descriptions-item>
      <n-descriptions-item label="审批结果">
        {{ statusLabel }}
      </n-descriptions-item>
      <n-descriptions-item label="开始时间">
        {{ leave.startTime || '-' }}
      </n-descriptions-item>
      <n-descriptions-item label="结束时间">
        {{ leave.endTime || '-' }}
      </n-descriptions-item>
      <n-descriptions-item label="请假原因" :span="2">
        {{ leave.reason || '-' }}
      </n-descriptions-item>
      <n-descriptions-item label="流程编号" :span="2">
        {{ leave.processInstanceId || '-' }}
      </n-descriptions-item>
      <n-descriptions-item label="申请时间" :span="2">
        {{ leave.createTime || '-' }}
      </n-descriptions-item>
    </n-descriptions>
    <n-empty v-else-if="!loading" description="未找到请假单" />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { getLeave } from '@/api/bpm/leave'
import { leaveTypeOptions } from '../../constants'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'

defineOptions({ name: 'Bpm-LeaveDetail' })

const props = defineProps<{
  /** 业务主键 / 请假单 id（流程详情嵌入时传入） */
  id?: string | number
}>()

const route = useRoute()
const message = useMessage()
const loading = ref(false)
const leave = ref<any>(null)

const typeLabel = computed(() => {
  const hit = leaveTypeOptions.find(o => o.value === leave.value?.type)
  return hit?.label || leave.value?.type || '-'
})

const statusLabel = computed(() =>
  getDictLabel(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, leave.value?.status) || '-',
)

async function load() {
  const bizId = props.id ?? route.query.id
  if (bizId == null || bizId === '') {
    leave.value = null
    return
  }
  loading.value = true
  try {
    leave.value = await getLeave(String(bizId))
  }
  catch (e: any) {
    leave.value = null
    message.error(e?.message || '加载请假详情失败')
  }
  finally {
    loading.value = false
  }
}

watch(() => [props.id, route.query.id], load, { immediate: true })
</script>
