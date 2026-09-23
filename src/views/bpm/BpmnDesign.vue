<template>
  <div class="bpm-page">
    <div class="bpm-page__bar">
      <n-button text @click="$router.push('/')">← 返回</n-button>
      <span class="bpm-page__title">BPMN 设计器</span>
      <n-button type="primary" size="small" class="ml-auto" @click="triggerSave">保存 XML</n-button>
    </div>
    <div class="bpmn-wrap">
      <MyProcessDesigner
        key="designer"
        v-model="xmlString"
        :value="xmlString"
        v-bind="controlForm"
        keyboard
        ref="processDesigner"
        :additional-model="controlForm.additionalModel"
        :model="model"
        :process-id="modelKey"
        :process-name="modelName"
        @init-finished="initModeler"
        @save="onSave"
      />
      <MyProcessPenal
        v-if="modeler"
        key="penal"
        :bpmn-modeler="modeler"
        :prefix="controlForm.prefix"
        class="process-panel"
        :model="model"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { MyProcessDesigner, MyProcessPenal } from '@/components/bpmnProcessDesigner/package'
import CustomContentPadProvider from '@/components/bpmnProcessDesigner/package/designer/plugins/content-pad'
import CustomPaletteProvider from '@/components/bpmnProcessDesigner/package/designer/plugins/palette'
import { BpmModelFormType } from '@/utils/constants'
import { useMessage } from 'naive-ui'

defineOptions({ name: 'BpmnDesignPage' })

const message = useMessage()
const modelKey = 'Process_demo'
const modelName = '示例 BPMN 流程'
const xmlString = ref('')
const modeler = shallowRef()
const processDesigner = ref<{ processSave?: () => void } | null>(null)

provide('processData', xmlString)
provide('modelData', ref({
  id: undefined,
  key: modelKey,
  name: modelName,
  formType: BpmModelFormType.CUSTOM,
  formId: undefined,
}))
provide('formFields', ref<string[]>([]))
provide('formType', ref(BpmModelFormType.CUSTOM))

const model = ref({
  id: undefined as number | undefined,
  key: modelKey,
  name: modelName,
  formType: BpmModelFormType.CUSTOM,
})

const controlForm = ref({
  simulation: true,
  labelEditing: false,
  labelVisible: false,
  prefix: 'flowable',
  headerButtonSize: 'small' as const,
  additionalModel: [CustomContentPadProvider, CustomPaletteProvider],
})

function initModeler(item: unknown) {
  modeler.value = item
}

function onSave(bpmnXml: string) {
  xmlString.value = bpmnXml
  message.success('BPMN XML 已保存到本地状态')
}

function triggerSave() {
  processDesigner.value?.processSave?.()
}
</script>

<style scoped>
.bpm-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--n-color, #f5f7fb);
  color: var(--n-text-color, #111827);
}
.bpm-page__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--n-color, #fff);
  border-bottom: 1px solid var(--n-border-color, #e5e7eb);
  flex-shrink: 0;
}
.bpm-page__title {
  font-weight: 600;
  color: var(--n-text-color, #111827);
}
.ml-auto {
  margin-left: auto;
}
.bpmn-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  height: calc(100vh - 49px);
  background: var(--n-color, transparent);
}
.process-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 10;
}

:global(html.dark) .bpm-page {
  background: #101014;
}
:global(html.dark) .bpm-page__bar {
  background: #18181c;
  border-bottom-color: rgba(255, 255, 255, 0.09);
}
</style>
