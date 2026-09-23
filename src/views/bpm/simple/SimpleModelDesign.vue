<template>
  <div class="simple-model-design">
    <SimpleProcessDesigner
      :model-name="modelName"
      :model-form-id="modelFormId"
      :model-form-type="modelFormType"
      :start-user-ids="startUserIds"
      :start-dept-ids="startDeptIds"
      @success="handleSuccess"
      ref="designerRef"
    />
  </div>
</template>
<script setup lang="ts">
import { SimpleProcessDesigner } from '@/components/SimpleProcessDesignerV2/src/'

defineOptions({
  name: 'SimpleModelDesign'
})

defineProps<{
  modelName?: string
  modelFormId?: number
  modelFormType?: number
  startUserIds?: number[]
  startDeptIds?: number[]
}>()

const emit = defineEmits(['success'])
const designerRef = ref()

const handleSuccess = (data?: any) => {
  if (data) {
    emit('success', data)
  }
}

const validateAndSync = async () => {
  return await designerRef.value?.validateAndSync?.()
}

const refresh = () => {
  designerRef.value?.refresh?.()
}

defineExpose({ validateAndSync, refresh })
</script>
<style scoped>
.simple-model-design {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.simple-model-design > :deep(*) {
  flex: 1;
  min-height: 0;
  height: 100%;
}
</style>
