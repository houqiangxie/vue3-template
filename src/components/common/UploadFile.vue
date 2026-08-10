<script setup lang="ts">
import type { UploadCustomRequestOptions, UploadFileInfo } from 'naive-ui'
import {
  NButton,
  NImage,
  NUpload,
  NUploadDragger,
  useMessage,
} from 'naive-ui'
import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue'
import {
  formatFileTypeTip,
  formatFileUrl,
  getAuthHeaders,
  isImageFileName,
  isImageOnlyTypes,
  resolveFileId,
  resolveFileName,
  parseFileTypeProp,
  resolveFileTypes,
  type UploadedFileItem,
} from '@/utils/file'

const FilePreviewModal = defineAsyncComponent(() => import('./FilePreviewModal.vue'))

const props = withDefaults(defineProps<{
  value?: UploadedFileItem | UploadedFileItem[] | string | null
  limit?: number
  fileSize?: number
  fileType?: string
  isShowTip?: boolean
  showList?: boolean
  disabled?: boolean
  reupload?: boolean
  drag?: boolean
  buttonText?: string
  currentFileType?: string | number
  uploadSource?: number
}>(), {
  limit: 5,
  fileSize: 0,
  fileType: 'img,office,pdf',
  isShowTip: true,
  showList: true,
  disabled: false,
  reupload: false,
  drag: false,
  buttonText: '选取文件',
  uploadSource: 2,
})

const emit = defineEmits<{
  'update:value': [value: UploadedFileItem[]]
}>()

const message = useMessage()
const uploadRef = ref<InstanceType<typeof NUpload> | null>(null)
const uploadFileList = ref<UploadFileInfo[]>([])
const uploadingCount = ref(0)
const previewVisible = ref(false)
const previewUrl = ref('')
const previewFilename = ref('')
const previewTitle = ref('文件预览')
const imagePreviewRef = ref<InstanceType<typeof NImage> | null>(null)
const imagePreviewSrc = ref('')

type UploadFileInfoWithMeta = UploadFileInfo & { uploadedMeta?: UploadedFileItem }

const uploadUrl = `${import.meta.env.VITE_baseUrl}/system/sys/file/upload`
const fileTypeTokens = computed(() => parseFileTypeProp(props.fileType))
const resolvedFileTypes = computed(() => resolveFileTypes(props.fileType))
const fileTypeTip = computed(() => formatFileTypeTip(props.fileType))
const imageOnly = computed(() => isImageOnlyTypes(resolvedFileTypes.value))
const listType = computed(() => (imageOnly.value ? 'image-card' : 'text'))
const accept = computed(() => resolvedFileTypes.value.map(type => `.${type}`).join(','))
const showTip = computed(() => props.isShowTip && (fileTypeTokens.value.length > 0 || props.fileSize > 0))
const maxCount = computed(() => (props.reupload ? 1 : props.limit))
/** Naive UI onFinish 可能重建列表项，自定义字段会丢失，用 Map 兜底 */
const uploadedMetaMap = new Map<string, UploadedFileItem>()

function createUid(seed = Date.now()) {
  return `${seed}-${Math.random().toString(36).slice(2, 8)}`
}

function resolvePreviewUrl(fileId: string, name: string) {
  return formatFileUrl(fileId, name.includes('mp4'))
}

function toUploadedItem(item: UploadedFileItem, index = 0): UploadedFileItem {
  const fileId = resolveFileId(item)
  const name = resolveFileName(item)
  return {
    ...item,
    uid: item.uid ?? createUid(index),
    name,
    fileName: item.fileName ?? name,
    url: fileId,
    fileUrl: item.fileUrl ?? fileId,
    fileId: item.fileId ?? fileId,
    filePath: item.filePath ?? fileId,
  }
}

function resolveUploadPreviewUrl(file: UploadFileInfo) {
  const meta = (file as UploadFileInfoWithMeta).uploadedMeta ?? uploadedMetaMap.get(file.id)
  if (meta) {
    const name = resolveFileName(meta)
    return resolvePreviewUrl(resolveFileId(meta), name)
  }

  if (file.thumbnailUrl)
    return file.thumbnailUrl

  const existing = normalizeModelValue(props.value).find(
    candidate => resolveFileName(candidate) === file.name || String(candidate.uid) === file.id,
  )
  if (existing) {
    const name = resolveFileName(existing)
    return resolvePreviewUrl(resolveFileId(existing), name)
  }

  return ''
}

function toUploadFileInfo(item: UploadedFileItem, index = 0): UploadFileInfo {
  const normalized = toUploadedItem(item, index)
  const fileId = resolveFileId(normalized)
  const name = resolveFileName(normalized)
  const preview = resolvePreviewUrl(fileId, name)
  const info: UploadFileInfoWithMeta = {
    id: String(normalized.uid ?? createUid(index)),
    name,
    status: 'finished',
    thumbnailUrl: isImageFileName(name) ? preview : undefined,
    uploadedMeta: normalized,
  }
  return info
}

function normalizeModelValue(value: typeof props.value): UploadedFileItem[] {
  if (!value)
    return []
  const list = Array.isArray(value) ? value : [value]
  return list.map((item, index) => {
    if (typeof item === 'string')
      return toUploadedItem({ name: item, url: item }, index)
    return toUploadedItem(item, index)
  })
}

function emitModelValue(items: UploadedFileItem[]) {
  const normalized = items
    .filter(item => resolveFileId(item))
    .map((item, index) => toUploadedItem(item, index))

  const output = props.reupload
    ? (normalized.length ? [normalized[normalized.length - 1]] : [])
    : normalized

  emit('update:value', output)
}

function syncUploadListFromModel(value: typeof props.value) {
  const list = normalizeModelValue(value).map(toUploadFileInfo)
  uploadedMetaMap.clear()
  list.forEach((item) => {
    const meta = (item as UploadFileInfoWithMeta).uploadedMeta
    if (meta)
      uploadedMetaMap.set(item.id, meta)
  })
  uploadFileList.value = list
}

watch(
  () => props.value,
  value => syncUploadListFromModel(value),
  { deep: true, immediate: true },
)

function validateFile(file: File) {
  if (resolvedFileTypes.value.length) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!resolvedFileTypes.value.includes(ext)) {
      message.error(`文件格式不正确，请上传 ${fileTypeTip.value} 格式文件`)
      return false
    }
  }

  if (props.fileSize) {
    const maxBytes = props.fileSize * 1024 * 1024
    if (file.size > maxBytes) {
      message.error(`上传文件大小不能超过 ${props.fileSize} MB`)
      return false
    }
  }

  return true
}

function buildUploadedFile(res: Record<string, any>, file: File): UploadedFileItem {
  const data = res?.data ?? {}
  const fileId = data.id ?? data.fileId ?? data.filePath ?? data.url ?? ''
  const fileName = data.fileName ?? data.name ?? file.name

  const fileObj: UploadedFileItem = {
    name: fileName,
    fileName,
    url: fileId,
    fileUrl: fileId,
    fileId,
    filePath: fileId,
    fileSize: file.size,
    fileType: data.fileType,
    uid: createUid(),
  }

  if (props.currentFileType || props.currentFileType === 0)
    fileObj.type = props.currentFileType

  return fileObj
}

function bindUploadedMeta(file: UploadFileInfo, uploaded: UploadedFileItem) {
  const name = resolveFileName(uploaded)
  const preview = resolvePreviewUrl(resolveFileId(uploaded), name)
  file.name = name || file.name
  file.status = 'finished'
  if (isImageFileName(name))
    file.thumbnailUrl = preview
  ;(file as UploadFileInfoWithMeta).uploadedMeta = uploaded
  uploadedMetaMap.set(file.id, uploaded)
}

async function customRequest(options: UploadCustomRequestOptions) {
  const { file, onFinish, onError } = options
  const rawFile = file.file

  if (!rawFile || !validateFile(rawFile)) {
    onError()
    return
  }

  const authHeaders = getAuthHeaders()
  if (!authHeaders.token) {
    message.error('未登录，无法上传文件')
    onError()
    return
  }

  const formData = new FormData()
  formData.append('file', rawFile)
  formData.append('uploadSource', String(props.uploadSource))

  uploadingCount.value += 1
  const loadingMessage = message.loading('正在上传文件，请稍候...', { duration: 0 })

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    })

    const res = await response.json()

    if (response.status === 401 || res.code === 401) {
      message.error('登录失效，请重新登录')
      onError()
      return
    }

    // 业务成功码：模板统一为 0；兼容部分旧上传接口返回 200
    if (res.code !== 0 && res.code !== 200) {
      message.error(res.msg || '上传文件失败')
      onError()
      return
    }

    const uploaded = buildUploadedFile(res, rawFile)
    if (!resolveFileId(uploaded)) {
      message.error('上传成功但未返回文件标识')
      onError()
      return
    }

    bindUploadedMeta(file, uploaded)
    onFinish()
    // onFinish 后列表项可能被重建，再写一次 meta，避免 PDF 等无 thumbnail 时被 emit 过滤掉
    const listItem = uploadFileList.value.find(item => item.id === file.id)
    if (listItem)
      bindUploadedMeta(listItem, uploaded)
  }
  catch {
    message.error('上传文件失败')
    onError()
  }
  finally {
    uploadingCount.value = Math.max(0, uploadingCount.value - 1)
    loadingMessage.destroy()
    tryEmitModelValue()
  }
}

function resolveItemMeta(item: UploadFileInfo): UploadedFileItem | undefined {
  return (item as UploadFileInfoWithMeta).uploadedMeta ?? uploadedMetaMap.get(item.id)
}

function collectUploadedItems(list: UploadFileInfo[]) {
  return list
    .filter(item => item.status === 'finished')
    .map((item) => {
      const meta = resolveItemMeta(item)
      if (meta)
        return toUploadedItem(meta)

      const existing = normalizeModelValue(props.value).find(
        candidate => resolveFileName(candidate) === item.name || String(candidate.uid) === item.id,
      )
      if (existing)
        return toUploadedItem(existing)

      return toUploadedItem({
        uid: item.id,
        name: item.name,
        url: item.thumbnailUrl || undefined,
      })
    })
    .filter(item => resolveFileId(item))
}

function tryEmitModelValue() {
  if (uploadingCount.value > 0)
    return
  emitModelValue(collectUploadedItems(uploadFileList.value))
}

function handleRemove({ file }: { file: UploadFileInfo }) {
  uploadedMetaMap.delete(file.id)
  uploadFileList.value = uploadFileList.value.filter(item => item.id !== file.id)
  tryEmitModelValue()
}

function handleExceed() {
  message.error(`上传文件数量不能超过 ${props.limit} 个`)
}

async function handlePreview(
  file: UploadFileInfo,
  detail?: { event?: MouseEvent },
) {
  detail?.event?.preventDefault()
  detail?.event?.stopPropagation()

  const name = file.name || ''
  const url = resolveUploadPreviewUrl(file)
  if (!url)
    return

  if (isImageFileName(name)) {
    imagePreviewSrc.value = url
    await nextTick()
    imagePreviewRef.value?.showPreview()
    return
  }

  previewTitle.value = name || '文件预览'
  previewFilename.value = name
  previewUrl.value = url
  previewVisible.value = true
}

</script>

<template>
  <div class="upload-file">
    <div class="upload-file__trigger w-full">
      <slot name="pre" />
      <NUpload
        ref="uploadRef"
        v-model:file-list="uploadFileList"
        :accept="accept"
        :custom-request="customRequest"
        :disabled="disabled"
        :list-type="listType"
        :max="maxCount"
        :multiple="!reupload"
        :show-file-list="showList"
        :show-preview-button="true"
        :show-trigger="(uploadFileList.length < maxCount || reupload) && !disabled"
        name="file"
        @exceed="handleExceed"
        @preview="handlePreview"
        @remove="handleRemove"
      >
        <template v-if="drag">
          <slot>
            <NUploadDragger>
              <div class="upload-file__drag-content">
                <div class="upload-file__drag-icon">
                  +
                </div>
                <div class="upload-file__drag-text">
                  {{ buttonText }}
                </div>
              </div>
            </NUploadDragger>
          </slot>
        </template>
        <template v-else-if="!imageOnly">
          <slot>
            <NButton type="primary">
              {{ buttonText }}
            </NButton>
          </slot>
        </template>
      </NUpload>
      <slot name="next" />
    </div>

    <div v-if="uploadFileList.length < 1 && showTip && !disabled" class="upload-file__tip">
      请上传
      <template v-if="fileSize">
        大小不超过 <b class="upload-file__tip-highlight">{{ fileSize }}MB</b>
      </template>
      <template v-if="fileTypeTokens.length">
        格式为 <b class="upload-file__tip-highlight">{{ fileTypeTip }}</b>
      </template>
      的文件
    </div>

    <NImage
      v-if="imagePreviewSrc"
      ref="imagePreviewRef"
      :src="imagePreviewSrc"
      :preview-src="imagePreviewSrc"
      class="upload-file__image-preview"
    />

    <FilePreviewModal
      v-if="previewVisible"
      v-model:show="previewVisible"
      :title="previewTitle"
      :url="previewUrl"
      :filename="previewFilename"
    />
  </div>
</template>

<style scoped lang="scss">
.upload-file {
  width: 100%;

  &__trigger {
    display: inline-flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 5px;
  }

  &__tip {
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
    pointer-events: none;
  }

  &__tip-highlight {
    color: #d03050;
  }

  &__drag-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80px;
    padding: 8px;
  }

  &__drag-icon {
    font-size: 20px;
    color: #909399;
    margin-bottom: 4px;
  }

  &__drag-text {
    font-size: 13px;
    color: #606266;
  }

  :deep(.n-upload-trigger) {
    display: inline-flex;
  }

  :deep(.n-upload-file-list--text) {
    margin-top: 8px;
  }

  // image-card 缩略图外包了 <a>，内部 NImage 也会响应点击；禁用后直接走 @preview
  :deep(.n-upload-file--image-card-type .n-upload-file-info__thumbnail .n-image) {
    pointer-events: none;
  }

  &__image-preview {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
    pointer-events: none;
  }
}
</style>
