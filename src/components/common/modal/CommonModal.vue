<script setup lang="ts">
import type { FormInst } from 'naive-ui'
import { NButton, NForm, NModal, NSpace } from 'naive-ui'
import CommonForm from '../CommonForm.vue'
import CommonTable from '../table/CommonTable.vue'
import type { ModalConfig, ModalSection } from './modalSchema'

const settingStore = useProjectSettingStore()

function hexLuminance(hex: string): number {
  const raw = hex.replace('#', '')
  if (raw.length !== 6)
    return 1
  const r = Number.parseInt(raw.slice(0, 2), 16) / 255
  const g = Number.parseInt(raw.slice(2, 4), 16) / 255
  const b = Number.parseInt(raw.slice(4, 6), 16) / 255
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

const modalHeaderBg = computed(() => {
  const bg = settingStore.modalSetting.headerBgColor
  if (!bg)
    return ''
  const normalized = bg.trim().toLowerCase()
  // 默认白色：浅色/深色主题均跟随 Naive UI 主题
  if (normalized === '#fff' || normalized === '#ffffff')
    return ''
  return bg
})

const modalHeaderOnDark = computed(() => {
  const bg = modalHeaderBg.value
  return !!bg && hexLuminance(bg) < 0.45
})

const modalHeaderStyle = computed(() => {
  const bg = modalHeaderBg.value
  if (!bg)
    return undefined
  return {
    backgroundColor: bg,
    color: modalHeaderOnDark.value ? '#fff' : undefined,
  }
})

const modalHeaderClass = computed(() => {
  if (!modalHeaderBg.value)
    return undefined
  const classes = ['common-modal-header--custom']
  if (modalHeaderOnDark.value)
    classes.push('common-modal-header--dark')
  return classes.join(' ')
})

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  config?: ModalConfig
  title?: string
  description?: string
  width?: number | string
  maxHeight?: number | string
  /** 未传时为 null（避免 boolean 未传被收成 false） */
  showFooter?: boolean | null
  confirmText?: string
  cancelText?: string
  loading?: boolean
  sections?: ModalSection[]
  tableData?: Record<string, Record<string, unknown>[]>
  beforeConfirm?: () => boolean | Promise<boolean>
}>(), {
  confirmText: '确定',
  cancelText: '取消',
  loading: false,
  showFooter: null,
  sections: () => [],
  tableData: () => ({}),
})

const show = defineModel<boolean>('show', { default: false })
const formModel = defineModel<Record<string, unknown>>('formModel', { default: () => ({}) })

const emit = defineEmits<{
  confirm: [payload: { formModel: Record<string, unknown> }]
  cancel: []
  open: []
  close: []
}>()

const attrs = useAttrs()
const slots = useSlots()
const formRef = ref<FormInst | null>(null)

const title = computed(() => props.title ?? props.config?.title)
const description = computed(() => props.description ?? props.config?.description)
const showFooter = computed(() => {
  if (props.showFooter !== null && props.showFooter !== undefined)
    return props.showFooter
  return props.config?.showFooter ?? true
})
const confirmText = computed(() => props.confirmText ?? props.config?.confirmText ?? '确定')
const cancelText = computed(() => props.cancelText ?? props.config?.cancelText ?? '取消')
const sections = computed(() => (props.sections.length ? props.sections : (props.config?.sections ?? [])))
const formSections = computed(() => sections.value.filter(s => s.type === 'form'))
const bodySections = computed(() => sections.value.filter(s => s.type !== 'form'))
const hasConfiguredSections = computed(() => sections.value.length > 0)
const hasForm = computed(() => formSections.value.length > 0)

function toCssSize(value: number | string) {
  return typeof value === 'number' ? `${value}px` : value
}

const modalStyle = computed(() => ({
  width: toCssSize(props.width ?? props.config?.width ?? 640),
}))

const bodyStyle = computed(() => ({
  maxHeight: toCssSize(props.maxHeight ?? props.config?.maxHeight ?? '70vh'),
}))

const modalBind = computed(() => {
  const config = props.config ?? {}
  const { class: _class, style: _style, ...restAttrs } = attrs as Record<string, unknown>
  return {
    preset: 'card' as const,
    autoFocus: false,
    draggable: true,
    maskClosable: true,
    closable: true,
    ...(config.preset !== undefined ? { preset: config.preset } : {}),
    ...(config.draggable !== undefined ? { draggable: config.draggable } : {}),
    ...(config.maskClosable !== undefined ? { maskClosable: config.maskClosable } : {}),
    ...(config.closable !== undefined ? { closable: config.closable } : {}),
    ...restAttrs,
  }
})

const RenderFn = defineComponent({
  props: {
    render: {
      type: Function as PropType<() => unknown>,
      required: true,
    },
  },
  setup(p) {
    return () => p.render()
  },
})

function resolveSectionKey(section: ModalSection, index: number) {
  return section.key ?? `${section.type}-${index}`
}

function resolveTableData(section: Extract<ModalSection, { type: 'table' }>) {
  const key = section.key
  if (key && props.tableData[key])
    return props.tableData[key]
  return section.data ?? []
}

async function validate() {
  if (!hasForm.value)
    return true
  try {
    await formRef.value?.validate()
    return true
  }
  catch {
    return false
  }
}

async function handleConfirm() {
  if (hasForm.value) {
    const valid = await validate()
    if (!valid)
      return
  }
  if (props.beforeConfirm) {
    const pass = await props.beforeConfirm()
    if (!pass)
      return
  }
  emit('confirm', { formModel: formModel.value })
}

function handleCancel() {
  emit('cancel')
  show.value = false
}

watch(show, (value) => {
  if (value)
    emit('open')
  else
    emit('close')
})

defineExpose({
  validate,
  formRef,
  open: () => { show.value = true },
  close: () => { show.value = false },
})
</script>

<template>
  <NModal
    v-bind="modalBind"
    v-model:show="show"
    class="common-modal"
    :class="attrs.class"
    :title="title"
    :style="[attrs.style, modalStyle]"
    :header-style="modalHeaderStyle"
    :header-class="modalHeaderClass"
  >
    <template v-if="slots.header" #header>
      <slot name="header" />
    </template>

    <div v-if="description" class="common-modal__desc">
      {{ description }}
    </div>

    <div class="common-modal__body" :style="bodyStyle">
      <template v-if="hasConfiguredSections">
        <NForm
          v-if="formSections.length"
          ref="formRef"
          :model="formModel"
          label-placement="left"
        >
          <div
            v-for="(section, index) in formSections"
            :key="resolveSectionKey(section, index)"
            :class="index > 0 ? 'mt-4' : ''"
          >
            <div v-if="section.title || section.description" class="mb-3">
              <div v-if="section.title" class="text-sm font-medium text-[#333]">
                {{ section.title }}
              </div>
              <div v-if="section.description" class="mt-1 text-xs text-[#999]">
                {{ section.description }}
              </div>
            </div>
            <CommonForm
              v-model:form-model="formModel"
              :fields="section.fields"
              :config="section.config"
              compact
              v-bind="section.formProps ?? {}"
            />
          </div>
        </NForm>

        <template v-for="(section, index) in bodySections" :key="resolveSectionKey(section, index)">
          <div v-if="section.type === 'table'" class="mt-4">
            <div v-if="section.title || section.description" class="mb-3">
              <div v-if="section.title" class="text-sm font-medium text-[#333]">
                {{ section.title }}
              </div>
              <div v-if="section.description" class="mt-1 text-xs text-[#999]">
                {{ section.description }}
              </div>
            </div>
            <CommonTable
              :fields="section.fields"
              :columns="section.columns"
              :data="resolveTableData(section)"
              :show-pagination="section.showPagination ?? false"
              v-bind="section.tableProps ?? {}"
            />
          </div>

          <div v-else-if="section.type === 'render'" class="mt-4">
            <div v-if="section.title" class="mb-3 text-sm font-medium text-[#333]">
              {{ section.title }}
            </div>
            <RenderFn :render="section.render" />
          </div>

          <div v-else-if="section.type === 'slot' && slots[section.slotName]" class="mt-4">
            <div v-if="section.title" class="mb-3 text-sm font-medium text-[#333]">
              {{ section.title }}
            </div>
            <slot :name="section.slotName" />
          </div>
        </template>
      </template>

      <slot v-else />
    </div>

    <div v-if="showFooter" class="common-modal__actions">
      <NSpace justify="end">
        <slot name="footer" />
        <NButton @click="handleCancel">
          {{ cancelText }}
        </NButton>
        <NButton type="primary" :loading="loading" @click="handleConfirm">
          {{ confirmText }}
        </NButton>
      </NSpace>
    </div>
  </NModal>
</template>

<style scoped>
.common-modal__desc {
  margin-bottom: 12px;
  font-size: 13px;
  color: #999;
  overflow:hidden;
}

.common-modal__body {
  overflow-x: hidden;
  overflow-y: auto;
}

.common-modal__body :deep(.common-form) {
  padding: 0;
  background: transparent;
}

.common-modal__actions {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #efeff5;
}
</style>
