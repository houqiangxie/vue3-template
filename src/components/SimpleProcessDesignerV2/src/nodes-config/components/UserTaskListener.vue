<template>
  <n-form ref="listenerFormRef" :model="configForm" label-placement="top">
    <div v-for="(listener, listenerIdx) in taskListener" :key="listenerIdx">
      <n-divider content-position="left">
        <span tag="b" size="large">{{ listener.name }}</span>
      </n-divider>
      <n-form-item>
        <n-switch
          v-model:value="configForm[`task${listener.type}ListenerEnable`]"
          active-text="开启"
          inactive-text="关闭"
        />
      </n-form-item>
      <div v-if="configForm[`task${listener.type}ListenerEnable`]">
        <n-form-item>
          <n-alert
            title="仅支持 POST 请求，以请求体方式接收参数"
            type="warning"
            show-icon
            :closable="false"
          />
        </n-form-item>
        <n-form-item
          label="请求地址"
          :path="`task${listener.type}ListenerPath`"
          :rules="{
            required: true,
            message: '请求地址不能为空',
            trigger: 'blur'
          }"
        >
          <n-input v-model:value="configForm[`task${listener.type}ListenerPath`]" />
        </n-form-item>
        <HttpRequestParamSetting
          :header="configForm[`task${listener.type}Listener`].header"
          :body="configForm[`task${listener.type}Listener`].body"
          :bind="`task${listener.type}Listener`"
        />
      </div>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import HttpRequestParamSetting from './HttpRequestParamSetting.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  formFieldOptions: {
    type: Object,
    required: true
  }
})
const emit = defineEmits(['update:modelValue'])
const listenerFormRef = ref()
const configForm = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emit('update:modelValue', newValue)
  }
})
const taskListener = ref([
  {
    name: '创建任务',
    type: 'Create'
  },
  {
    name: '指派任务执行人员',
    type: 'Assign'
  },
  {
    name: '完成任务',
    type: 'Complete'
  }
])

const validate = async () => {
  if (!listenerFormRef) return false
  return await listenerFormRef.value.validate()
}

defineExpose({ validate })
</script>
