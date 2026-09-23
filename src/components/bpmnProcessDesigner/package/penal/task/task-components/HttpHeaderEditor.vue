<template>
  <Dialog
    v-model="dialogVisible"
    title="编辑请求头"
    width="600px"
    :scroll="true"
    max-height="480px"
  >
    <div class="header-editor">
      <div class="header-list">
        <div v-for="(item, index) in headerList" :key="index" class="header-item">
          <n-input v-model:value="item.key" placeholder="请输入参数名" class="header-key" clearable />
          <span class="separator">:</span>
          <n-input
            v-model:value="item.value"
            placeholder="请输入参数值 (支持表达式 ${变量名})"
            class="header-value"
            clearable
          />
          <n-button
            type="error"
            circle
            size="small"
            @click="removeHeader(index)"
          >
            <template #icon>
              <n-icon :component="TrashOutline" />
            </template>
          </n-button>
        </div>
      </div>
      <n-button type="primary" class="add-btn" @click="addHeader">
        <template #icon>
          <n-icon :component="AddOutline" />
        </template>
        添加请求头
      </n-button>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" @click="handleSave">保存</n-button>
      </span>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { TrashOutline, AddOutline } from '@vicons/ionicons5'
import { Dialog } from '@/components/Dialog'

defineOptions({ name: 'HttpHeaderEditor' })

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  headers: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

interface HeaderItem {
  key: string
  value: string
}

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const headerList = ref<HeaderItem[]>([])

const parseHeaders = (headersStr: string): HeaderItem[] => {
  if (!headersStr || !headersStr.trim())
    return [{ key: '', value: '' }]

  const lines = headersStr.split('\n').filter(line => line.trim())
  const parsed = lines.map((line) => {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      return {
        key: line.substring(0, colonIndex).trim(),
        value: line.substring(colonIndex + 1).trim(),
      }
    }
    return { key: line.trim(), value: '' }
  })

  return parsed.length > 0 ? parsed : [{ key: '', value: '' }]
}

const stringifyHeaders = (headers: HeaderItem[]): string => {
  return headers
    .filter(item => item.key.trim())
    .map(item => `${item.key}: ${item.value}`)
    .join('\n')
}

const addHeader = () => {
  headerList.value.push({ key: '', value: '' })
}

const removeHeader = (index: number) => {
  if (headerList.value.length === 1)
    headerList.value = [{ key: '', value: '' }]
  else
    headerList.value.splice(index, 1)
}

const handleSave = () => {
  emit('save', stringifyHeaders(headerList.value))
  dialogVisible.value = false
}

const handleClose = () => {
  dialogVisible.value = false
}

watch(
  () => props.modelValue,
  (val) => {
    if (val)
      headerList.value = parseHeaders(props.headers)
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.header-editor {
  .header-list {
    max-height: 400px;
    overflow-y: auto;
    margin-bottom: 16px;
  }

  .header-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .header-key {
      flex: 0 0 180px;
    }

    .separator {
      color: var(--bpmn-text-3, var(--n-text-color-3, #606266));
      font-weight: 500;
    }

    .header-value {
      flex: 1;
    }
  }

  .add-btn {
    width: 100%;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
