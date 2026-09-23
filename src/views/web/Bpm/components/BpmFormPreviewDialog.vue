<template>
  <n-modal
    v-model:show="visible"
    preset="card"
    :title="title"
    :bordered="false"
    style="width: 800px; max-width: 92vw"
    :segmented="{ content: true }"
  >
    <n-spin :show="loading">
      <BpmProcessForm
        v-if="!loading && (formConf || formFields.length)"
        :form-conf="formConf"
        :form-fields="formFields"
        disabled
      />
      <n-empty v-else-if="!loading" description="暂无表单字段" />
    </n-spin>
  </n-modal>
</template>

<script setup lang="ts">
import { getForm } from '@/api/bpm/form'
import BpmProcessForm from '../processInstance/components/BpmProcessForm.vue'

defineOptions({ name: 'BpmFormPreviewDialog' })

const message = useMessage()

const visible = ref(false)
const loading = ref(false)
const title = ref('表单预览')
const formConf = ref<string | Record<string, any> | null>(null)
const formFields = ref<Array<string | Record<string, any>>>([])

/** 按表单 ID 拉取并预览 */
async function openByFormId(formId: number, dialogTitle = '表单预览') {
  if (!formId) {
    message.warning('未关联流程表单')
    return
  }
  title.value = dialogTitle
  visible.value = true
  loading.value = true
  formConf.value = null
  formFields.value = []
  try {
    const data = await getForm(formId) as any
    formConf.value = data?.conf ?? null
    formFields.value = Array.isArray(data?.fields) ? data.fields : []
    if (data?.name)
      title.value = `${dialogTitle} · ${data.name}`
  }
  catch (e: any) {
    if (!e?.shown)
      message.error(e?.message || '加载表单失败')
    visible.value = false
  }
  finally {
    loading.value = false
  }
}

/** 直接用已有 conf / fields 预览（定义历史等） */
function openWithConf(
  conf: string | Record<string, any> | null | undefined,
  fields: Array<string | Record<string, any>> | null | undefined,
  dialogTitle = '表单预览',
  formName?: string,
) {
  title.value = formName ? `${dialogTitle} · ${formName}` : dialogTitle
  formConf.value = conf ?? null
  formFields.value = Array.isArray(fields) ? fields : []
  loading.value = false
  visible.value = true
}

defineExpose({ openByFormId, openWithConf })
</script>
