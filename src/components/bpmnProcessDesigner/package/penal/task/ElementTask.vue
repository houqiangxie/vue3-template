<template>
  <div class="panel-tab__content">
    <n-form size="small" label-width="90px">
      <!-- add by 芋艿：由于「异步延续」暂时用不到，所以这里 display 为 none -->
      <n-form-item label="异步延续" style="display: none">
        <n-checkbox
          v-model:checked="taskConfigForm.asyncBefore"
          @update:checked="changeTaskAsync"
        >
          异步前
        </n-checkbox>
        <n-checkbox
          v-model:checked="taskConfigForm.asyncAfter"
          @update:checked="changeTaskAsync"
        >
          异步后
        </n-checkbox>
        <n-checkbox
          v-model:checked="taskConfigForm.exclusive"
          v-if="taskConfigForm.asyncAfter || taskConfigForm.asyncBefore"
          @update:checked="changeTaskAsync"
        >
          排除
        </n-checkbox>
      </n-form-item>
      <component :is="witchTaskComponent" v-bind="$props" />
    </n-form>
  </div>
</template>

<script lang="ts" setup>
import { installedComponent } from './data'

defineOptions({ name: 'ElementTaskConfig' })

const props = defineProps({
  id: String,
  type: String
})
const taskConfigForm = ref({
  asyncAfter: false,
  asyncBefore: false,
  exclusive: false
})
const witchTaskComponent = ref()

const bpmnElement = ref()

const bpmnInstances = () => (window as any).bpmnInstances
const changeTaskAsync = () => {
  if (!taskConfigForm.value.asyncBefore && !taskConfigForm.value.asyncAfter) {
    taskConfigForm.value.exclusive = false
  }
  bpmnInstances().modeling.updateProperties(bpmnInstances().bpmnElement, {
    ...taskConfigForm.value
  })
}

watch(
  () => props.id,
  () => {
    bpmnElement.value = bpmnInstances().bpmnElement
    taskConfigForm.value.asyncBefore = bpmnElement.value?.businessObject?.asyncBefore
    taskConfigForm.value.asyncAfter = bpmnElement.value?.businessObject?.asyncAfter
    taskConfigForm.value.exclusive = bpmnElement.value?.businessObject?.exclusive
  },
  { immediate: true }
)
watch(
  () => props.type,
  () => {
    if (props.type) {
      witchTaskComponent.value = installedComponent[props.type].component
    }
  },
  { immediate: true }
)
</script>
