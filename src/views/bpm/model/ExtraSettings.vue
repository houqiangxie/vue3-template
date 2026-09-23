<template>
  <n-form ref="formRef" :model="modelData" label-width="130px" class="mt-20px">
    <n-form-item class="mb-20px">
      <template #label>
        <span size="large" tag="b">提交人权限</span>
      </template>
      <div class="flex flex-col">
        <n-checkbox v-model:checked="modelData.allowCancelRunningProcess">
          允许撤销审批中的申请
        </n-checkbox>
      </div>
    </n-form-item>
    <n-form-item class="mb-20px">
      <template #label>
        <span size="large" tag="b">审批人权限</span>
      </template>
      <div class="flex flex-col">
        <n-checkbox v-model:checked="modelData.allowWithdrawTask">
          允许审批人撤回任务
        </n-checkbox>
        <div class="ml-22px">
          <span type="info"> 审批人可撤回正在审批节点的前一节点 </span>
        </div>
      </div>
    </n-form-item>
    <n-form-item v-if="modelData.processIdRule" class="mb-20px">
      <template #label>
        <span size="large" tag="b">流程编码</span>
      </template>
      <div class="flex flex-col">
        <div>
          <n-input
            v-model:value="modelData.processIdRule.prefix"
            class="w-130px!"
            placeholder="前缀"
            :disabled="!modelData.processIdRule.enable"
          >
            <template #prefix>
              <n-checkbox v-model:checked="modelData.processIdRule.enable" />
            </template>
          </n-input>
          <n-select
            v-model:value="modelData.processIdRule.infix"
            class="w-130px! ml-5px"
            placeholder="中缀"
            :disabled="!modelData.processIdRule.enable"
           :options="timeOptions" />
          <n-input
            v-model:value="modelData.processIdRule.postfix"
            class="w-80px! ml-5px"
            placeholder="后缀"
            :disabled="!modelData.processIdRule.enable"
          />
          <n-input-number
            v-model:value="modelData.processIdRule.length"
            class="w-120px! ml-5px"
            :min="5"
            :disabled="!modelData.processIdRule.enable"
          />
        </div>
        <div class="ml-22px" v-if="modelData.processIdRule.enable">
          <span type="info"> 编码示例：{{ numberExample }} </span>
        </div>
      </div>
    </n-form-item>
    <n-form-item class="mb-20px">
      <template #label>
        <span size="large" tag="b">自动去重</span>
      </template>
      <div class="flex flex-col">
        <div>
          <span> 同一审批人在流程中重复出现时： </span>
        </div>
        <n-radio-group v-model:value="modelData.autoApprovalType">
          <div class="flex flex-col">
            <n-radio :value="0">不自动通过</n-radio>
            <n-radio :value="1">仅审批一次，后续重复的审批节点均自动通过</n-radio>
            <n-radio :value="2">仅针对连续审批的节点自动通过</n-radio>
          </div>
        </n-radio-group>
      </div>
    </n-form-item>
    <n-form-item v-if="modelData.titleSetting" class="mb-20px">
      <template #label>
        <span size="large" tag="b">标题设置</span>
      </template>
      <div class="flex flex-col">
        <n-radio-group v-model:value="modelData.titleSetting.enable">
          <div class="flex flex-col">
            <n-radio :value="false"
              >系统默认 <span type="info"> 展示流程名称 </span></n-radio
            >
            <n-radio :value="true">
              自定义标题
              <span>
                <n-tooltip content="输入字符 '{' 即可插入表单字段" placement="top">
<template #trigger>
                  <Icon icon="ep:question-filled" class="ml-5px" />
                </template>
</n-tooltip>
              </span>
            </n-radio>
          </div>
        </n-radio-group>
        <n-mention
          v-if="modelData.titleSetting.enable"
          v-model:value="modelData.titleSetting.title"
          type="textarea"
          prefix="{"
          :options="formFieldOptions4Title"
          placeholder="请插入表单字段（输入 '{' 可以选择表单字段）或输入文本"
          class="w-600px!"
        />
      </div>
    </n-form-item>
    <n-form-item
      v-if="modelData.summarySetting && modelData.formType === BpmModelFormType.NORMAL"
      class="mb-20px"
    >
      <template #label>
        <span size="large" tag="b">摘要设置</span>
      </template>
      <div class="flex flex-col">
        <n-radio-group v-model:value="modelData.summarySetting.enable">
          <div class="flex flex-col">
            <n-radio :value="false">
              系统默认 <span type="info"> 展示表单前 3 个字段 </span>
            </n-radio>
            <n-radio :value="true"> 自定义摘要 </n-radio>
          </div>
        </n-radio-group>
        <n-select
          class="w-500px!"
          v-if="modelData.summarySetting.enable"
          v-model:value="modelData.summarySetting.summary"
          multiple
          placeholder="请选择要展示的表单字段"
         :options="formFieldOptions4Summary" />
      </div>
    </n-form-item>
    <n-form-item class="mb-20px">
      <template #label>
        <span size="large" tag="b">流程前置通知</span>
      </template>
      <div class="flex flex-col w-100%">
        <div class="flex">
          <n-switch
            v-model:value="processBeforeTriggerEnable"
            @update:value="handleProcessBeforeTriggerEnableChange"
          />
          <div class="ml-80px">流程启动后通知</div>
        </div>
        <HttpRequestSetting
          v-if="processBeforeTriggerEnable"
          v-model:setting="modelData.processBeforeTriggerSetting"
          :responseEnable="true"
          :formItemPrefix="'processBeforeTriggerSetting'"
        />
      </div>
    </n-form-item>
    <n-form-item class="mb-20px">
      <template #label>
        <span size="large" tag="b">流程后置通知</span>
      </template>
      <div class="flex flex-col w-100%">
        <div class="flex">
          <n-switch
            v-model:value="processAfterTriggerEnable"
            @update:value="handleProcessAfterTriggerEnableChange"
          />
          <div class="ml-80px">流程结束后通知</div>
        </div>
        <HttpRequestSetting
          v-if="processAfterTriggerEnable"
          v-model:setting="modelData.processAfterTriggerSetting"
          :responseEnable="true"
          :formItemPrefix="'processAfterTriggerSetting'"
        />
      </div>
    </n-form-item>
    <n-form-item class="mb-20px">
      <template #label>
        <span size="large" tag="b">任务前置通知</span>
      </template>
      <div class="flex flex-col w-100%">
        <div class="flex">
          <n-switch
            v-model:value="taskBeforeTriggerEnable"
            @update:value="handleTaskBeforeTriggerEnableChange"
          />
          <div class="ml-80px">任务执行时通知</div>
        </div>
        <HttpRequestSetting
          v-if="taskBeforeTriggerEnable"
          v-model:setting="modelData.taskBeforeTriggerSetting"
          :responseEnable="true"
          :formItemPrefix="'taskBeforeTriggerSetting'"
        />
      </div>
    </n-form-item>
    <n-form-item class="mb-20px">
      <template #label>
        <span size="large" tag="b">任务后置通知</span>
      </template>
      <div class="flex flex-col w-100%">
        <div class="flex">
          <n-switch
            v-model:value="taskAfterTriggerEnable"
            @update:value="handleTaskAfterTriggerEnableChange"
          />
          <div class="ml-80px">任务结束后通知</div>
        </div>
        <HttpRequestSetting
          v-if="taskAfterTriggerEnable"
          v-model:setting="modelData.taskAfterTriggerSetting"
          :responseEnable="true"
          :formItemPrefix="'taskAfterTriggerSetting'"
        />
      </div>
    </n-form-item>
    <n-form-item class="mb-20px">
      <template #label>
        <span size="large" tag="b">自定义打印模板</span>
      </template>
      <div class="flex flex-col w-100%">
        <div v-if="modelData.printTemplateSetting" class="flex">
          <n-switch
            v-model:value="modelData.printTemplateSetting.enable"
            @update:value="handlePrintTemplateEnableChange"
          />
          <n-button
            v-if="modelData.printTemplateSetting.enable"
            class="ml-80px"
            type="primary"
            text
            @click="handleEditPrintTemplate"
          >
            编辑模板
          </n-button>
        </div>
      </div>
    </n-form-item>
  </n-form>
  <print-template ref="printTemplateRef" @confirm="confirmPrintTemplate" />
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { BpmAutoApproveType, BpmModelFormType } from '@/utils/constants'
import * as FormApi from '@/api/bpm/form'
import { parseFormFields } from '@/components/FormCreate/src/utils'
import { ProcessVariableEnum } from '@/components/SimpleProcessDesignerV2/src/consts'
import HttpRequestSetting from '@/components/SimpleProcessDesignerV2/src/nodes-config/components/HttpRequestSetting.vue'
import { Icon } from '@/components/Icon'
import PrintTemplate from './PrintTemplate/Index.vue'

const modelData = defineModel<any>()

/** 自定义 ID 流程编码 */
const timeOptions = ref([
  {
    value: '',
    label: '无'
  },
  {
    value: 'DAY',
    label: '精确到日'
  },
  {
    value: 'HOUR',
    label: '精确到时'
  },
  {
    value: 'MINUTE',
    label: '精确到分'
  },
  {
    value: 'SECOND',
    label: '精确到秒'
  }
])
const numberExample = computed(() => {
  const rule = modelData.value?.processIdRule
  if (!rule?.enable)
    return ''
  let infix = ''
  switch (rule.infix) {
    case 'DAY':
      infix = dayjs().format('YYYYMMDD')
      break
    case 'HOUR':
      infix = dayjs().format('YYYYMMDDHH')
      break
    case 'MINUTE':
      infix = dayjs().format('YYYYMMDDHHmm')
      break
    case 'SECOND':
      infix = dayjs().format('YYYYMMDDHHmmss')
      break
    default:
      break
  }
  return (
    (rule.prefix || '') +
    infix +
    (rule.postfix || '') +
    '1'.padStart((rule.length || 5) - 1, '0')
  )
})

/** 是否开启流程前置通知 */
const processBeforeTriggerEnable = ref(false)
const handleProcessBeforeTriggerEnableChange = (val: boolean | string | number) => {
  if (val) {
    modelData.value.processBeforeTriggerSetting = {
      url: '',
      header: [],
      body: [],
      response: []
    }
  } else {
    modelData.value.processBeforeTriggerSetting = null
  }
}

/** 是否开启流程后置通知 */
const processAfterTriggerEnable = ref(false)
const handleProcessAfterTriggerEnableChange = (val: boolean | string | number) => {
  if (val) {
    modelData.value.processAfterTriggerSetting = {
      url: '',
      header: [],
      body: [],
      response: []
    }
  } else {
    modelData.value.processAfterTriggerSetting = null
  }
}

/** 是否开启任务前置通知 */
const taskBeforeTriggerEnable = ref(false)
const handleTaskBeforeTriggerEnableChange = (val: boolean | string | number) => {
  if (val) {
    modelData.value.taskBeforeTriggerSetting = {
      url: '',
      header: [],
      body: [],
      response: []
    }
  } else {
    modelData.value.taskBeforeTriggerSetting = null
  }
}

/** 是否开启任务后置通知 */
const taskAfterTriggerEnable = ref(false)
const handleTaskAfterTriggerEnableChange = (val: boolean | string | number) => {
  if (val) {
    modelData.value.taskAfterTriggerSetting = {
      url: '',
      header: [],
      body: [],
      response: []
    }
  } else {
    modelData.value.taskAfterTriggerSetting = null
  }
}

/** 已解析表单字段 */
const formFields = ref<Array<{ field: string; title: string }>>([])
const formFieldOptions4Title = computed(() => {
  let cloneFormField = formFields.value.map((item) => {
    return {
      label: item.title,
      value: item.field
    }
  })
  // 固定添加发起人 ID 字段
  cloneFormField.unshift({
    label: '流程名称',
    value: ProcessVariableEnum.PROCESS_DEFINITION_NAME
  })
  cloneFormField.unshift({
    label: '发起时间',
    value: ProcessVariableEnum.START_TIME
  })
  cloneFormField.unshift({
    label: '发起人',
    value: ProcessVariableEnum.START_USER_ID
  })
  return cloneFormField
})
const formFieldOptions4Summary = computed(() => {
  return formFields.value.map((item) => {
    return {
      label: item.title,
      value: item.field
    }
  })
})

/** 未解析的表单字段 */
const unParsedFormFields = ref<string[]>([])
/** 暴露给子组件 HttpRequestSetting 使用 */
provide('formFields', unParsedFormFields)
provide('formFieldsObj', formFields)

/** 兼容以前未配置更多设置的流程 */
const initData = () => {
  if (!modelData.value)
    return
  if (!modelData.value.processIdRule) {
    modelData.value.processIdRule = {
      enable: false,
      prefix: '',
      infix: '',
      postfix: '',
      length: 5
    }
  }
  if (!modelData.value.autoApprovalType) {
    modelData.value.autoApprovalType = BpmAutoApproveType.NONE
  }
  if (!modelData.value.titleSetting) {
    modelData.value.titleSetting = {
      enable: false,
      title: ''
    }
  }
  if (!modelData.value.summarySetting) {
    modelData.value.summarySetting = {
      enable: false,
      summary: []
    }
  }
  processBeforeTriggerEnable.value = !!modelData.value.processBeforeTriggerSetting
  processAfterTriggerEnable.value = !!modelData.value.processAfterTriggerSetting
  taskBeforeTriggerEnable.value = !!modelData.value.taskBeforeTriggerSetting
  taskAfterTriggerEnable.value = !!modelData.value.taskAfterTriggerSetting
  if (modelData.value.allowWithdrawTask == null) {
    modelData.value.allowWithdrawTask = false
  }
  if (!modelData.value.printTemplateSetting) {
    modelData.value.printTemplateSetting = {
      enable: false
    }
  }
}
defineExpose({ initData })

/** 模型整体替换（编辑/复制加载）时补齐默认配置，避免访问 undefined.enable */
watch(
  () => modelData.value,
  () => initData(),
  { immediate: true },
)

/** 监听表单 ID 变化，加载表单数据 */
watch(
  () => modelData.value.formId,
  async (newFormId) => {
    if (newFormId && modelData.value.formType === BpmModelFormType.NORMAL) {
      const data = await FormApi.getForm(newFormId) as FormApi.FormVO
      const result: Array<{ field: string; title: string }> = []
      if (data.fields) {
        unParsedFormFields.value = data.fields
        data.fields.forEach((fieldStr: string) => {
          try {
            parseFormFields(JSON.parse(fieldStr), result)
          }
          catch {
            // ignore invalid field json
          }
        })
      }
      formFields.value = result
    } else {
      formFields.value = []
      unParsedFormFields.value = []
    }
  },
  { immediate: true }
)

const defaultTemplate =
  '<p style="text-align: center;"><span data-w-e-type="mention" data-w-e-is-void="" data-w-e-is-inline="" data-value="流程名称" data-info="%7B%22id%22%3A%22processName%22%7D">@流程名称</span></p><p style="text-align: right;">打印人：<span data-w-e-type="mention" data-w-e-is-void="" data-w-e-is-inline="" data-value="打印人" data-info="%7B%22id%22%3A%22printUser%22%7D">@打印人</span></p><p style="text-align: right;">流程编号：<span data-w-e-type="mention" data-w-e-is-void="" data-w-e-is-inline="" data-value="流程编号" data-info="%7B%22id%22%3A%22processNum%22%7D">@流程编号</span> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;打印时间：<span data-w-e-type="mention" data-w-e-is-void="" data-w-e-is-inline="" data-value="打印时间" data-info="%7B%22id%22%3A%22printTime%22%7D">@打印时间</span></p><table style="width: 100%;"><tbody><tr><td colSpan="1" rowSpan="1" width="auto">发起人</td><td colSpan="1" rowSpan="1" width="auto"><span data-w-e-type="mention" data-w-e-is-void data-w-e-is-inline data-value="发起人" data-info="%7B%22id%22%3A%22startUser%22%7D">@发起人</span></td><td colSpan="1" rowSpan="1" width="auto">发起时间</td><td colSpan="1" rowSpan="1" width="auto"><span data-w-e-type="mention" data-w-e-is-void data-w-e-is-inline data-value="发起时间" data-info="%7B%22id%22%3A%22startTime%22%7D">@发起时间</span></td></tr><tr><td colSpan="1" rowSpan="1" width="auto">所属部门</td><td colSpan="1" rowSpan="1" width="auto"><span data-w-e-type="mention" data-w-e-is-void data-w-e-is-inline data-value="发起人部门" data-info="%7B%22id%22%3A%22startUserDept%22%7D">@发起人部门</span></td><td colSpan="1" rowSpan="1" width="auto">流程状态</td><td colSpan="1" rowSpan="1" width="auto"><span data-w-e-type="mention" data-w-e-is-void data-w-e-is-inline data-value="流程状态" data-info="%7B%22id%22%3A%22processStatus%22%7D">@流程状态</span></td></tr></tbody></table><p><span data-w-e-type="process-record" data-w-e-is-void data-w-e-is-inline>流程记录</span></p>'
const handlePrintTemplateEnableChange = (val: boolean) => {
  if (val) {
    if (!modelData.value.printTemplateSetting.template) {
      modelData.value.printTemplateSetting.template = defaultTemplate
    }
  }
}
const printTemplateRef = ref()
const handleEditPrintTemplate = () => {
  printTemplateRef.value.open(modelData.value.printTemplateSetting.template)
}
const confirmPrintTemplate = (template: any) => {
  modelData.value.printTemplateSetting.template = template
}
</script>
