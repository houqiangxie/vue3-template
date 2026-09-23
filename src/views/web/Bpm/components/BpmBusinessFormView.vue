<template>
  <div class="bpm-business-form-view">
    <component
      :is="comp"
      v-if="comp"
      :id="businessKey"
      v-bind="extraProps"
    />
    <n-alert v-else type="warning" title="无法加载业务表单">
      未找到组件：{{ path || '（空路径）' }}。请配置为类似
      <code>bpm/oa/leave/detail.vue</code>
      的视图路径。
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { resolveBusinessFormComponent } from '../utils/businessForm'

defineOptions({ name: 'BpmBusinessFormView' })

const props = defineProps<{
  path?: string
  businessKey?: string | number
  extraProps?: Record<string, unknown>
}>()

const comp = computed(() => resolveBusinessFormComponent(props.path))
</script>
