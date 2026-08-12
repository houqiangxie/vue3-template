<script setup lang="ts">
import type { UploadFileInfo } from 'naive-ui'
import { CloudUploadOutline, DownloadOutline } from '@vicons/ionicons5'
import { NAlert, NButton, NIcon, NSpace, NUpload, NUploadDragger, NP } from 'naive-ui'
import CommonModal from '@/components/common/modal/CommonModal.vue'

const props = withDefaults(defineProps<{
  title?: string
  /** 提示文案 */
  tip?: string
  /** 接受的文件类型 */
  accept?: string
  /** 模板下载：URL 或回调 */
  templateUrl?: string
  onDownloadTemplate?: () => void | Promise<void>
  /**
   * 导入处理（上传文件到后端）：
   * - 抛错表示失败
   */
  onImport?: (file: File) => void | Promise<void | { success?: number, failure?: number, message?: string }>
  /** 最大文件大小 MB */
  maxSizeMb?: number
}>(), {
  title: '导入数据',
  tip: '仅允许导入 xls、xlsx 格式文件。',
  accept: '.xls,.xlsx',
  maxSizeMb: 10,
})

const emit = defineEmits<{
  success: [payload: { file: File, result?: unknown }]
  cancel: []
}>()

const show = defineModel<boolean>('show', { default: false })

const { message } = useConfirm()
const loading = ref(false)
const fileList = ref<UploadFileInfo[]>([])
const selectedFile = ref<File | null>(null)

watch(show, (visible) => {
  if (!visible) {
    fileList.value = []
    selectedFile.value = null
    loading.value = false
  }
})

function beforeUpload(data: { file: UploadFileInfo, fileList: UploadFileInfo[] }) {
  const raw = data.file.file
  if (!raw) {
    message.error('无法读取文件')
    return false
  }
  if (!/\.(xls|xlsx)$/i.test(raw.name)) {
    message.error('文件格式不正确，请上传 xls / xlsx')
    return false
  }
  if (raw.size > props.maxSizeMb * 1024 * 1024) {
    message.error(`文件大小不能超过 ${props.maxSizeMb}MB`)
    return false
  }
  selectedFile.value = raw
  fileList.value = [data.file]
  return false
}

async function handleDownloadTemplate() {
  if (props.onDownloadTemplate) {
    await props.onDownloadTemplate()
    return
  }
  if (props.templateUrl) {
    const { download } = useDownload()
    await download(props.templateUrl, { filename: 'import-template.xlsx' })
  }
}

async function handleConfirm() {
  if (!selectedFile.value) {
    message.warning('请先选择文件')
    return
  }
  loading.value = true
  try {
    let result: unknown
    if (props.onImport)
      result = await props.onImport(selectedFile.value)

    const summary = result && typeof result === 'object'
      ? result as { success?: number, failure?: number, message?: string }
      : undefined
    if (summary?.message)
      message.success(summary.message)
    else if (summary?.success != null)
      message.success(`导入完成：成功 ${summary.success} 条${summary.failure ? `，失败 ${summary.failure} 条` : ''}`)
    else
      message.success('导入成功')

    emit('success', { file: selectedFile.value, result })
    show.value = false
  }
  catch (e) {
    const msg = e instanceof Error ? e.message : '导入失败'
    message.error(msg)
  }
  finally {
    loading.value = false
  }
}

function handleCancel() {
  show.value = false
  emit('cancel')
}
</script>

<template>
  <CommonModal
    v-model:show="show"
    :title="title"
    :width="520"
    :loading="loading"
    confirm-text="确定导入"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <NSpace vertical :size="16">
      <NAlert type="info" :bordered="false">
        {{ tip }}
      </NAlert>

      <NSpace>
        <NButton
          v-if="templateUrl || onDownloadTemplate"
          secondary
          @click="handleDownloadTemplate"
        >
          <template #icon>
            <NIcon><DownloadOutline /></NIcon>
          </template>
          下载模板
        </NButton>
      </NSpace>

      <NUpload
        :default-upload="false"
        :max="1"
        :accept="accept"
        :file-list="fileList"
        @before-upload="beforeUpload"
        @update:file-list="(list) => { fileList = list; if (!list.length) selectedFile = null }"
      >
        <NUploadDragger>
          <div class="excel-import__drag">
            <NIcon size="40" depth="3"><CloudUploadOutline /></NIcon>
            <NP depth="3" style="margin: 8px 0 0">
              点击或拖拽文件到此处
            </NP>
          </div>
        </NUploadDragger>
      </NUpload>
    </NSpace>
  </CommonModal>
</template>

<style scoped>
.excel-import__drag {
  padding: 12px 0;
  text-align: center;
}
</style>
