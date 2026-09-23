<template>
  <n-form ref="formRef" :model="modelData" :rules="rules" label-width="120px" class="mt-20px">
    <n-form-item label="表单类型" path="formType" class="mb-20px">
      <n-radio-group v-model:value="modelData.formType">
        <n-radio
          v-for="dict in getIntDictOptions(DICT_TYPE.BPM_MODEL_FORM_TYPE)"
          :key="String(dict.value)"
          :value="dict.value"
        >
          {{ dict.label }}
        </n-radio>
      </n-radio-group>
    </n-form-item>
    <n-form-item v-if="modelData.formType === BpmModelFormType.NORMAL" label="流程表单" path="formId">
      <div class="flex items-center w-full" style="gap: 8px">
        <n-select
          v-model:value="modelData.formId"
          clearable
          style="flex: 1"
          :options="formOptions"
        />
        <n-button
          v-if="modelData.formId"
          quaternary
          type="primary"
          @click="goFormDesign"
        >
          设计表单
        </n-button>
        <n-button quaternary type="primary" @click="goFormManage">
          表单管理
        </n-button>
      </div>
    </n-form-item>
    <n-form-item
      v-if="modelData.formType === BpmModelFormType.CUSTOM"
      label="表单提交路由"
      path="formCustomCreatePath"
    >
      <div class="flex items-center">
        <n-input
          v-model:value="modelData.formCustomCreatePath"
          placeholder="如 /Bpm/oa/leave/create 或 bpm/oa/leave/create.vue"
          style="width: 330px"
        />
        <n-tooltip trigger="hover" placement="top">
          <template #trigger>
            <Icon icon="ep:question" class="ml-5px" />
          </template>
          自定义表单的提交路径：路由地址（如 /Bpm/oa/leave/create）或组件路径（如 bpm/oa/leave/create.vue）
        </n-tooltip>
      </div>
    </n-form-item>
    <n-form-item
      v-if="modelData.formType === BpmModelFormType.CUSTOM"
      label="表单查看地址"
      path="formCustomViewPath"
    >
      <div class="flex items-center">
        <n-input
          v-model:value="modelData.formCustomViewPath"
          placeholder="如 bpm/oa/leave/detail.vue"
          style="width: 330px"
        />
        <n-tooltip trigger="hover" placement="top">
          <template #trigger>
            <Icon icon="ep:question" class="ml-5px" />
          </template>
          自定义表单的查看组件地址，例如：bpm/oa/leave/detail.vue（将内嵌到流程详情）
        </n-tooltip>
      </div>
    </n-form-item>

    <div
      v-if="modelData.formType === BpmModelFormType.NORMAL && modelData.formId"
      class="mt-20px"
    >
      <div class="flex items-center mb-15px">
        <div class="h-15px w-4px bg-[#1890ff] mr-10px"></div>
        <span class="text-15px font-bold">表单预览</span>
      </div>

      <CommonForm
        v-if="builderPreviewFields.length"
        v-model:form-model="previewModel"
        :fields="builderPreviewFields"
        :cols="previewFormCols"
        :label-width="100"
      />
      <n-space v-else-if="previewFields.length" vertical>
        <n-tag v-for="(f, idx) in previewFields" :key="idx" type="info" :bordered="false">
          {{ f.title || f.field || `字段 ${idx + 1}` }}
          <span v-if="f.required" class="text-red-500">*</span>
        </n-tag>
      </n-space>
      <n-empty v-else description="该表单暂无字段，请先点击「设计表单」" />
    </div>
  </n-form>
</template>

<script lang="ts" setup>
import type { FormInst, FormRules } from 'naive-ui'
import { useRouter } from 'vue-router'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as FormApi from '@/api/bpm/form'
import { parseFormFields } from '@/components/FormCreate/src/utils'
import {
  isFormBuilderConf,
  listBpmFormFieldMeta,
  unpackBpmForm,
} from '@/components/FormCreate/src/bpmFormBuilder'
import { getRuntimeField } from '@/components/common/FormBuilder/compile'
import { BpmModelFormType } from '@/utils/constants'
import { Icon } from '@/components/Icon'
import { resolveBpmRouteName } from '@/views/web/Bpm/routeNames'

const props = defineProps({
  formList: {
    type: Array,
    required: true
  }
})

const router = useRouter()
const formRef = ref<FormInst | null>(null)

const formOptions = computed(() =>
  (props.formList as Array<{ id: number | string; name: string }>).map((form) => ({
    label: form.name,
    value: form.id
  }))
)

const modelData = defineModel<any>()

const previewModel = ref<Record<string, unknown>>({})
const previewFormCols = ref(2)
const builderPreviewFields = ref<any[]>([])
const previewFields = ref<Array<Record<string, any>>>([])

async function loadFormPreview(formId: number | string) {
  builderPreviewFields.value = []
  previewFields.value = []
  previewModel.value = {}
  if (!formId)
    return
  const data = await FormApi.getForm(formId) as FormApi.FormVO
  if (isFormBuilderConf(data.conf) || (data.fields || []).some((f) => {
    try {
      const obj = typeof f === 'string' ? JSON.parse(f) : f
      return !!(obj?.key || obj?.component)
    }
    catch {
      return false
    }
  })) {
    const unpacked = unpackBpmForm(data.conf, data.fields)
    previewFormCols.value = unpacked.formCols
    builderPreviewFields.value = unpacked.fields
      .map(f => getRuntimeField(f))
      .filter(f => f.form !== false)
    previewFields.value = listBpmFormFieldMeta(data.fields)
  }
  else {
    const fields: Array<Record<string, any>> = []
    ;(data.fields || []).forEach((fieldStr: string) => {
      try {
        parseFormFields(JSON.parse(fieldStr), fields)
      }
      catch {
        // ignore
      }
    })
    previewFields.value = fields
  }
}

watch(
  () => modelData.value.formId,
  async (newFormId) => {
    if (newFormId && modelData.value.formType === BpmModelFormType.NORMAL)
      await loadFormPreview(newFormId)
    else {
      builderPreviewFields.value = []
      previewFields.value = []
    }
  },
  { immediate: true }
)

const rules = computed<FormRules>(() => {
  const base: FormRules = {
    formType: [{ required: true, message: '表单类型不能为空', trigger: ['blur', 'change'] }]
  }
  if (modelData.value?.formType === BpmModelFormType.NORMAL) {
    base.formId = [{ required: true, message: '流程表单不能为空', trigger: ['blur', 'change'] }]
  } else if (modelData.value?.formType === BpmModelFormType.CUSTOM) {
    base.formCustomCreatePath = [
      { required: true, message: '表单提交路由不能为空', trigger: ['blur', 'input'] }
    ]
    base.formCustomViewPath = [
      { required: true, message: '表单查看地址不能为空', trigger: ['blur', 'input'] }
    ]
  }
  return base
})

const validate = async () => {
  await formRef.value?.validate()
}

function goFormManage() {
  router.push({ name: resolveBpmRouteName(router, 'Bpm-Form', 'BpmForm') })
}

function goFormDesign() {
  const id = modelData.value.formId
  if (!id)
    return
  const idStr = String(id)
  if (router.hasRoute('BpmFormDesign')) {
    router.push({ name: 'BpmFormDesign', params: { id: idStr }, query: { bpmFormId: idStr } })
    return
  }
  if (router.hasRoute('Tool-Build')) {
    router.push({ name: 'Tool-Build', query: { bpmFormId: idStr } })
    return
  }
  router.push({
    name: resolveBpmRouteName(router, 'Tool-Build', 'BpmFormDesign'),
    query: { bpmFormId: idStr },
    params: { id: idStr },
  })
}

defineExpose({
  validate
})
</script>
