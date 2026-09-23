<template>
  <div class="panel-tab__content">
    <n-form :model="flowConditionForm" label-width="90px" size="small">
      <n-form-item label="流转类型">
        <n-select
          v-model:value="flowConditionForm.type"
          :options="flowTypeOptions"
          @update:value="updateFlowType"
        />
      </n-form-item>
      <n-form-item label="条件格式" v-if="flowConditionForm.type === 'condition'" key="condition">
        <n-select v-model:value="flowConditionForm.conditionType" :options="conditionTypeOptions" />
      </n-form-item>
      <n-form-item
        label="表达式"
        v-if="flowConditionForm.conditionType && flowConditionForm.conditionType === 'expression'"
        key="express"
      >
        <n-input
          v-model:value="flowConditionForm.body"
          style="width: 192px"
          clearable
          @update:value="updateFlowCondition"
        />
      </n-form-item>
      <template
        v-if="flowConditionForm.conditionType && flowConditionForm.conditionType === 'script'"
      >
        <n-form-item label="脚本语言" key="language">
          <n-input
            v-model:value="flowConditionForm.language"
            clearable
            @update:value="updateFlowCondition"
          />
        </n-form-item>
        <n-form-item label="脚本类型" key="scriptType">
          <n-select v-model:value="flowConditionForm.scriptType" :options="scriptTypeOptions" />
        </n-form-item>
        <n-form-item
          label="脚本"
          v-if="flowConditionForm.scriptType === 'inlineScript'"
          key="body"
        >
          <n-input
            v-model:value="flowConditionForm.body"
            type="textarea"
            clearable
            @update:value="updateFlowCondition"
          />
        </n-form-item>
        <n-form-item
          label="资源地址"
          v-if="flowConditionForm.scriptType === 'externalScript'"
          key="resource"
        >
          <n-input
            v-model:value="flowConditionForm.resource"
            clearable
            @update:value="updateFlowCondition"
          />
        </n-form-item>
      </template>
    </n-form>
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: 'FlowCondition' })

const props = defineProps({
  businessObject: Object,
  type: String
})
const flowTypeOptions = [
  { label: '普通流转路径', value: 'normal' },
  { label: '默认流转路径', value: 'default' },
  { label: '条件流转路径', value: 'condition' }
]
const conditionTypeOptions = [
  { label: '表达式', value: 'expression' },
  { label: '脚本', value: 'script' }
]
const scriptTypeOptions = [
  { label: '内联脚本', value: 'inlineScript' },
  { label: '外部脚本', value: 'externalScript' }
]
const flowConditionForm = ref<any>({})
const bpmnElement = ref()
const bpmnElementSource = ref()
const bpmnElementSourceRef = ref()
const flowConditionRef = ref()
const bpmnInstances = () => (window as any)?.bpmnInstances
const resetFlowCondition = () => {
  bpmnElement.value = bpmnInstances().bpmnElement
  bpmnElementSource.value = bpmnElement.value.source
  bpmnElementSourceRef.value = bpmnElement.value.businessObject.sourceRef
  // 初始化默认type为default
  flowConditionForm.value = { type: 'default' }
  if (
    bpmnElementSourceRef.value &&
    bpmnElementSourceRef.value.default &&
    bpmnElementSourceRef.value.default.id === bpmnElement.value.id
  ) {
    flowConditionForm.value = { type: 'default' }
  } else if (!bpmnElement.value.businessObject.conditionExpression) {
    // 普通
    flowConditionForm.value = { type: 'normal' }
  } else {
    // 带条件
    const conditionExpression = bpmnElement.value.businessObject.conditionExpression
    flowConditionForm.value = { ...conditionExpression, type: 'condition' }
    // resource 可直接标识 是否是外部资源脚本
    if (flowConditionForm.value.resource) {
      // this.$set(this.flowConditionForm, "conditionType", "script");
      // this.$set(this.flowConditionForm, "scriptType", "externalScript");
      flowConditionForm.value['conditionType'] = 'script'
      flowConditionForm.value['scriptType'] = 'externalScript'
      return
    }
    if (conditionExpression.language) {
      // this.$set(this.flowConditionForm, "conditionType", "script");
      // this.$set(this.flowConditionForm, "scriptType", "inlineScript");
      flowConditionForm.value['conditionType'] = 'script'
      flowConditionForm.value['scriptType'] = 'inlineScript'

      return
    }
    // this.$set(this.flowConditionForm, "conditionType", "expression");
    flowConditionForm.value['conditionType'] = 'expression'
  }
}
const updateFlowType = (flowType) => {
  // 正常条件类
  if (flowType === 'condition') {
    flowConditionRef.value = bpmnInstances().moddle.create('bpmn:FormalExpression')
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
      conditionExpression: flowConditionRef.value
    })
    return
  }
  // 默认路径
  if (flowType === 'default') {
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
      conditionExpression: null
    })
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElementSource.value), {
      default: toRaw(bpmnElement.value)
    })
    return
  }
  // 正常路径，如果来源节点的默认路径是当前连线时，清除父元素的默认路径配置
  if (
    bpmnElementSourceRef.value.default &&
    bpmnElementSourceRef.value.default.id === bpmnElement.value.id
  ) {
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElementSource.value), {
      default: null
    })
  }
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    conditionExpression: null
  })
}
const updateFlowCondition = () => {
  let { conditionType, scriptType, body, resource, language } = flowConditionForm.value
  let condition
  if (conditionType === 'expression') {
    condition = bpmnInstances().moddle.create('bpmn:FormalExpression', { body })
  } else {
    if (scriptType === 'inlineScript') {
      condition = bpmnInstances().moddle.create('bpmn:FormalExpression', { body, language })
      // this.$set(this.flowConditionForm, "resource", "");
      flowConditionForm.value['resource'] = ''
    } else {
      // this.$set(this.flowConditionForm, "body", "");
      flowConditionForm.value['body'] = ''
      condition = bpmnInstances().moddle.create('bpmn:FormalExpression', {
        resource,
        language
      })
    }
  }
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    conditionExpression: condition
  })
}

onBeforeUnmount(() => {
  bpmnElement.value = null
  bpmnElementSource.value = null
  bpmnElementSourceRef.value = null
})

watch(
  () => props.businessObject,
  (val) => {
    console.log(val, 'val')
    nextTick(() => {
      resetFlowCondition()
    })
  },
  {
    immediate: true
  }
)
</script>
