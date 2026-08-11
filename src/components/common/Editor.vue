<script setup lang="ts">
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { formatFileUrl, getAuthHeaders, resolveFileId } from '@/utils/file'
import '@wangeditor/editor/dist/css/style.css'

const props = withDefaults(defineProps<{
  disabled?: boolean
  readonly?: boolean
  height?: number | string
  placeholder?: string
  mode?: 'default' | 'simple'
}>(), {
  disabled: false,
  readonly: false,
  height: 320,
  placeholder: '请输入内容',
  mode: 'default',
})

const value = defineModel<string>('value', { default: '' })

const editorRef = shallowRef<IDomEditor>()
const uploadUrl = `${import.meta.env.VITE_baseUrl}/system/sys/file/upload`

const editorHeight = computed(() => {
  const h = props.height
  return typeof h === 'number' ? `${h}px` : h
})

const toolbarConfig: Partial<IToolbarConfig> = {}

async function uploadImageFile(
  file: File,
  insertFn: (url: string, alt: string, href: string) => void,
) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('uploadSource', '2')

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  })
  if (!response.ok)
    throw new Error(`上传失败 (${response.status})`)

  const res = await response.json() as {
    code?: number
    data?: Record<string, string>
    message?: string
    msg?: string
  }
  if (res.code !== undefined && res.code !== 0)
    throw new Error(res.message || res.msg || '上传失败')

  const data = (res.data ?? res) as Record<string, string>
  const fileId = resolveFileId({
    fileId: data.id ?? data.fileId,
    filePath: data.filePath,
    url: data.url,
    fileUrl: data.fileUrl,
  })
  if (!fileId)
    throw new Error('上传成功但未返回文件标识')

  const url = formatFileUrl(fileId)
  const name = data.fileName ?? data.name ?? file.name
  insertFn(url, name, url)
}

const editorConfig = computed<Partial<IEditorConfig>>(() => ({
  placeholder: props.placeholder,
  readOnly: props.disabled || props.readonly,
  MENU_CONF: {
    uploadImage: {
      customUpload: uploadImageFile,
    },
  },
}))

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor
  if (props.disabled || props.readonly)
    editor.disable()
}

watch(
  () => [props.disabled, props.readonly] as const,
  ([disabled, readonly]) => {
    const editor = editorRef.value
    if (!editor)
      return
    if (disabled || readonly)
      editor.disable()
    else
      editor.enable()
  },
)

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (!editor)
    return
  editor.destroy()
  editorRef.value = undefined
})
</script>

<template>
  <div class="rich-editor" :class="{ 'rich-editor--disabled': disabled || readonly }">
    <Toolbar
      :editor="editorRef"
      :default-config="toolbarConfig"
      :mode="mode"
      class="rich-editor__toolbar"
    />
    <Editor
      v-model="value"
      :default-config="editorConfig"
      :mode="mode"
      :style="{ height: editorHeight, overflowY: 'hidden' }"
      class="rich-editor__body"
      @on-created="handleCreated"
    />
  </div>
</template>

<style scoped lang="scss">
.rich-editor {
  width: 100%;
  border: 1px solid var(--n-border-color, #e0e0e6);
  border-radius: 3px;
  overflow: hidden;
  background: var(--n-color, #fff);

  &__toolbar {
    border-bottom: 1px solid var(--n-border-color, #e0e0e6);
  }

  &--disabled {
    opacity: 0.85;
  }

  :deep(.w-e-text-container) {
    background: transparent;
  }
}
</style>
