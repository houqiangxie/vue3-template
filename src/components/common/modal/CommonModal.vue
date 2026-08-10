<script setup lang="ts">

import type { FormInst } from 'naive-ui'

import { Comment } from 'vue'

import { NButton, NForm, NModal, NSpace } from 'naive-ui'

import CommonForm from '../CommonForm.vue'

import CommonTable from '../table/CommonTable.vue'

import type { ModalConfig, ModalSection } from './modalSchema'



defineOptions({ inheritAttrs: false })



const props = withDefaults(defineProps<{

  /** 完整弹窗配置（与独立 props 可组合，独立 props 优先） */

  config?: ModalConfig

  title?: string

  description?: string

  width?: number | string

  maxHeight?: number | string

  /** 未传时读取 config.showFooter，默认 true */

  showFooter?: boolean

  confirmText?: string

  cancelText?: string

  loading?: boolean

  sections?: ModalSection[]

  /** 表格区块动态数据，key 对应 section.key */

  tableData?: Record<string, Record<string, unknown>[]>

  /** 确认前钩子，返回 false 阻止关闭；有表单时会先自动校验 */

  beforeConfirm?: () => boolean | Promise<boolean>

}>(), {

  confirmText: '确定',

  cancelText: '取消',

  loading: false,

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



/** CommonModal 自有属性，不透传给 NModal */

const CONTENT_PROP_KEYS = new Set([

  'config',

  'title',

  'description',

  'width',

  'maxHeight',

  'showFooter',

  'confirmText',

  'cancelText',

  'loading',

  'sections',

  'tableData',

  'beforeConfirm',

  'show',

  'formModel',

])



function toKebabCase(key: string) {

  return key.replace(/([A-Z])/g, '-$1').toLowerCase()

}



function isContentAttr(key: string) {

  if (CONTENT_PROP_KEYS.has(key))

    return true

  for (const ownedKey of CONTENT_PROP_KEYS) {

    if (toKebabCase(ownedKey) === key)

      return true

  }

  return false

}



/** NModal 默认值；透传 attr 可覆盖 */

const MODAL_DEFAULTS = {

  preset: 'card',

  draggable: { bounds: 'none' },

  maskClosable: true,

  closable: true,

  autoFocus: false,

  contentScrollable: false,

  showMask: true,

} as const



/** 透传 NModal 原生属性（含 onXxx 事件） */

const passthroughAttrs = computed(() => {

  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(attrs)) {

    if (isContentAttr(key))

      continue

    if (key === 'class' || key === 'style')

      continue

    result[key] = value

  }

  return result

})



/** 默认值 < config < 透传 attr */

const nModalBind = computed(() => {

  const config = props.config ?? {}

  return {

    ...MODAL_DEFAULTS,

    ...(config.preset !== undefined ? { preset: config.preset } : {}),

    ...(config.draggable !== undefined ? { draggable: config.draggable } : {}),

    ...(config.maskClosable !== undefined ? { maskClosable: config.maskClosable } : {}),

    ...(config.closable !== undefined ? { closable: config.closable } : {}),

    ...passthroughAttrs.value,

  }

})



const preset = computed(() => (nModalBind.value.preset ?? 'card') as 'dialog' | 'card')

const isDialogPreset = computed(() => preset.value === 'dialog')

/** card 预设使用自定义标题栏，需手动挂上 Naive UI 拖拽手柄 class */
const isDraggable = computed(() => nModalBind.value.draggable !== false)



const title = computed(() => props.title ?? props.config?.title)

const description = computed(() => props.description ?? props.config?.description)

const showFooter = computed(() => props.showFooter ?? props.config?.showFooter ?? true)

const confirmText = computed(() => props.confirmText ?? props.config?.confirmText ?? '确定')

const cancelText = computed(() => props.cancelText ?? props.config?.cancelText ?? '取消')

const sections = computed(() => (props.sections.length ? props.sections : (props.config?.sections ?? [])))



function slotHasContent(name: keyof typeof slots) {

  const slot = slots[name]

  if (!slot)

    return false

  return slot().some(vnode => vnode.type !== Comment)

}



const hasCustomHeader = computed(() => slotHasContent('header'))

const useInlineCardHeader = computed(() => !isDialogPreset.value && !hasCustomHeader.value)

const modalTitle = computed(() => (isDialogPreset.value ? title.value : undefined))

const formSections = computed(() => sections.value.filter(s => s.type === 'form'))

const bodySections = computed(() => sections.value.filter(s => s.type !== 'form'))

const hasConfiguredSections = computed(() => sections.value.length > 0)

const hasForm = computed(() => formSections.value.length > 0)



function toCssSize(value: number | string) {

  return typeof value === 'number' ? `${value}px` : value

}



const RenderFn = defineComponent({

  props: {

    render: {

      type: Function as PropType<() => unknown>,

      required: true,

    },

  },

  setup(props) {

    return () => props.render()

  },

})



const modalStyle = computed(() => ({

  width: toCssSize(props.width ?? props.config?.width ?? 640),

  maxHeight: toCssSize(props.maxHeight ?? props.config?.maxHeight ?? '85vh'),

  '--common-modal-max-height': toCssSize(props.maxHeight ?? props.config?.maxHeight ?? '85vh'),

} as Record<string, string>))



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



function handleHeaderClose() {

  show.value = false

}



watch(show, (value) => {

  if (value)

    emit('open')

  else

    emit('close')

})



async function handleConfirmDialog() {

  await handleConfirm()

  return false

}



function handleCancelDialog() {

  handleCancel()

  return true

}



defineExpose({

  validate,

  formRef,

  open: () => { show.value = true },

  close: () => { show.value = false },

})

</script>



<template>

  <NModal

    v-bind="nModalBind"

    v-model:show="show"

    class="common-modal"

    :class="attrs.class"

    :style="[attrs.style, modalStyle]"

    :title="modalTitle"

    :closable="isDialogPreset ? nModalBind.closable : false"

    :segmented="isDialogPreset ? undefined : (showFooter ? { footer: 'soft' } : false)"

    content-class="common-modal-content"

    :content-style="{ padding: 0 }"

    :positive-text="isDialogPreset && showFooter ? confirmText : undefined"

    :negative-text="isDialogPreset && showFooter ? cancelText : undefined"

    @positive-click="isDialogPreset && showFooter ? handleConfirmDialog : undefined"

    @negative-click="isDialogPreset && showFooter ? handleCancelDialog : undefined"

  >

    <div class="common-modal-shell">

      <div
        v-if="useInlineCardHeader"
        class="common-modal-header"
        :class="{ 'n-draggable': isDraggable }"
      >

        <div class="common-modal-header__title">

          {{ title }}

        </div>

        <button

          v-if="nModalBind.closable !== false"

          type="button"

          class="common-modal-header__close"

          aria-label="关闭"

          @mousedown.stop

          @click.stop="handleHeaderClose"

        >

          ×

        </button>

      </div>



      <div class="common-modal-scroll">

        <div v-if="description" class="mb-4 text-sm text-[#999]">

          {{ description }}

        </div>



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

    </div>



    <template v-if="hasCustomHeader" #header>

      <slot name="header" />

    </template>



    <template v-if="!isDialogPreset && showFooter" #footer>

      <NSpace justify="end">

        <slot name="footer" />

        <NButton @click="handleCancel">

          {{ cancelText }}

        </NButton>

        <NButton type="primary" :loading="loading" @click="handleConfirm">

          {{ confirmText }}

        </NButton>

      </NSpace>

    </template>

  </NModal>

</template>



<style scoped>

.common-modal-scroll :deep(.common-form) {

  padding: 0;

  background: transparent;

}

</style>



<style>

/* 修复 Naive UI 遮罩点击被 scroll-content 拦截 */

.n-modal-container:has(.common-modal) .n-modal-scroll-content {

  pointer-events: none;

}



.n-modal-container:has(.common-modal) .n-modal-scroll-content > * {

  pointer-events: auto;

}



.common-modal-shell {

  display: flex;

  flex-direction: column;

  flex: 1 1 auto;

  min-height: 0;

  overflow: hidden;

}



.common-modal-header {

  display: flex;

  align-items: center;

  gap: 12px;

  padding: 14px 12px 14px 16px;

  border-bottom: 1px solid rgb(239, 239, 245);

  background: #fff;

  flex-shrink: 0;

}

.common-modal-header.n-draggable {
  cursor: grab;
}

.common-modal-header.n-draggable:active {
  cursor: grabbing;
}



.common-modal-header__title {

  flex: 1;

  min-width: 0;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;

  font-size: 18px;

  font-weight: 500;

  line-height: 1.4;

  color: rgb(31, 34, 37);

}



.common-modal-header__close {

  display: inline-flex;

  align-items: center;

  justify-content: center;

  width: 28px;

  height: 28px;

  margin: 0;

  padding: 0;

  border: 1px solid rgb(224, 224, 230);

  border-radius: 4px;

  background: #fff;

  color: rgb(51, 51, 51);

  font-size: 20px;

  line-height: 1;

  cursor: pointer;

  flex-shrink: 0;

}



.common-modal-header__close:hover {

  background: rgb(243, 243, 245);

  color: rgb(31, 34, 37);

}



.common-modal-scroll {

  flex: 1 1 auto;

  min-height: 0;

  overflow-x: hidden;

  overflow-y: auto;

  padding: 16px;

}



.n-card.common-modal {

  display: flex;

  flex-direction: column;

  max-height: var(--common-modal-max-height, 85vh);

}



.n-card.common-modal > .n-card-header {

  flex-shrink: 0;

  overflow: visible;

}



.n-card.common-modal > .n-card-content.common-modal-content {

  flex: 1 1 auto;

  min-height: 0;

  overflow: hidden;

  display: flex;

  flex-direction: column;

}



.n-card.common-modal > .n-card__footer {

  flex-shrink: 0;

}



.n-dialog.common-modal {

  display: flex;

  flex-direction: column;

  max-height: var(--common-modal-max-height, 85vh);

  overflow: hidden;

}



.n-dialog.common-modal > .n-dialog__title {

  flex-shrink: 0;

}



.n-dialog.common-modal > .n-dialog__content {

  flex: 1 1 auto;

  min-height: 0;

  overflow-x: hidden;

  overflow-y: auto !important;

}



.n-dialog.common-modal > .n-dialog__action {

  flex-shrink: 0;

}

</style>


