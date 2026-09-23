<template>
  <div>
    <n-form-item label="执行类型" key="executeType">
      <n-select v-model:value="serviceTaskForm.executeType" @change="handleExecuteTypeChange" :options="[{ label: 'Java类', value: 'class' }, { label: '表达式', value: 'expression' }, { label: '代理表达式', value: 'delegateExpression' }, { label: 'HTTP 调用', value: 'http' }]" />
    </n-form-item>
    <n-form-item
      v-if="serviceTaskForm.executeType === 'class'"
      label="Java类"
      path="class"
      key="execute-class"
    >
      <n-input v-model:value="serviceTaskForm.class" clearable @change="updateElementTask" />
    </n-form-item>
    <n-form-item
      v-if="serviceTaskForm.executeType === 'expression'"
      label="表达式"
      path="expression"
      key="execute-expression"
    >
      <n-input v-model:value="serviceTaskForm.expression" clearable @change="updateElementTask" />
    </n-form-item>
    <n-form-item
      v-if="serviceTaskForm.executeType === 'delegateExpression'"
      label="代理表达式"
      path="delegateExpression"
      key="execute-delegate"
    >
      <n-input
        v-model:value="serviceTaskForm.delegateExpression"
        clearable
        @change="updateElementTask"
      />
    </n-form-item>
    <template v-if="serviceTaskForm.executeType === 'http'">
      <n-form-item label="请求方法" key="http-method">
        <n-radio-group v-model:value="httpTaskForm.requestMethod">
          <n-radio-button label="GET" value="GET" />
          <n-radio-button label="POST" value="POST" />
          <n-radio-button label="PUT" value="PUT" />
          <n-radio-button label="DELETE" value="DELETE" />
        </n-radio-group>
      </n-form-item>
      <n-form-item label="请求地址" key="http-url" path="requestUrl">
        <n-input v-model:value="httpTaskForm.requestUrl" clearable />
      </n-form-item>
      <n-form-item label="请求头" key="http-headers">
        <div style="display: flex; gap: 8px; align-items: flex-start; width: 100%">
          <n-input
            v-model:value="httpTaskForm.requestHeaders"
            type="textarea"
            resize="vertical"
            :autosize="{ minRows: 4, maxRows: 8 }"
            readonly
            placeholder="点击右侧编辑按钮添加请求头"
            style="flex: 1; min-width: 0"
          />
          <n-button
            type="primary"
            :icon="CreateOutline"
            @click="showHeaderEditor = true"
            style="flex-shrink: 0"
          >
            编辑
          </n-button>
        </div>
      </n-form-item>
      <n-form-item label="禁止重定向" key="http-disallow-redirects">
        <n-switch v-model:value="httpTaskForm.disallowRedirects" />
      </n-form-item>
      <n-form-item label="忽略异常" key="http-ignore-exception">
        <n-switch v-model:value="httpTaskForm.ignoreException" />
      </n-form-item>
      <n-form-item label="保存返回变量" key="http-save-response">
        <n-switch v-model:value="httpTaskForm.saveResponseParameters" />
      </n-form-item>
      <n-form-item label="是否瞬间变量" key="http-save-transient">
        <n-switch v-model:value="httpTaskForm.saveResponseParametersTransient" />
      </n-form-item>
      <n-form-item label="返回变量前缀" key="http-result-variable-prefix">
        <n-input v-model:value="httpTaskForm.resultVariablePrefix" />
      </n-form-item>
      <n-form-item label="格式化返回为JSON" key="http-save-json">
        <n-switch v-model:value="httpTaskForm.saveResponseVariableAsJson" />
      </n-form-item>
    </template>

    <!-- 请求头编辑器 -->
    <HttpHeaderEditor
      v-model="showHeaderEditor"
      :headers="httpTaskForm.requestHeaders"
      @save="handleHeadersSave"
    />
  </div>
</template>

<script lang="ts" setup>
import { CreateOutline } from '@vicons/ionicons5'
import { updateElementExtensions } from '@/components/bpmnProcessDesigner/package/utils'
import HttpHeaderEditor from './HttpHeaderEditor.vue'

defineOptions({ name: 'ServiceTask' })
const props = defineProps({
  id: String,
  type: String
})

const prefix = (inject('prefix', 'flowable') || 'flowable') as string
const flowableTypeKey = `${prefix}:type`
const flowableFieldType = `${prefix}:Field`

const HTTP_FIELD_NAMES = [
  'requestMethod',
  'requestUrl',
  'requestHeaders',
  'disallowRedirects',
  'ignoreException',
  'saveResponseParameters',
  'resultVariablePrefix',
  'saveResponseParametersTransient',
  'saveResponseVariableAsJson'
]
const HTTP_BOOLEAN_FIELDS = new Set([
  'disallowRedirects',
  'ignoreException',
  'saveResponseParameters',
  'saveResponseParametersTransient',
  'saveResponseVariableAsJson'
])

const DEFAULT_TASK_FORM = {
  executeType: '',
  class: '',
  expression: '',
  delegateExpression: ''
}

const DEFAULT_HTTP_FORM = {
  requestMethod: 'GET',
  requestUrl: '',
  requestHeaders: 'Content-Type: application/json',
  resultVariablePrefix: '',
  disallowRedirects: false,
  ignoreException: false,
  saveResponseParameters: false,
  saveResponseParametersTransient: false,
  saveResponseVariableAsJson: false
}

const serviceTaskForm = ref({ ...DEFAULT_TASK_FORM })
const httpTaskForm = ref({ ...DEFAULT_HTTP_FORM })
const bpmnElement = ref()
const httpInitializing = ref(false)
const showHeaderEditor = ref(false)

const bpmnInstances = () => (window as any)?.bpmnInstances

// 判断字符串是否包含表达式
const isExpression = (value: string): boolean => {
  if (!value) return false
  // 检测 ${...} 或 #{...} 格式的表达式
  return /\${[^}]+}/.test(value) || /#{[^}]+}/.test(value)
}

const collectHttpExtensionInfo = () => {
  const businessObject = bpmnElement.value?.businessObject
  const extensionElements = businessObject?.extensionElements
  const httpFields = new Map<string, string>()
  const httpFieldTypes = new Map<string, 'string' | 'expression'>()
  const otherExtensions: any[] = []

  extensionElements?.values?.forEach((item: any) => {
    if (item?.$type === flowableFieldType && HTTP_FIELD_NAMES.includes(item.name)) {
      const value = item.string ?? item.stringValue ?? item.expression ?? ''
      const fieldType = item.expression ? 'expression' : 'string'
      httpFields.set(item.name, value)
      httpFieldTypes.set(item.name, fieldType)
    } else {
      otherExtensions.push(item)
    }
  })

  return { httpFields, httpFieldTypes, otherExtensions }
}

const resetHttpDefaults = () => {
  httpInitializing.value = true
  httpTaskForm.value = { ...DEFAULT_HTTP_FORM }
  nextTick(() => {
    httpInitializing.value = false
  })
}

const resetHttpForm = () => {
  httpInitializing.value = true
  const { httpFields } = collectHttpExtensionInfo()
  const nextForm = { ...DEFAULT_HTTP_FORM }

  HTTP_FIELD_NAMES.forEach((name) => {
    const stored = httpFields.get(name)
    if (stored !== undefined) {
      nextForm[name] = HTTP_BOOLEAN_FIELDS.has(name) ? stored === 'true' : stored
    }
  })

  httpTaskForm.value = nextForm
  nextTick(() => {
    httpInitializing.value = false
    updateHttpExtensions(true)
  })
}

const resetServiceTaskForm = () => {
  const businessObject = bpmnElement.value?.businessObject
  const nextForm = { ...DEFAULT_TASK_FORM }

  if (businessObject) {
    if (businessObject.class) {
      nextForm.class = businessObject.class
      nextForm.executeType = 'class'
    }
    if (businessObject.expression) {
      nextForm.expression = businessObject.expression
      nextForm.executeType = 'expression'
    }
    if (businessObject.delegateExpression) {
      nextForm.delegateExpression = businessObject.delegateExpression
      nextForm.executeType = 'delegateExpression'
    }
    if (businessObject.$attrs?.[flowableTypeKey] === 'http') {
      nextForm.executeType = 'http'
    } else {
      // 兜底：如缺少 flowable:type=http，但扩展里已有 HTTP 的字段，也认为是 HTTP
      const { httpFields } = collectHttpExtensionInfo()
      if (httpFields.size > 0) {
        nextForm.executeType = 'http'
      }
    }
  }

  serviceTaskForm.value = nextForm

  if (nextForm.executeType === 'http') {
    resetHttpForm()
  } else {
    resetHttpDefaults()
  }
}

const shouldPersistField = (name: string, value: any) => {
  if (HTTP_BOOLEAN_FIELDS.has(name)) return true
  if (name === 'requestMethod') return true
  if (name === 'requestUrl') return !!value
  return value !== undefined && value !== ''
}

const updateHttpExtensions = (force = false) => {
  if (!bpmnElement.value) return
  if (!force && (httpInitializing.value || serviceTaskForm.value.executeType !== 'http')) {
    return
  }

  const {
    httpFields: existingFields,
    httpFieldTypes: existingTypes,
    otherExtensions
  } = collectHttpExtensionInfo()

  const desiredEntries: [string, string][] = []
  HTTP_FIELD_NAMES.forEach((name) => {
    const rawValue = httpTaskForm.value[name]
    if (!shouldPersistField(name, rawValue)) {
      return
    }

    const persisted = HTTP_BOOLEAN_FIELDS.has(name)
      ? String(!!rawValue)
      : rawValue === undefined
        ? ''
        : String(rawValue)

    desiredEntries.push([name, persisted])
  })

  // 检查是否有变化：不仅比较值，还要比较字段类型（string vs expression）
  if (!force && desiredEntries.length === existingFields.size) {
    let noChange = true
    for (const [name, value] of desiredEntries) {
      const existingValue = existingFields.get(name)
      const existingType = existingTypes.get(name)
      const currentType = isExpression(value) ? 'expression' : 'string'
      if (existingValue !== value || existingType !== currentType) {
        noChange = false
        break
      }
    }
    if (noChange) {
      return
    }
  }

  const moddle = bpmnInstances().moddle
  const httpFieldElements = desiredEntries.map(([name, value]) => {
    // 根据值是否包含表达式来决定使用 string 还是 expression 属性
    const isExpr = isExpression(value)
    return moddle.create(flowableFieldType, {
      name,
      ...(isExpr ? { expression: value } : { string: value })
    })
  })

  updateElementExtensions(bpmnElement.value, [...otherExtensions, ...httpFieldElements])
}

const removeHttpExtensions = () => {
  if (!bpmnElement.value) return
  const { httpFields, otherExtensions } = collectHttpExtensionInfo()
  if (!httpFields.size) {
    return
  }

  if (!otherExtensions.length) {
    bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
      extensionElements: null
    })
    return
  }

  updateElementExtensions(bpmnElement.value, otherExtensions)
}

const updateElementTask = () => {
  if (!bpmnElement.value) return

  const taskAttr: Record<string, any> = {
    class: null,
    expression: null,
    delegateExpression: null,
    [flowableTypeKey]: null
  }

  const type = serviceTaskForm.value.executeType
  if (type === 'class' || type === 'expression' || type === 'delegateExpression') {
    taskAttr[type] = serviceTaskForm.value[type] || null
  } else if (type === 'http') {
    taskAttr[flowableTypeKey] = 'http'
  }

  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), taskAttr)

  if (type === 'http') {
    updateHttpExtensions(true)
  } else {
    removeHttpExtensions()
  }
}

const handleExecuteTypeChange = (value: string) => {
  serviceTaskForm.value.executeType = value
  if (value === 'http') {
    resetHttpForm()
  }
  updateElementTask()
}

const handleHeadersSave = (headersStr: string) => {
  httpTaskForm.value.requestHeaders = headersStr
}

onBeforeUnmount(() => {
  bpmnElement.value = null
})

watch(
  () => props.id,
  () => {
    bpmnElement.value = bpmnInstances().bpmnElement
    nextTick(() => {
      resetServiceTaskForm()
    })
  },
  { immediate: true }
)

watch(
  () => httpTaskForm.value,
  () => {
    updateHttpExtensions()
  },
  { deep: true }
)
</script>
