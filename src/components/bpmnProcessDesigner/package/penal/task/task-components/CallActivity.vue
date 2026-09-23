<template>
  <div>
    <n-form label-width="100px">
      <n-form-item label="实例名称" path="processInstanceName">
        <n-input
          v-model:value="formData.processInstanceName"
          clearable
          placeholder="请输入实例名称"
          @change="updateCallActivityAttr('processInstanceName')"
        />
      </n-form-item>

      <!-- 选择已存在流程（复用模型列表） -->
      <n-form-item label="被调用流程" path="calledElement">
        <n-select
          v-model:value="formData.calledElement"
          filterable
          clearable
          placeholder="请选择被调用流程"
          :options="processOptions"
          :loading="processLoading"
          @update:value="updateCallActivityAttr('calledElement')"
        />
      </n-form-item>

      <n-form-item label="继承变量" path="inheritVariables">
        <n-switch
          v-model:value="formData.inheritVariables"
          @update:value="updateCallActivityAttr('inheritVariables')"
        />
      </n-form-item>

      <n-form-item label="继承业务键" path="inheritBusinessKey">
        <n-switch
          v-model:value="formData.inheritBusinessKey"
          @update:value="updateCallActivityAttr('inheritBusinessKey')"
        />
      </n-form-item>

      <n-form-item v-if="!formData.inheritBusinessKey" label="业务键表达式" path="businessKey">
        <n-input
          v-model:value="formData.businessKey"
          clearable
          placeholder="请输入业务键表达式"
          @change="updateCallActivityAttr('businessKey')"
        />
      </n-form-item>

      <n-divider />
      <div>
        <div class="flex mb-10px">
          <span>输入参数</span>
          <XButton
            class="ml-auto"
            type="primary"
            preIcon="ep:plus"
            title="添加参数"
            size="small"
            @click="openVariableForm('in', null, -1)"
          />
        </div>
        <CommonTable
          :data="inVariableList"
          :fields="inVariableTableFields"
          :show-pagination="false"
          :csv-export="false"
          :flex-height="false"
          :table-props="{ size: 'small', bordered: true, maxHeight: 240 }"
        />
      </div>

      <n-divider />
      <div>
        <div class="flex mb-10px">
          <span>输出参数</span>
          <XButton
            class="ml-auto"
            type="primary"
            preIcon="ep:plus"
            title="添加参数"
            size="small"
            @click="openVariableForm('out', null, -1)"
          />
        </div>
        <CommonTable
          :data="outVariableList"
          :fields="outVariableTableFields"
          :show-pagination="false"
          :csv-export="false"
          :flex-height="false"
          :table-props="{ size: 'small', bordered: true, maxHeight: 240 }"
        />
      </div>
    </n-form>

    <CommonModal
      v-model:show="variableFormVisible"
      v-model:form-model="variableFormData"
      :config="variableModalConfig"
      @confirm="saveVariable"
    />
  </div>
</template>

<script lang="ts" setup>
import { useFormModal } from '@/hooks/useFormModal'
import { defineFields, defineModal, extractFormDefaults } from '@/utils/schema'
import { getModelList } from '@/api/bpm/model'

defineOptions({ name: 'CallActivity' })
const props = defineProps({
  id: String,
  type: String,
})
const prefix = inject('prefix')

const formData = ref({
  processInstanceName: '',
  calledElement: '',
  inheritVariables: false,
  businessKey: '',
  inheritBusinessKey: false,
  calledElementType: 'key',
})
const processLoading = ref(false)
const processOptions = ref<{ label: string, value: string }[]>([])
const inVariableList = ref<any[]>([])
const outVariableList = ref<any[]>([])
const variableType = ref<'in' | 'out'>('in')
const editingVariableIndex = ref(-1)

const variableFields = defineFields([
  {
    key: 'source',
    label: '源',
    component: 'NInput',
    form: {},
    search: false,
    table: { minWidth: 100, ellipsis: { tooltip: true } },
  },
  {
    key: 'target',
    label: '目标',
    component: 'NInput',
    form: {},
    search: false,
    table: { minWidth: 100, ellipsis: { tooltip: true } },
  },
])

const {
  formVisible: variableFormVisible,
  formData: variableFormData,
  openCreate,
  openEdit,
} = useFormModal(() => extractFormDefaults(variableFields))

function buildVariableTableFields(type: 'in' | 'out') {
  const list = type === 'in' ? inVariableList : outVariableList
  return computed(() => [
    ...variableFields,
    {
      key: 'actions',
      label: '操作',
      form: false,
      search: false,
      table: {
        width: 110,
        actions: (row: any) => [
          {
            key: 'edit',
            label: '编辑',
            onClick: () => {
              openVariableForm(type, row, list.value.indexOf(row))
            },
          },
          {
            key: 'remove',
            label: '移除',
            type: 'error' as const,
            confirm: '确认移除该参数吗？',
            onClick: () => {
              removeVariable(type, list.value.indexOf(row))
            },
          },
        ],
      },
    },
  ])
}

const inVariableTableFields = buildVariableTableFields('in')
const outVariableTableFields = buildVariableTableFields('out')

const variableModalConfig = computed(() => defineModal({
  title: '参数配置',
  width: 600,
  sections: [{
    type: 'form',
    key: 'main',
    fields: variableFields,
    formProps: { labelWidth: 80 },
  }],
}))

const bpmnInstances = () => (window as any)?.bpmnInstances
const bpmnElement = ref()
const otherExtensionList = ref<any[]>([])

const initCallActivity = () => {
  bpmnElement.value = bpmnInstances().bpmnElement

  Object.keys(formData.value).forEach((key) => {
    formData.value[key] = bpmnElement.value.businessObject[key] ?? formData.value[key]
  })

  otherExtensionList.value = []
  inVariableList.value = []
  outVariableList.value = []
  bpmnElement.value.businessObject?.extensionElements?.values?.forEach((ex: any) => {
    if (ex.$type === `${prefix}:In`)
      inVariableList.value.push(ex)
    else if (ex.$type === `${prefix}:Out`)
      outVariableList.value.push(ex)
    else
      otherExtensionList.value.push(ex)
  })
}

const updateCallActivityAttr = (attr: string) => {
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    [attr]: formData.value[attr],
  })
}

const openVariableForm = (type: 'in' | 'out', data: any, index: number) => {
  editingVariableIndex.value = index
  variableType.value = type
  if (index === -1)
    openCreate()
  else
    openEdit({ source: data.source, target: data.target })
}

const removeVariable = (type: 'in' | 'out', index: number) => {
  if (index < 0)
    return
  if (type === 'in')
    inVariableList.value.splice(index, 1)
  if (type === 'out')
    outVariableList.value.splice(index, 1)
  updateElementExtensions()
}

const saveVariable = () => {
  if (editingVariableIndex.value === -1) {
    if (variableType.value === 'in') {
      inVariableList.value.push(
        bpmnInstances().moddle.create(`${prefix}:In`, { ...variableFormData.value }),
      )
    }
    if (variableType.value === 'out') {
      outVariableList.value.push(
        bpmnInstances().moddle.create(`${prefix}:Out`, { ...variableFormData.value }),
      )
    }
    updateElementExtensions()
  }
  else {
    if (variableType.value === 'in') {
      inVariableList.value[editingVariableIndex.value].source = variableFormData.value.source
      inVariableList.value[editingVariableIndex.value].target = variableFormData.value.target
    }
    if (variableType.value === 'out') {
      outVariableList.value[editingVariableIndex.value].source = variableFormData.value.source
      outVariableList.value[editingVariableIndex.value].target = variableFormData.value.target
    }
  }
  variableFormVisible.value = false
}

const updateElementExtensions = () => {
  const extensions = bpmnInstances().moddle.create('bpmn:ExtensionElements', {
    values: [...inVariableList.value, ...outVariableList.value, ...otherExtensionList.value],
  })
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    extensionElements: extensions,
  })
}

watch(
  () => props.id,
  (val) => {
    val
    && val.length
    && nextTick(() => {
      initCallActivity()
    })
  },
  { immediate: true },
)

onMounted(async () => {
  processLoading.value = true
  try {
    const list = await getModelList(undefined) as any[]
    processOptions.value = (list || []).map(item => ({
      label: `${item.name}（${item.key}）`,
      value: item.key,
    }))
  }
  catch {
    processOptions.value = []
  }
  finally {
    processLoading.value = false
  }
})
</script>

<style lang="scss" scoped></style>
