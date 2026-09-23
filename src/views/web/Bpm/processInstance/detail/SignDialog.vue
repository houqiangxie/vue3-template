<template>
  <n-modal
    v-model:show="visible"
    preset="card"
    title="手写签名"
    style="width: min(720px, 96vw)"
    :mask-closable="false"
  >
    <div class="bpm-sign">
      <canvas
        ref="canvasRef"
        class="bpm-sign__canvas"
        @mousedown="startDraw"
        @mousemove="draw"
        @mouseup="endDraw"
        @mouseleave="endDraw"
        @touchstart.prevent="startDrawTouch"
        @touchmove.prevent="drawTouch"
        @touchend.prevent="endDraw"
      />
      <n-button text type="primary" class="bpm-sign__clear" @click="clear">清除</n-button>
    </div>
    <template #footer>
      <n-space justify="end">
        <n-button @click="visible = false">取消</n-button>
        <n-button type="primary" :loading="submitting" @click="submit">确认</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
defineOptions({ name: 'BpmSignDialog' })

const emit = defineEmits<{
  success: [url: string]
}>()

const message = useMessage()
const visible = ref(false)
const submitting = ref(false)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const drawing = ref(false)
let ctx: CanvasRenderingContext2D | null = null

function setupCanvas() {
  const canvas = canvasRef.value
  if (!canvas)
    return
  const ratio = window.devicePixelRatio || 1
  const width = canvas.clientWidth || 680
  const height = 280
  canvas.width = width * ratio
  canvas.height = height * ratio
  canvas.style.height = `${height}px`
  ctx = canvas.getContext('2d')
  if (!ctx)
    return
  ctx.scale(ratio, ratio)
  ctx.strokeStyle = '#111'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  clear()
}

function clear() {
  const canvas = canvasRef.value
  if (!canvas || !ctx)
    return
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.clientWidth || 680, 280)
}

function getPos(e: MouseEvent | Touch) {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }
}

function startDraw(e: MouseEvent) {
  if (!ctx)
    return
  drawing.value = true
  const { x, y } = getPos(e)
  ctx.beginPath()
  ctx.moveTo(x, y)
}

function draw(e: MouseEvent) {
  if (!drawing.value || !ctx)
    return
  const { x, y } = getPos(e)
  ctx.lineTo(x, y)
  ctx.stroke()
}

function endDraw() {
  drawing.value = false
}

function startDrawTouch(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch || !ctx)
    return
  drawing.value = true
  const { x, y } = getPos(touch)
  ctx.beginPath()
  ctx.moveTo(x, y)
}

function drawTouch(e: TouchEvent) {
  const touch = e.touches[0]
  if (!drawing.value || !touch || !ctx)
    return
  const { x, y } = getPos(touch)
  ctx.lineTo(x, y)
  ctx.stroke()
}

function isBlank() {
  const canvas = canvasRef.value
  if (!canvas || !ctx)
    return true
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  for (let i = 0; i < data.length; i += 4) {
    // non-white pixel
    if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250)
      return false
  }
  return true
}

async function submit() {
  if (!canvasRef.value || isBlank()) {
    message.warning('请先完成签名')
    return
  }
  submitting.value = true
  try {
    const url = canvasRef.value.toDataURL('image/png')
    emit('success', url)
    visible.value = false
  }
  finally {
    submitting.value = false
  }
}

async function open() {
  visible.value = true
  await nextTick()
  setupCanvas()
}

defineExpose({ open })
</script>

<style scoped>
.bpm-sign {
  position: relative;
}
.bpm-sign__canvas {
  width: 100%;
  height: 280px;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  cursor: crosshair;
  touch-action: none;
  background: #fff;
}
.bpm-sign__clear {
  position: absolute;
  right: 8px;
  bottom: 8px;
}
</style>
