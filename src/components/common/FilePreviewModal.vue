<script setup lang="ts">
import { FileViewer } from '@file-viewer/vue3'
import officePreset from '@file-viewer/preset-office'
import '@file-viewer/vue3/dist/file-viewer3.css'
import { NSpin } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import CommonModal from './CommonModal.vue'
import { fetchPreviewFile } from '@/utils/file'

const props = withDefaults(defineProps<{
  title?: string
  url?: string
  /** 带扩展名的文件名，用于 previewFile 这类无后缀 URL 选择渲染器 */
  filename?: string
}>(), {
  title: '文件预览',
})

const show = defineModel<boolean>('show', { default: false })

const previewFile = ref<File | null>(null)
const loading = ref(false)
const error = ref('')

const viewerOptions = computed(() => ({
  preset: officePreset,
  rendererMode: 'replace' as const,
  theme: 'light' as const,
  toolbar: { position: 'bottom-right' as const },
}))

let loadSeq = 0

async function loadPreview(url: string, filename: string) {
  const seq = ++loadSeq
  loading.value = true
  error.value = ''
  previewFile.value = null

  try {
    const file = await fetchPreviewFile(url, filename)
    if (seq !== loadSeq)
      return
    previewFile.value = file
  }
  catch (e) {
    if (seq !== loadSeq)
      return
    error.value = e instanceof Error ? e.message : '文件加载失败'
  }
  finally {
    if (seq === loadSeq)
      loading.value = false
  }
}

watch(
  [show, () => props.url, () => props.filename],
  ([visible, url, filename]) => {
    if (visible && url?.trim()) {
      loadPreview(url.trim(), filename?.trim() || 'file')
      return
    }
    loadSeq += 1
    previewFile.value = null
    error.value = ''
    loading.value = false
  },
  { immediate: true },
)
</script>

<template>
  <CommonModal
    v-model:show="show"
    :title="title"
    :width="'min(96vw, 1200px)'"
    :max-height="'min(85vh, 780px)'"
    :show-footer="false"
    destroy-on-close
  >
    <NSpin :show="loading" class="file-preview-modal__spin">
      <div v-if="error" class="file-preview-modal__error">
        {{ error }}
      </div>
      <div v-else-if="show && previewFile" class="file-preview-modal__viewer">
        <FileViewer
          :file="previewFile"
          :filename="filename"
          :options="viewerOptions"
        />
      </div>
    </NSpin>
  </CommonModal>
</template>

<style scoped lang="scss">
.file-preview-modal__spin {
  margin: -16px;
  width: calc(100% + 32px);
  height: min(80vh, 720px);
}

.file-preview-modal__viewer {
  width: 100%;
  height: min(80vh, 720px);
}

.file-preview-modal__error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: min(80vh, 720px);
  color: var(--n-text-color-3);
}
</style>
