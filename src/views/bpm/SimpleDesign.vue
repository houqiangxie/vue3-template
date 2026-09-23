<template>
  <div class="bpm-page">
    <div class="bpm-page__bar">
      <n-button text @click="$router.push('/')">← 返回</n-button>
      <span class="bpm-page__title">简易流程设计器</span>
    </div>
    <div class="bpm-page__canvas">
      <SimpleProcessDesigner
        :model-name="modelName"
        :model-form-type="BpmModelFormType.CUSTOM"
        :start-user-ids="[]"
        :start-dept-ids="[]"
        @success="onSuccess"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { SimpleProcessDesigner } from '@/components/SimpleProcessDesignerV2/src/'
import { BpmModelFormType } from '@/utils/constants'
import { useMessage } from 'naive-ui'

defineOptions({ name: 'BpmSimpleDesignPage' })

const message = useMessage()
const modelName = '示例审批流'
const processData = ref<unknown>(null)
provide('processData', processData)

function onSuccess(data?: unknown) {
  processData.value = data
  message.success('流程模型已更新（本地预览）')
}
</script>

<style scoped>
.bpm-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--n-color, #f5f7fb);
  color: var(--n-text-color, #111827);
}
.bpm-page__bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--n-color, #fff);
  border-bottom: 1px solid var(--n-border-color, #e5e7eb);
}
.bpm-page__title {
  font-weight: 600;
  color: var(--n-text-color, #111827);
}
.bpm-page__canvas {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.bpm-page__canvas > :deep(*) {
  flex: 1;
  min-height: 0;
  height: 100%;
}

:global(html.dark) .bpm-page {
  background: #101014;
}
:global(html.dark) .bpm-page__bar {
  background: #18181c;
  border-bottom-color: rgba(255, 255, 255, 0.09);
}
</style>
