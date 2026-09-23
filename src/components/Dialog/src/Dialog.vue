<script lang="ts" setup>
defineOptions({ name: 'Dialog' })

const slots = useSlots()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const props = withDefaults(defineProps<{
  modelValue?: boolean
  title?: string
  fullscreen?: boolean
  width?: string | number
  scroll?: boolean
  maxHeight?: string | number
}>(), {
  modelValue: false,
  title: 'Dialog',
  fullscreen: false,
  width: '40%',
  scroll: false,
  maxHeight: '400px',
})

const show = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

const styleWidth = computed(() =>
  typeof props.width === 'number' ? `${props.width}px` : props.width,
)

const bodyStyle = computed(() => ({
  maxHeight: typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : String(props.maxHeight),
  overflow: props.scroll ? 'auto' : undefined,
}))
</script>

<template>
  <n-modal
    v-model:show="show"
    preset="card"
    :title="title"
    :style="{ width: styleWidth }"
    :bordered="false"
    display-directive="if"
    class="app-dialog"
  >
    <div :style="bodyStyle">
      <slot />
    </div>
    <template v-if="slots.footer" #footer>
      <slot name="footer" />
    </template>
  </n-modal>
</template>
