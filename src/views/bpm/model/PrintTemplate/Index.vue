<script setup lang="ts">
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { setupWangEditorPlugin } from './index'
import MentionModal from './MentionModal.vue'
import '@wangeditor/editor/dist/css/style.css'

setupWangEditorPlugin()

const emit = defineEmits<{ confirm: [template: string] }>()

const dialogVisible = ref(false)
const valueHtml = ref('')
const editorRef = shallowRef<IDomEditor>()
const isShowModal = ref(false)

const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: ['group-video'],
  insertKeys: {
    index: 31,
    keys: ['ProcessRecordMenu'],
  },
}

const editorConfig = computed<Partial<IEditorConfig>>(() => ({
  placeholder: '请输入内容... 输入 @ 可插入流程字段',
  EXTEND_CONF: {
    mentionConfig: {
      showModal: () => { isShowModal.value = true },
      hideModal: () => { isShowModal.value = false },
    },
  },
}))

function insertMention(id: string, name: string) {
  const editor = editorRef.value
  if (!editor)
    return
  editor.restoreSelection()
  editor.deleteBackward('character')
  editor.insertNode({
    type: 'mention',
    value: name,
    info: { id },
    children: [{ text: '' }],
  } as any)
  editor.move(1)
}

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor
}

const open = async (template: string) => {
  dialogVisible.value = true
  valueHtml.value = template || ''
}
defineExpose({ open })

function handleConfirm() {
  emit('confirm', valueHtml.value)
  dialogVisible.value = false
}

watch(dialogVisible, (show) => {
  if (!show)
    isShowModal.value = false
})

onBeforeUnmount(() => {
  editorRef.value?.destroy()
  editorRef.value = undefined
})
</script>

<template>
  <n-modal
    v-model:show="dialogVisible"
    preset="card"
    title="编辑打印模板"
    :bordered="false"
    :segmented="{ content: true, footer: 'soft' }"
    style="width: 92vw; max-width: 1100px"
  >
    <n-alert type="info" :show-icon="true" :closable="false" class="mb-12px">
      输入 @ 可插入流程字段与表单字段；工具栏「流程记录」可插入审批流转占位，打印时自动替换。
    </n-alert>
    <div class="print-template-editor">
      <Toolbar
        :editor="editorRef"
        :default-config="toolbarConfig"
        mode="default"
        class="print-template-editor__toolbar"
      />
      <Editor
        v-model="valueHtml"
        :default-config="editorConfig"
        mode="default"
        class="print-template-editor__body"
        @on-created="handleCreated"
      />
      <MentionModal
        v-if="isShowModal"
        @hide-mention-modal="isShowModal = false"
        @insert-mention="insertMention"
      />
    </div>
    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 8px">
        <n-button @click="dialogVisible = false">取 消</n-button>
        <n-button type="primary" @click="handleConfirm">确 定</n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped>
.print-template-editor {
  border: 1px solid var(--n-border-color, #e0e0e6);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}
.print-template-editor__toolbar {
  border-bottom: 1px solid var(--n-border-color, #e0e0e6);
}
.print-template-editor__body {
  height: 480px;
  overflow-y: hidden;
}
</style>
