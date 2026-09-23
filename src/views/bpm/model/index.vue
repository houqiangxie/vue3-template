<template>
  <div class="bpm-model-editor" :style="editorThemeStyle">
    <header class="bpm-model-editor__header">
      <div class="bpm-model-editor__left">
        <n-button text class="bpm-model-editor__back" @click="handleBack">
          <template #icon>
            <Icon icon="ep:arrow-left" :size="18" />
          </template>
          <span class="bpm-model-editor__name" :title="formData.name || '创建流程'">
            {{ formData.name || '创建流程' }}
          </span>
        </n-button>
      </div>

      <div class="bpm-model-editor__steps">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="bpm-model-editor__step"
          :class="{ 'is-active': currentStep === index }"
          @click="handleStepClick(index)"
        >
          <div class="bpm-model-editor__step-no">{{ index + 1 }}</div>
          <span class="bpm-model-editor__step-title">{{ step.title }}</span>
        </div>
      </div>

      <div class="bpm-model-editor__actions">
        <n-button type="success" @click="handleDeploy">
          发 布
        </n-button>
        <n-button type="primary" @click="handleSave">
          <span v-if="actionType === 'definition'">恢 复</span>
          <span v-else>保 存</span>
        </n-button>
      </div>
    </header>

    <div
      class="bpm-model-editor__body"
      :class="{ 'bpm-model-editor__body--full': currentStep === 2 }"
    >
      <div v-show="currentStep === 0" class="bpm-model-editor__panel bpm-model-editor__panel--sm">
        <BasicInfo
          v-model="formData"
          :categoryList="categoryList"
          :userList="userList"
          :deptList="deptList"
          ref="basicInfoRef"
        />
      </div>

      <div v-show="currentStep === 1" class="bpm-model-editor__panel bpm-model-editor__panel--sm">
        <FormDesign v-model="formData" :formList="formList" ref="formDesignRef" />
      </div>

      <div v-show="currentStep === 2" class="bpm-model-editor__panel bpm-model-editor__panel--full">
        <ProcessDesign v-if="processDesignMounted" v-model="formData" ref="processDesignRef" />
      </div>

      <div v-show="currentStep === 3" class="bpm-model-editor__panel bpm-model-editor__panel--md">
        <ExtraSettings ref="extraSettingsRef" v-model="formData" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { useThemeVars } from 'naive-ui'
import { useMessage } from '@/hooks/web/useMessage'
import { getInfo } from '@/api/system/auth'
import * as ModelApi from '@/api/bpm/model'
import * as FormApi from '@/api/bpm/form'
import { CategoryApi, CategoryVO } from '@/api/bpm/category'
import * as UserApi from '@/api/system/user'
import * as DeptApi from '@/api/system/dept'
import * as DefinitionApi from '@/api/bpm/definition'
import { BpmModelFormType, BpmModelType, BpmAutoApproveType } from '@/utils/constants'
import { Icon } from '@/components/Icon'
import BasicInfo from './BasicInfo.vue'
import FormDesign from './FormDesign.vue'
import ProcessDesign from './ProcessDesign.vue'
import ExtraSettings from './ExtraSettings.vue'
import { resolveBpmRouteName } from '@/views/web/Bpm/routeNames'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const themeVars = useThemeVars()

/** 向导壳跟随 web 主题（含深色与主色） */
const editorThemeStyle = computed(() => {
  const t = themeVars.value
  return {
    '--bpm-editor-bg': t.bodyColor || '#f5f7fb',
    '--bpm-editor-card': t.cardColor || '#fff',
    '--bpm-editor-border': t.borderColor || '#e5e7eb',
    '--bpm-editor-text': t.textColor1 || '#111827',
    '--bpm-editor-text-3': t.textColor3 || '#6b7280',
    '--bpm-editor-primary': t.primaryColor || '#3473ff',
  }
})

const basicInfoRef = ref()
const formDesignRef = ref()
const processDesignRef = ref()
const extraSettingsRef = ref()

const validateBasic = async () => {
  await basicInfoRef.value?.validate()
}

const validateForm = async () => {
  await formDesignRef.value?.validate()
}

const validateProcess = async (ensureMounted = false) => {
  if (ensureMounted && !processDesignMounted.value) {
    processDesignMounted.value = true
    await nextTick()
    // 等待设计器完成初始化后再校验
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  if (processDesignRef.value?.validate) {
    await processDesignRef.value.validate()
    return
  }
  const hasProcess =
    processData.value ||
    (formData.value.type === BpmModelType.BPMN
      ? formData.value.bpmnXml
      : formData.value.simpleModel)
  if (!hasProcess) {
    throw new Error('请设计流程')
  }
}

const currentStep = ref(-1)
const processDesignMounted = ref(false)

const steps = [
  { title: '基本信息', validator: validateBasic },
  { title: '表单设计', validator: validateForm },
  { title: '流程设计', validator: validateProcess },
  { title: '更多设置', validator: null }
]

const formData: any = ref({
  id: undefined,
  name: '',
  key: '',
  category: undefined,
  icon: undefined,
  description: '',
  type: BpmModelType.BPMN,
  formType: BpmModelFormType.NORMAL,
  formId: '',
  formCustomCreatePath: '',
  formCustomViewPath: '',
  visible: true,
  startUserType: undefined,
  startUserIds: [],
  startDeptIds: [],
  managerUserIds: [],
  allowCancelRunningProcess: true,
  processIdRule: {
    enable: false,
    prefix: '',
    infix: '',
    postfix: '',
    length: 5
  },
  autoApprovalType: BpmAutoApproveType.NONE,
  titleSetting: {
    enable: false,
    title: ''
  },
  summarySetting: {
    enable: false,
    summary: []
  },
  allowWithdrawTask: false,
  printTemplateSetting: {
    enable: false
  }
})

const processData = ref<any>()

provide('processData', processData)
provide('modelData', formData)

const formList = ref([])
const categoryList = ref<CategoryVO[]>([])
const userList = ref<UserApi.UserVO[]>([])
const deptList = ref<DeptApi.DeptVO[]>([])

const actionType = computed(() => route.params.type as string)

const initData = async () => {
  if (actionType.value === 'definition') {
    const definitionId = route.params.id as string
    const data = await DefinitionApi.getProcessDefinition(definitionId) as any
    data.type = data.modelType
    delete data.modelType
    data.id = data.modelId
    delete data.modelId
    if (data.simpleModel) {
      data.simpleModel = JSON.parse(data.simpleModel)
    }
    formData.value = data
    formData.value.startUserType =
      formData.value.startUserIds?.length > 0 ? 1 : formData.value?.startDeptIds?.length > 0 ? 2 : 0
  } else if (['update', 'copy'].includes(actionType.value)) {
    const modelId = route.params.id as string
    formData.value = await ModelApi.getModel(modelId) as any
    formData.value.startUserType =
      formData.value.startUserIds?.length > 0 ? 1 : formData.value?.startDeptIds?.length > 0 ? 2 : 0

    if (actionType.value === 'copy') {
      delete formData.value.id
      if (formData.value.bpmnXml) {
        formData.value.bpmnXml = formData.value.bpmnXml.replaceAll(
          formData.value.name,
          formData.value.name + '副本'
        )
        formData.value.bpmnXml = formData.value.bpmnXml.replaceAll(
          formData.value.key,
          formData.value.key + '_copy'
        )
      }
      formData.value.name += '副本'
      formData.value.key += '_copy'
      document.title = '复制流程 · 流程设计'
    }
  } else {
    formData.value.startUserType = 0
    try {
      const info = await getInfo()
      const uid = info?.user?.userId
      if (uid != null)
        formData.value.managerUserIds.push(uid)
    } catch {
      // mock / 未登录时跳过
    }
  }

  formList.value = (await FormApi.getFormSimpleList()) as any
  categoryList.value = (await CategoryApi.getCategorySimpleList()) as CategoryVO[]
  userList.value = await UserApi.getSimpleUserList()
  deptList.value = await DeptApi.getSimpleDeptList()

  currentStep.value = 0
  await nextTick()
  extraSettingsRef.value?.initData?.()
}

watch(
  async () => formData.value.type,
  () => {
    if (formData.value.type === BpmModelType.BPMN) {
      processData.value = formData.value.bpmnXml
    } else if (formData.value.type === BpmModelType.SIMPLE) {
      processData.value = formData.value.simpleModel
    }
  },
  {
    immediate: true
  }
)

const validateAllSteps = async () => {
  try {
    try {
      await validateBasic()
    } catch {
      currentStep.value = 0
      throw new Error('请完善基本信息')
    }

    try {
      await validateForm()
    } catch {
      currentStep.value = 1
      throw new Error('请完善自定义表单信息')
    }

    try {
      await validateProcess(true)
    } catch (e: any) {
      currentStep.value = 2
      processDesignMounted.value = true
      throw new Error(e?.message || '请设计流程')
    }

    return true
  } catch (error) {
    throw error
  }
}

const syncProcessBeforePersist = async () => {
  // 流程设计步骤已挂载时主动从设计器拉取；否则用已缓存的 processData
  if (processDesignRef.value?.syncProcess) {
    await processDesignRef.value.syncProcess()
  } else if (processData.value) {
    if (formData.value.type === BpmModelType.BPMN) {
      formData.value.bpmnXml = processData.value
      formData.value.simpleModel = null
    } else {
      formData.value.simpleModel = processData.value
      formData.value.bpmnXml = null
    }
  }
}

const handleSave = async () => {
  try {
    await validateAllSteps()
    await syncProcessBeforePersist()

    const modelPayload = {
      ...formData.value
    }

    if (actionType.value === 'definition') {
      await ModelApi.updateModel(modelPayload)
      message.success('恢复成功，可点击【发布】按钮，进行发布模型')
    } else if (actionType.value === 'update') {
      await ModelApi.updateModel(modelPayload)
      message.success('修改成功，可点击【发布】按钮，进行发布模型')
    } else if (actionType.value === 'copy') {
      formData.value.id = await ModelApi.createModel(modelPayload)
      message.success('复制成功，可点击【发布】按钮，进行发布模型')
      await router.replace({
        name: resolveBpmRouteName(router, 'Bpm-ModelEditor', 'BpmModelEditor'),
        params: { type: 'update', id: String(formData.value.id) }
      })
    } else {
      formData.value.id = await ModelApi.createModel(modelPayload)
      message.success('新建成功，可点击【发布】按钮，进行发布模型')
      await router.replace({
        name: resolveBpmRouteName(router, 'Bpm-ModelEditor', 'BpmModelEditor'),
        params: { type: 'update', id: String(formData.value.id) }
      })
    }
  } catch (error: any) {
    console.error('保存失败:', error)
    message.warning(error.message || '请完善所有步骤的必填信息')
  }
}

const handleDeploy = async () => {
  try {
    await message.confirm('是否确认发布该流程？')
    await validateAllSteps()
    await syncProcessBeforePersist()

    const modelPayload = {
      ...formData.value
    }

    if (formData.value.id) {
      await ModelApi.updateModel(modelPayload)
    } else {
      const result = await ModelApi.createModel(modelPayload) as any
      formData.value.id = result?.id ?? result
    }

    await ModelApi.deployModel(formData.value.id)
    message.success('发布成功')
    await router.push({ name: resolveBpmRouteName(router, 'Bpm-Model', 'BpmModel') })
  } catch (error: any) {
    console.error('发布失败:', error)
    if (error !== 'cancel' && error?.message !== 'cancel') {
      message.warning(error.message || '发布失败')
    }
  }
}

const handleStepClick = async (index: number) => {
  try {
    if (index !== 0) {
      await validateBasic()
    }
    if (index !== 1) {
      await validateForm()
    }
    if (index !== 2) {
      await validateProcess()
    }

    currentStep.value = index
    if (index === 2) {
      processDesignMounted.value = true
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))
      if (processDesignRef.value?.refresh) {
        await processDesignRef.value.refresh()
      }
    }
  } catch (error) {
    console.error('步骤切换失败:', error)
    message.warning('请先完善当前步骤必填信息')
  }
}

const handleBack = () => {
  router.push({ name: resolveBpmRouteName(router, 'Bpm-Model', 'BpmModel') })
}

onMounted(async () => {
  await initData()
})

onBeforeUnmount(() => {
  basicInfoRef.value = null
  formDesignRef.value = null
  processDesignRef.value = null
})
</script>

<style lang="scss" scoped>
.bpm-model-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--bpm-editor-card, #fff);
  color: var(--bpm-editor-text, #111827);
}

.bpm-model-editor__header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 20px;
  border-bottom: 1px solid var(--bpm-editor-border, #e5e7eb);
  background: var(--bpm-editor-card, #fff);
  z-index: 10;
}

.bpm-model-editor__left {
  width: 200px;
  flex-shrink: 0;
  overflow: hidden;
}

.bpm-model-editor__back {
  max-width: 100%;
  justify-content: flex-start;
}

.bpm-model-editor__name {
  display: inline-block;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 16px;
  color: var(--bpm-editor-text, #111827);
  vertical-align: middle;
}

.bpm-model-editor__steps {
  flex: 1;
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 8px;
  height: 100%;
}

.bpm-model-editor__step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 100%;
  cursor: pointer;
  color: var(--bpm-editor-text-3, #6b7280);
  border-bottom: 2px solid transparent;
}

.bpm-model-editor__step.is-active {
  color: var(--bpm-editor-primary, #3473ff);
  border-bottom-color: var(--bpm-editor-primary, #3473ff);
}

.bpm-model-editor__step-no {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--bpm-editor-border, #d1d5db);
  font-size: 14px;
  background: var(--bpm-editor-card, #fff);
}

.bpm-model-editor__step.is-active .bpm-model-editor__step-no {
  background: var(--bpm-editor-primary, #3473ff);
  border-color: var(--bpm-editor-primary, #3473ff);
  color: #fff;
}

.bpm-model-editor__step-title {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

.bpm-model-editor__actions {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.bpm-model-editor__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--bpm-editor-bg, #f5f7fb);
  padding: 24px 16px 40px;
}

.bpm-model-editor__body--full {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.bpm-model-editor__panel {
  margin: 0 auto;
  background: var(--bpm-editor-card, #fff);
  border-radius: 8px;
  padding: 8px 24px 24px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.bpm-model-editor__panel--sm {
  width: 100%;
  max-width: 640px;
}

.bpm-model-editor__panel--md {
  width: 100%;
  max-width: 760px;
}

.bpm-model-editor__panel--full {
  max-width: none;
  width: 100%;
  margin: 0;
  padding: 0;
  background: transparent;
  box-shadow: none;
  border-radius: 0;
  flex: 1;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bpm-model-editor__panel--full > :deep(*) {
  flex: 1;
  min-height: 0;
  height: 100%;
}
</style>
