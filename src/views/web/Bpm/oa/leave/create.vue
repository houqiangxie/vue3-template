<template>
  <div class="bpm-leave-create">
    <n-card size="small" title="发起请假" :bordered="false">
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        label-width="90"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="请假类型" path="type">
          <n-select v-model:value="form.type" :options="leaveTypeOptions" style="width: 240px" />
        </n-form-item>
        <n-form-item label="开始时间" path="startTime">
          <n-date-picker
            v-model:formatted-value="form.startTime"
            type="datetime"
            value-format="yyyy-MM-dd HH:mm:ss"
            clearable
            style="width: 240px"
          />
        </n-form-item>
        <n-form-item label="结束时间" path="endTime">
          <n-date-picker
            v-model:formatted-value="form.endTime"
            type="datetime"
            value-format="yyyy-MM-dd HH:mm:ss"
            clearable
            style="width: 240px"
          />
        </n-form-item>
        <n-form-item label="请假原因" path="reason">
          <n-input v-model:value="form.reason" type="textarea" :rows="3" placeholder="请输入请假原因" />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" :loading="submitting" @click="handleSubmit">提交</n-button>
            <n-button @click="goBack">返回</n-button>
          </n-space>
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import type { FormInst, FormRules } from 'naive-ui'
import { useRouter } from 'vue-router'
import { createLeave, getLeave, type LeaveVO } from '@/api/bpm/leave'
import { leaveTypeOptions } from '../../constants'
import { pushBpmProcessDetail, resolveBpmRouteName } from '../../routeNames'

defineOptions({ name: 'Bpm-LeaveCreate' })

const message = useMessage()
const router = useRouter()
const formRef = ref<FormInst | null>(null)
const submitting = ref(false)

const form = reactive({
  type: 1 as number,
  startTime: null as string | null,
  endTime: null as string | null,
  reason: '',
})

const rules: FormRules = {
  type: { required: true, type: 'number', message: '请选择请假类型', trigger: ['change'] },
  startTime: { required: true, message: '请选择开始时间', trigger: ['blur', 'change'] },
  endTime: { required: true, message: '请选择结束时间', trigger: ['blur', 'change'] },
  reason: { required: true, message: '请输入请假原因', trigger: ['blur', 'input'] },
}

function goBack() {
  if (window.history.length > 1)
    router.back()
  else {
    const name = resolveBpmRouteName(router, 'Bpm-Leave', 'BpmLeave')
    if (router.hasRoute(name))
      router.push({ name })
    else
      router.push({ path: '/Bpm/Leave' })
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  }
  catch {
    return
  }
  submitting.value = true
  try {
    const id = await createLeave({
      type: form.type,
      startTime: form.startTime!,
      endTime: form.endTime!,
      reason: form.reason,
    } as LeaveVO)
    message.success('发起成功')
    const leave = await getLeave(String(id)) as any
    if (leave?.processInstanceId) {
      await pushBpmProcessDetail(router, { id: String(leave.processInstanceId) })
      return
    }
    goBack()
  }
  catch (e: any) {
    message.error(e?.message || '发起失败')
  }
  finally {
    submitting.value = false
  }
}
</script>
