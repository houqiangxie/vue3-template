<script setup lang="ts">
import { NButton, NSlider, NSpace, NUpload, NUploadDragger, NP, NIcon } from 'naive-ui'
import { CloudUploadOutline } from '@vicons/ionicons5'
import CommonModal from '@/components/common/modal/CommonModal.vue'

const props = withDefaults(defineProps<{
  title?: string
  /** 裁剪宽高比，默认 1 */
  aspectRatio?: number
  /** 输出边长（正方形）或宽度 */
  outputSize?: number
  /** 输出类型 */
  mimeType?: string
  quality?: number
}>(), {
  title: '图片裁剪',
  aspectRatio: 1,
  outputSize: 200,
  mimeType: 'image/jpeg',
  quality: 0.92,
})

const emit = defineEmits<{
  confirm: [payload: { blob: Blob, dataUrl: string, file: File }]
  cancel: []
}>()

const show = defineModel<boolean>('show', { default: false })
const { message } = useConfirm()

const sourceUrl = ref('')
const sourceFile = ref<File | null>(null)
const imgNatural = ref({ w: 0, h: 0 })
const scale = ref(1)
const offset = ref({ x: 0, y: 0 })
const dragging = ref(false)
const lastPos = ref({ x: 0, y: 0 })
const frameSize = 280

const imgStyle = computed(() => {
  const { w, h } = imgNatural.value
  if (!w || !h)
    return {}
  const frameH = frameSize / props.aspectRatio
  const base = Math.max(frameSize / w, frameH / h) * scale.value
  return {
    width: `${w * base}px`,
    height: `${h * base}px`,
    left: '50%',
    top: '50%',
    transform: `translate(calc(-50% + ${offset.value.x}px), calc(-50% + ${offset.value.y}px))`,
  }
})

watch(show, (v) => {
  if (!v)
    reset()
})

function reset() {
  if (sourceUrl.value)
    URL.revokeObjectURL(sourceUrl.value)
  sourceUrl.value = ''
  sourceFile.value = null
  scale.value = 1
  offset.value = { x: 0, y: 0 }
  imgNatural.value = { w: 0, h: 0 }
}

function onFileChange(options: { file: { file?: File | null } }) {
  const file = options.file.file
  if (!file)
    return false
  if (!file.type.startsWith('image/')) {
    message.error('请选择图片文件')
    return false
  }
  if (sourceUrl.value)
    URL.revokeObjectURL(sourceUrl.value)
  sourceFile.value = file
  sourceUrl.value = URL.createObjectURL(file)
  scale.value = 1
  offset.value = { x: 0, y: 0 }
  return false
}

function onImgLoad(e: Event) {
  const img = e.target as HTMLImageElement
  imgNatural.value = { w: img.naturalWidth, h: img.naturalHeight }
  offset.value = { x: 0, y: 0 }
}

function onPointerDown(e: PointerEvent) {
  if (!sourceUrl.value)
    return
  dragging.value = true
  lastPos.value = { x: e.clientX, y: e.clientY }
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value)
    return
  const dx = e.clientX - lastPos.value.x
  const dy = e.clientY - lastPos.value.y
  lastPos.value = { x: e.clientX, y: e.clientY }
  offset.value = { x: offset.value.x + dx, y: offset.value.y + dy }
}

function onPointerUp() {
  dragging.value = false
}

async function handleConfirm() {
  if (!sourceUrl.value || !sourceFile.value) {
    message.warning('请先选择图片')
    return
  }
  const img = new Image()
  img.src = sourceUrl.value
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('图片加载失败'))
  })

  const canvas = document.createElement('canvas')
  const outW = props.outputSize
  const outH = Math.round(props.outputSize / props.aspectRatio)
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  const { w, h } = imgNatural.value
  const frameH = frameSize / props.aspectRatio
  const base = Math.max(frameSize / w, frameH / h) * scale.value
  const drawW = w * base
  const drawH = h * base
  const srcX = ((frameSize - drawW) / 2 - offset.value.x) / base
  const srcY = ((frameH - drawH) / 2 - offset.value.y) / base
  const srcW = frameSize / base
  const srcH = frameH / base

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, outW, outH)
  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH)

  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, props.mimeType, props.quality),
  )
  if (!blob) {
    message.error('裁剪失败')
    return
  }
  const dataUrl = canvas.toDataURL(props.mimeType, props.quality)
  const ext = props.mimeType === 'image/png' ? 'png' : 'jpg'
  const file = new File([blob], `avatar.${ext}`, { type: props.mimeType })
  emit('confirm', { blob, dataUrl, file })
  show.value = false
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
    :width="420"
    confirm-text="确认裁剪"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <NSpace vertical :size="12">
      <NUpload
        v-if="!sourceUrl"
        :default-upload="false"
        accept="image/*"
        :show-file-list="false"
        @before-upload="onFileChange"
      >
        <NUploadDragger>
          <div style="padding: 16px; text-align: center">
            <NIcon size="36" depth="3"><CloudUploadOutline /></NIcon>
            <NP depth="3" style="margin: 8px 0 0">点击选择图片</NP>
          </div>
        </NUploadDragger>
      </NUpload>

      <template v-else>
        <div
          class="image-cropper__frame"
          :style="{ width: `${frameSize}px`, height: `${frameSize / aspectRatio}px` }"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <img
            :src="sourceUrl"
            class="image-cropper__img"
            :style="imgStyle"
            draggable="false"
            @load="onImgLoad"
          >
        </div>
        <div class="image-cropper__tools">
          <span>缩放</span>
          <NSlider v-model:value="scale" :min="1" :max="3" :step="0.01" style="flex: 1" />
          <NButton size="tiny" quaternary @click="reset">重选</NButton>
        </div>
      </template>
    </NSpace>
  </CommonModal>
</template>

<style scoped>
.image-cropper__frame {
  margin: 0 auto;
  overflow: hidden;
  border: 1px dashed #d0d0d0;
  border-radius: 8px;
  background: #f5f5f5;
  position: relative;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.image-cropper__frame:active {
  cursor: grabbing;
}

.image-cropper__img {
  position: absolute;
  max-width: none;
  pointer-events: none;
}

.image-cropper__tools {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #666;
}
</style>
