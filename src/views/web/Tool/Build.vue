<template>
  <div class="form-builder" :class="{ 'is-bpm': bpmMode }">
    <header class="form-builder__toolbar">
      <div class="form-builder__toolbar-left">
        <template v-if="bpmMode">
          <n-button quaternary size="small" @click="handleBpmBack">
            返回列表
          </n-button>
          <div class="form-builder__toolbar-divider" />
          <span class="form-builder__toolbar-title">{{ bpmFormMeta.name || '流程表单设计' }}</span>
        </template>
        <span v-else class="form-builder__toolbar-title">表单设计器</span>
      </div>

      <div class="form-builder__toolbar-right">
        <n-button-group size="small">
          <n-button :disabled="!canUndo" @click="undo">
            撤销
          </n-button>
          <n-button :disabled="!canRedo" @click="redo">
            重做
          </n-button>
        </n-button-group>

        <div class="form-builder__toolbar-divider" />

        <div class="form-builder__toolbar-meta">
          <span class="form-builder__toolbar-label">列数</span>
          <n-input-number
            v-model:value="formCols"
            :min="1"
            :max="4"
            size="small"
            class="form-builder__cols-input"
          />
        </div>

        <template v-if="!bpmMode">
          <div class="form-builder__toolbar-meta">
            <span class="form-builder__toolbar-label">自动保存</span>
            <n-switch v-model:value="autoSave" size="small" />
            <span
              v-if="autoSave && saveStatus !== 'idle'"
              class="form-builder__save-status"
              :class="`is-${saveStatus}`"
            >
              {{ saveStatusText }}
            </span>
          </div>
        </template>

        <div class="form-builder__toolbar-divider" />

        <n-dropdown :options="moreActionOptions" @select="onMoreActionSelect">
          <n-button size="small">
            更多
          </n-button>
        </n-dropdown>

        <n-button size="small" type="error" quaternary @click="handleClear">
          清空
        </n-button>
        <n-button size="small" type="primary" secondary @click="handlePreview">
          预览
        </n-button>
        <n-button
          v-if="bpmMode"
          size="small"
          type="primary"
          :loading="bpmSaving"
          @click="handleBpmSave"
        >
          保存
        </n-button>
      </div>
    </header>

    <n-alert
      v-if="duplicateKeys.length"
      type="warning"
      :bordered="false"
      class="form-builder__duplicate-alert"
    >
      存在重复字段名：{{ duplicateKeys.join('、') }}，请在右侧属性面板修正
    </n-alert>

    <div class="form-builder__body">
      <section class="form-builder__panel form-builder__palette">
        <div class="form-builder__panel-head">
          <span>组件库</span>
          <span class="form-builder__panel-hint">拖到画布</span>
        </div>
        <div class="form-builder__panel-body">
          <n-collapse :default-expanded-names="paletteExpandedNames" arrow-placement="right">
            <n-collapse-item
              v-for="group in paletteGroups"
              :key="group.name"
              :title="group.name"
              :name="group.name"
            >
              <div class="form-builder__palette-list">
                <div
                  v-for="item in group.items"
                  :key="`${group.name}-${item.component}-${item.label}`"
                  class="form-builder__palette-item"
                  draggable="true"
                  @dragstart="onPaletteDragStart(item, $event)"
                  @dragend="onPaletteDragEnd"
                >
                  {{ item.label }}
                </div>
              </div>
            </n-collapse-item>
          </n-collapse>
        </div>
      </section>

      <section class="form-builder__panel form-builder__canvas">
        <div class="form-builder__panel-head">
          <span>设计画布</span>
          <span class="form-builder__panel-hint">{{ fields.length }} 个字段</span>
        </div>
        <div class="form-builder__panel-body form-builder__panel-body--canvas">
          <div
            class="form-builder__dropzone"
            :class="{ 'is-palette-dragging': paletteDragging, 'is-empty': !fields.length && !paletteDragging }"
            @dragenter.prevent="onDropzoneDragEnter"
            @dragleave.prevent="onDropzoneDragLeave"
            @dragover.prevent="onDropzoneDragOver"
            @drop.prevent="onCanvasDrop"
          >
            <n-empty
              v-if="!fields.length && !paletteDragging"
              description="从左侧拖拽组件到此处"
            />
            <div
              v-if="fields.length"
              ref="fieldGridRef"
              class="form-builder__grid-shell"
            >
              <div
                v-if="formCols > 1"
                class="form-builder__col-guides"
                :style="gridColumnStyle"
              >
                <div
                  v-for="col in formCols"
                  :key="col"
                  class="form-builder__col-guide"
                />
              </div>
              <draggable
                v-model="fields"
                class="form-builder__field-grid"
                :style="gridColumnStyle"
                item-key="uid"
                filter=".form-builder__no-drag"
                :prevent-on-filter="false"
                ghost-class="form-builder__ghost"
                chosen-class="form-builder__chosen"
                drag-class="form-builder__dragging"
                :animation="180"
                :disabled="paletteDragging || !!gridResizing"
                @end="onCanvasFieldDragEnd"
              >
                <template #item="{ element, index }">
                  <div
                    class="form-builder__field-wrap"
                    :data-uid="element.uid"
                    :style="fieldWrapGridStyle(element, formCols)"
                  >
                    <div
                      v-show="paletteDragging && dropInsertIndex === index"
                      class="form-builder__drop-indicator"
                    />
                    <div
                      class="form-builder__field"
                      :class="{
                        'is-active': selectedUid === element.uid,
                        'is-resizing-grid': gridResizing?.uid === element.uid,
                        'is-duplicate-key': isDuplicateKey(element),
                      }"
                      @click="selectField(element.uid)"
                    >
                      <div class="form-builder__field-head">
                        <div class="form-builder__field-head-main">
                          <span class="form-builder__field-handle" title="拖动排序">⋮⋮</span>
                          <span class="form-builder__field-label">{{ element.label || resolveFieldKey(element) }}</span>
                          <n-tag
                            v-if="isDuplicateKey(element)"
                            size="tiny"
                            type="error"
                            :bordered="false"
                          >
                            重名
                          </n-tag>
                        </div>
                        <n-space class="form-builder__no-drag form-builder__field-ops" :size="2">
                          <n-button text size="tiny" @click.stop="duplicateFieldAt(index)">
                            复制
                          </n-button>
                          <n-button text type="error" size="tiny" @click.stop="removeField(index)">
                            删除
                          </n-button>
                        </n-space>
                      </div>
                      <div class="form-builder__field-meta">
                        <n-tag
                          v-if="element.form !== false && formCols > 1"
                          size="tiny"
                          :bordered="false"
                          type="primary"
                        >
                          {{ getFieldSpan(element, formCols) }}/{{ formCols }}列
                        </n-tag>
                        <n-tag v-if="element.form !== false" size="tiny" type="info" :bordered="false">表单</n-tag>
                        <n-tag v-if="element.search !== false" size="tiny" type="success" :bordered="false">搜索</n-tag>
                        <n-tag v-if="element.table !== false" size="tiny" type="warning" :bordered="false">表格</n-tag>
                        <n-tag v-if="element._visibleExpr || element._hiddenExpr" size="tiny" type="error" :bordered="false">联动</n-tag>
                        <span class="form-builder__field-comp">{{ resolveComponentLabel(element) }}</span>
                      </div>
                      <div class="form-builder__field-preview form-builder__field-preview--compact" @click.stop>
                        <n-empty
                          v-if="element.form === false"
                          size="small"
                          description="未参与表单场景"
                        />
                        <div v-else class="form-builder__field-preview-hint">
                          {{ resolveFieldKey(element) }}
                        </div>
                      </div>
                      <template v-if="element.form !== false && formCols > 1">
                        <div
                          class="form-builder__field-resizer form-builder__field-resizer--west form-builder__no-drag"
                          title="拖动调整起始列"
                          @mousedown.stop="startGridResize(element, 'west', $event)"
                        />
                        <div
                          class="form-builder__field-resizer form-builder__field-resizer--east form-builder__no-drag"
                          title="拖动调整占用列数"
                          @mousedown.stop="startGridResize(element, 'east', $event)"
                        />
                      </template>
                    </div>
                  </div>
                </template>
              </draggable>
            </div>
            <div
              v-show="paletteDragging && dropInsertIndex === fields.length"
              class="form-builder__drop-indicator form-builder__drop-indicator--tail"
            />
            <div
              v-show="paletteDragging"
              class="form-builder__drop-tail"
            >
              拖放到此处追加到末尾
            </div>
          </div>
        </div>
      </section>

      <section class="form-builder__panel form-builder__props">
        <div class="form-builder__panel-head">
          <span>字段属性</span>
          <span v-if="selectedField" class="form-builder__panel-hint">
            {{ selectedField.label || resolveFieldKey(selectedField) }}
          </span>
        </div>
        <div class="form-builder__panel-body">
          <n-empty v-if="!selectedField" description="请选择画布中的字段" size="small" />
          <FieldPropsPanel
            v-else
            :field="selectedField"
            :form-cols="formCols"
            :fields="fields"
            :selected-uid="selectedUid"
            @key-change="onFieldKeyChange"
          />
        </div>
      </section>
    </div>

    <CommonModal
      v-model:show="importVisible"
      title="导入 JSON"
      :width="640"
      @confirm="handleImportJson"
    >
      <n-input
        v-model:value="importJsonText"
        type="textarea"
        :rows="16"
        placeholder="支持：纯 JSON 数组、defineFields([...])、const fields = [...]"
      />
      <n-space style="margin-top: 12px" justify="space-between">
        <n-space>
          <n-checkbox v-model:checked="importReplace">
            替换现有字段
          </n-checkbox>
          <n-button size="small" @click="fillImportExample">
            填入示例
          </n-button>
        </n-space>
        <span class="form-builder__import-tip">联动表达式请使用 visibleExpr / hiddenExpr 字符串字段</span>
      </n-space>
    </CommonModal>

    <CommonModal
      v-model:show="crudExportVisible"
      title="导出 CRUD 页面"
      :width="760"
      confirm-text="下载 ZIP"
      @confirm="handleDownloadCrud"
    >
      <n-form label-placement="left" label-width="96" :show-feedback="false">
        <n-form-item label="功能名称" required>
          <n-input v-model:value="crudExportForm.functionName" placeholder="如：岗位管理" />
        </n-form-item>
        <n-form-item label="模块名">
          <n-input v-model:value="crudExportForm.moduleName" placeholder="如：system" />
        </n-form-item>
        <n-form-item label="业务标识" required>
          <n-input v-model:value="crudExportForm.businessName" placeholder="如：post（用于 API 路径与权限前缀）" />
        </n-form-item>
        <n-form-item label="主键字段">
          <n-input v-model:value="crudExportForm.pkField" placeholder="如：postId" />
        </n-form-item>
        <n-form-item label="名称字段">
          <n-input v-model:value="crudExportForm.labelField" placeholder="删除确认时展示的字段" />
        </n-form-item>
        <n-form-item label="字段变量名">
          <n-input v-model:value="crudExportForm.fieldsVarName" placeholder="如：postFields" />
        </n-form-item>
        <n-form-item label="弹窗宽度">
          <n-input-number v-model:value="crudExportForm.modalWidth" :min="480" :max="1200" :step="40" style="width: 100%" />
        </n-form-item>
        <n-form-item label=" ">
          <n-checkbox v-model:checked="crudExportForm.includeApi">
            同时导出 API 文件（src/api/...）
          </n-checkbox>
        </n-form-item>
      </n-form>
      <n-alert type="info" :bordered="false" style="margin-top: 12px">
        将生成完整 CRUD 页面骨架（SearchPanel + CommonTable + CommonModal + useCrud），放入项目后需补充路由、菜单权限与 types 类型定义。
      </n-alert>
      <n-tabs v-model:value="crudPreviewTab" type="line" animated style="margin-top: 12px">
        <n-tab-pane name="vue" tab="页面 .vue">
          <n-input
            :value="crudPreviewVue"
            type="textarea"
            readonly
            :rows="12"
            placeholder="填写导出配置后预览"
          />
        </n-tab-pane>
        <n-tab-pane name="api" tab="API .ts">
          <n-input
            :value="crudPreviewApi"
            type="textarea"
            readonly
            :rows="12"
            placeholder="勾选导出 API 后预览"
          />
        </n-tab-pane>
      </n-tabs>
    </CommonModal>

    <CommonModal
      v-model:show="previewVisible"
      title="场景预览"
      :width="860"
      :show-footer="false"
    >
      <n-tabs v-model:value="previewTab" type="line" animated>
        <n-tab-pane name="form" tab="表单">
          <n-form ref="previewFormRef" :model="previewModel" label-placement="left" label-width="90">
            <CommonForm
              v-model:form-model="previewModel"
              :fields="previewFormFields"
              :cols="formCols"
            />
          </n-form>
          <n-divider />
          <n-code :code="previewModelJson" language="json" word-wrap />
        </n-tab-pane>
        <n-tab-pane name="search" tab="搜索">
          <SearchPanel
            v-if="previewSearchFields.length"
            v-model:search-model="previewSearchModel"
            :fields="previewSearchFields"
            :show-search-button="false"
            always-expanded
            @search="() => {}"
          />
          <n-empty v-else description="暂无参与搜索的字段" />
          <n-divider />
          <n-code :code="previewSearchModelJson" language="json" word-wrap />
        </n-tab-pane>
        <n-tab-pane name="table" tab="表格">
          <CommonTable
            v-if="previewTableFields.length"
            :data="previewTableData"
            :fields="previewTableFields"
            :show-pagination="false"
          />
          <n-empty v-else description="暂无参与表格的字段" />
        </n-tab-pane>
      </n-tabs>
    </CommonModal>
  </div>
</template>

<script setup lang="ts">
import type { FormInst } from 'naive-ui'
import draggable from 'vuedraggable'
import type { FieldOption } from '@/components/common/table/fieldSchema'
import { extractFormDefaults, extractSearchDefaults } from '@/utils/schema'
import { fetchDictOptions } from '@/hooks/useDict'
import FieldPropsPanel from '@/components/common/FormBuilder/FieldPropsPanel.vue'
import { getRuntimeField, invalidateRuntimeCache } from '@/components/common/FormBuilder/compile'
import {
  IMPORT_EXAMPLE,
  PALETTE_DRAG_MIME,
  paletteExpandedNames,
  paletteGroups,
} from '@/components/common/FormBuilder/constants'
import { downloadTextFile, downloadZipFile } from '@/components/common/FormBuilder/download'
import {
  exportCrudPage,
  inferFieldsVarName,
  inferLabelField,
  inferModalWidth,
  inferPkField,
  type CrudExportConfig,
} from '@/components/common/FormBuilder/exportCrud'
import {
  createFieldFromPalette,
  duplicateField,
  extractImportPayload,
  parseImportedFields,
  serializeDefineFields,
  toExportFields,
} from '@/components/common/FormBuilder/serialize'
import type { BuilderField, PaletteItem } from '@/components/common/FormBuilder/types'
import { useFormBuilderPersistence } from '@/components/common/FormBuilder/useFormBuilderPersistence'
import {
  clampFieldGridPlacement,
  fieldWrapGridStyle,
  findDuplicateKeys,
  getFieldColStart,
  getFieldSpan,
  resolveColStartFromClientX,
  resolveComponentLabel,
  resolveFieldKey,
  rewriteModelKeyRefs,
} from '@/components/common/FormBuilder/utils'
import { getBodyCssZoom } from '@/utils/bodyZoom'
import { useRoute, useRouter } from 'vue-router'
import * as FormApi from '@/api/bpm/form'
import { packBpmForm, unpackBpmForm } from '@/components/FormCreate/src/bpmFormBuilder'
import { resolveBpmRouteName } from '@/views/web/Bpm/routeNames'

const GRID_GAP = 10

defineOptions({ name: 'Tool-Build' })

const { message, confirmDanger } = useConfirm()
const route = useRoute()
const router = useRouter()

const bpmFormId = computed(() => {
  const fromQuery = route.query.bpmFormId
  const fromParams = route.params.id
  const raw = fromQuery ?? fromParams
  if (raw == null || raw === '')
    return undefined
  const n = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(n) && n > 0 ? n : undefined
})
const bpmMode = computed(() => bpmFormId.value != null)
const bpmSaving = ref(false)
const bpmFormMeta = ref<Partial<FormApi.FormVO>>({})

const formCols = ref(2)
const fields = ref<BuilderField[]>([])
const selectedUid = ref('')
const bpmAutoSave = ref(false)
const { autoSave, saveStatus, canUndo, canRedo, undo, redo } = useFormBuilderPersistence(
  fields,
  formCols,
  selectedUid,
  { autoSave: bpmMode.value ? bpmAutoSave : undefined },
)

const saveStatusText = computed(() => {
  if (saveStatus.value === 'pending')
    return '保存中…'
  if (saveStatus.value === 'saved')
    return '已保存'
  if (saveStatus.value === 'error')
    return '保存失败'
  return ''
})

const moreActionOptions = computed(() => {
  const options: Array<{ label: string, key: string, type?: 'divider' }> = [
    { label: '导入 JSON', key: 'import' },
    { label: '复制 JSON', key: 'copy-json' },
    { label: '下载 JSON', key: 'download-json' },
    { type: 'divider', key: 'd1', label: '' },
    { label: '复制 defineFields', key: 'copy-ts' },
    { label: '下载 TS', key: 'download-ts' },
  ]
  if (!bpmMode.value) {
    options.push(
      { type: 'divider', key: 'd2', label: '' },
      { label: '导出 CRUD 页面', key: 'export-crud' },
    )
  }
  return options
})

function onMoreActionSelect(key: string) {
  switch (key) {
    case 'import':
      importVisible.value = true
      break
    case 'copy-json':
      handleCopyJson()
      break
    case 'download-json':
      handleDownloadJson()
      break
    case 'copy-ts':
      handleExportTs()
      break
    case 'download-ts':
      handleDownloadTs()
      break
    case 'export-crud':
      openCrudExport()
      break
  }
}

const previewVisible = ref(false)
const previewTab = ref<'form' | 'search' | 'table'>('form')
const crudExportVisible = ref(false)
const crudPreviewTab = ref<'vue' | 'api'>('vue')
const crudExportForm = reactive({
  functionName: '',
  moduleName: 'system',
  businessName: '',
  pkField: '',
  labelField: '',
  fieldsVarName: '',
  modalWidth: 720,
  includeApi: true,
})
const importVisible = ref(false)
const importJsonText = ref('')
const importReplace = ref(true)
const previewModel = ref<Record<string, unknown>>({})
const previewSearchModel = ref<Record<string, unknown>>({})
const draggingPalette = ref<PaletteItem | null>(null)
const paletteDragging = ref(false)
const dropInsertIndex = ref<number | null>(null)
const gridResizing = ref<{
  uid: string
  startX: number
  startSpan: number
  startColStart: number
  edge: 'east' | 'west'
} | null>(null)
const fieldGridRef = ref<HTMLElement | null>(null)
const previewFormRef = ref<FormInst | null>(null)

const gridColumnStyle = computed(() => ({
  gridTemplateColumns: `repeat(${formCols.value}, minmax(0, 1fr))`,
}))

const selectedField = computed(() => fields.value.find(f => f.uid === selectedUid.value) || null)

const duplicateKeys = computed(() => findDuplicateKeys(fields.value))
const duplicateKeySet = computed(() => new Set(duplicateKeys.value))

const previewFields = computed(() => fields.value.map(field => getRuntimeField(field)))

function isDuplicateKey(field: BuilderField) {
  return duplicateKeySet.value.has(resolveFieldKey(field))
}

const previewFormFields = computed(() =>
  previewFields.value.filter(f => f.form !== false),
)

const previewSearchFields = computed(() =>
  previewFields.value.filter(f => f.search !== false),
)

const previewTableFields = computed(() =>
  previewFields.value.filter(f => f.table !== false),
)

const previewModelJson = computed(() => JSON.stringify(previewModel.value, null, 2))
const previewSearchModelJson = computed(() => JSON.stringify(previewSearchModel.value, null, 2))

const previewTableData = computed(() => {
  const rows: Record<string, unknown>[] = []
  for (let i = 1; i <= 2; i += 1) {
    const row: Record<string, unknown> = { id: i }
    for (const field of previewTableFields.value) {
      const key = resolveFieldKey(field)
      const options = field.options as FieldOption[] | undefined
      if (options?.length)
        row[key] = options[(i - 1) % options.length]?.value ?? options[0].value
      else if (field.component === 'NDatePicker')
        row[key] = new Date().toISOString()
      else if (field.component === 'NSwitch')
        row[key] = i % 2 === 0
      else if (field.component === 'NInputNumber' || field.component === 'NRate')
        row[key] = i * 10
      else if (field.component === 'NDynamicInput')
        row[key] = [{ key: 'k1', value: 'v1' }]
      else
        row[key] = `${field.label || key}${i}`
    }
    rows.push(row)
  }
  return rows
})

watch(formCols, (cols) => {
  for (const field of fields.value) {
    if (field.form === false)
      continue
    if (field.form?.span && field.form.span > cols)
      field.form.span = cols
    // 列数变化后清除显式起始列，让 grid 自动填充行内剩余空间
    if (field.form?.colStart != null)
      delete field.form.colStart
  }
})

function selectField(uid: string) {
  selectedUid.value = uid
}

function onFieldKeyChange(oldKey: string, newKey: string) {
  rewriteModelKeyRefs(fields.value, oldKey, newKey)
}

function removeField(index: number) {
  const removed = fields.value.splice(index, 1)[0]
  if (removed)
    invalidateRuntimeCache(removed.uid)
  if (removed?.uid === selectedUid.value)
    selectedUid.value = fields.value[0]?.uid || ''
}

function duplicateFieldAt(index: number) {
  const source = fields.value[index]
  if (!source)
    return
  const copy = duplicateField(source, fields.value)
  fields.value.splice(index + 1, 0, copy)
  selectedUid.value = copy.uid
}

function ensureFormConfig(field: BuilderField) {
  if (field.form === false || field.form == null)
    field.form = { required: false, span: 1 }
  return field.form
}

function getGridMetrics() {
  const grid = fieldGridRef.value?.querySelector('.form-builder__field-grid') as HTMLElement | null
  if (!grid)
    return null
  const colWidth = (grid.clientWidth - GRID_GAP * (formCols.value - 1)) / formCols.value
  if (!colWidth)
    return null
  return { grid, colWidth }
}

function applyFieldGridPlacement(field: BuilderField, colStart: number, span: number) {
  if (field.form === false)
    return
  const form = ensureFormConfig(field)
  const placement = clampFieldGridPlacement(colStart, span, formCols.value)
  form.colStart = placement.colStart
  form.span = placement.span
}

function snapFieldColStart(field: BuilderField, el: HTMLElement, clientX?: number) {
  if (field.form === false || formCols.value <= 1)
    return
  const metrics = getGridMetrics()
  if (!metrics)
    return
  const { grid, colWidth } = metrics
  const zoom = getBodyCssZoom()
  // clientWidth=布局坐标；getBoundingClientRect/clientX=视觉坐标，统一除以 zoom
  const gridRect = grid.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  const snapX = (clientX ?? elRect.left + elRect.width / 2) / zoom
  const layoutGridRect = { left: gridRect.left / zoom } as DOMRect
  const colStart = resolveColStartFromClientX(snapX, layoutGridRect, colWidth, GRID_GAP, formCols.value)
  applyFieldGridPlacement(field, colStart, getFieldSpan(field, formCols.value))
}

function onCanvasFieldDragEnd(evt: { item?: HTMLElement, newIndex?: number, originalEvent?: Event }) {
  if (evt.newIndex == null || !evt.item)
    return
  const field = fields.value[evt.newIndex]
  if (!field)
    return
  const clientX = evt.originalEvent instanceof MouseEvent ? evt.originalEvent.clientX : undefined
  snapFieldColStart(field, evt.item, clientX)
}

function startGridResize(field: BuilderField, edge: 'east' | 'west', e: MouseEvent) {
  if (field.form === false)
    return
  const wrap = (e.currentTarget as HTMLElement).closest('.form-builder__field-wrap') as HTMLElement | null
  if (wrap && field.form?.colStart == null)
    snapFieldColStart(field, wrap)
  gridResizing.value = {
    uid: field.uid,
    startX: e.clientX,
    startSpan: getFieldSpan(field, formCols.value),
    startColStart: getFieldColStart(field, formCols.value),
    edge,
  }
  document.body.style.cursor = edge === 'east' ? 'col-resize' : 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onGridResizeMove)
  document.addEventListener('mouseup', onGridResizeEnd)
}

function onGridResizeMove(e: MouseEvent) {
  if (!gridResizing.value)
    return
  const metrics = getGridMetrics()
  if (!metrics)
    return
  const { colWidth } = metrics
  const zoom = getBodyCssZoom()
  const delta = Math.round((e.clientX - gridResizing.value.startX) / zoom / colWidth)
  const field = fields.value.find(f => f.uid === gridResizing.value!.uid)
  if (!field || field.form === false)
    return

  if (gridResizing.value.edge === 'east') {
    const newSpan = gridResizing.value.startSpan + delta
    applyFieldGridPlacement(field, gridResizing.value.startColStart, newSpan)
    return
  }

  const newColStart = gridResizing.value.startColStart + delta
  const newSpan = gridResizing.value.startSpan - delta
  applyFieldGridPlacement(field, newColStart, newSpan)
}

function onGridResizeEnd() {
  gridResizing.value = null
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', onGridResizeMove)
  document.removeEventListener('mouseup', onGridResizeEnd)
}

function onPaletteDragStart(item: PaletteItem, e: DragEvent) {
  draggingPalette.value = item
  paletteDragging.value = true
  const payload = JSON.stringify({
    label: item.label,
    component: item.component,
    defaults: item.defaults,
  })
  e.dataTransfer?.setData(PALETTE_DRAG_MIME, payload)
  e.dataTransfer?.setData('text/plain', item.label)
  if (e.dataTransfer)
    e.dataTransfer.effectAllowed = 'copy'
}

function isPaletteDrag(e: DragEvent) {
  return Array.from(e.dataTransfer?.types ?? []).includes(PALETTE_DRAG_MIME)
}

function onDropzoneDragEnter(e: DragEvent) {
  if (!isPaletteDrag(e))
    return
  paletteDragging.value = true
}

function onPaletteDragEnd() {
  draggingPalette.value = null
  paletteDragging.value = false
  dropInsertIndex.value = null
}

function resolveDropIndex(e: DragEvent): number {
  const dropzone = (e.currentTarget as HTMLElement).closest('.form-builder__dropzone')
    ?? document.querySelector('.form-builder__dropzone')
  if (!dropzone)
    return fields.value.length

  const fieldEls = dropzone.querySelectorAll('.form-builder__field')
  if (!fieldEls.length)
    return 0

  for (let i = 0; i < fieldEls.length; i++) {
    const rect = fieldEls[i].getBoundingClientRect()
    if (e.clientY < rect.top + rect.height / 2)
      return i
  }
  return fieldEls.length
}

function onDropzoneDragOver(e: DragEvent) {
  if (!isPaletteDrag(e))
    return
  if (e.dataTransfer)
    e.dataTransfer.dropEffect = 'copy'
  dropInsertIndex.value = resolveDropIndex(e)
}

function onDropzoneDragLeave(e: DragEvent) {
  const related = e.relatedTarget as Node | null
  const current = e.currentTarget as HTMLElement
  if (related && current.contains(related))
    return
  paletteDragging.value = false
  dropInsertIndex.value = null
}

function resolvePaletteItem(e: DragEvent): PaletteItem | null {
  const raw = e.dataTransfer?.getData(PALETTE_DRAG_MIME)
  if (raw) {
    try {
      return JSON.parse(raw) as PaletteItem
    }
    catch {
      // fall through
    }
  }
  return draggingPalette.value
}

function onCanvasDrop(e: DragEvent) {
  if (!isPaletteDrag(e))
    return
  e.preventDefault()
  e.stopPropagation()
  paletteDragging.value = false
  const item = resolvePaletteItem(e)
  draggingPalette.value = null
  if (!item)
    return
  try {
    const field = createFieldFromPalette(item, fields.value)
    const index = dropInsertIndex.value ?? fields.value.length
    dropInsertIndex.value = null
    fields.value.splice(index, 0, field)
    selectedUid.value = field.uid
  }
  catch (error) {
    dropInsertIndex.value = null
    message.error(error instanceof Error ? error.message : '添加字段失败')
  }
}

async function loadFieldDictOptions() {
  const dictFields = fields.value.filter(field => field._dictType?.trim())
  await Promise.all(dictFields.map(async (field) => {
    const options = await fetchDictOptions(field._dictType!.trim())
    field.options = options
    invalidateRuntimeCache(field.uid)
  }))
}

async function handlePreview() {
  await loadFieldDictOptions()
  previewModel.value = extractFormDefaults(previewFormFields.value)
  previewSearchModel.value = extractSearchDefaults(previewSearchFields.value)
  previewTab.value = 'form'
  previewVisible.value = true
}

function fillImportExample() {
  importJsonText.value = IMPORT_EXAMPLE
}

function handleImportJson() {
  if (!importJsonText.value.trim()) {
    message.warning('请粘贴 JSON 内容')
    return
  }
  try {
    const parsed = extractImportPayload(importJsonText.value)
    const imported = parseImportedFields(parsed)
    invalidateRuntimeCache()
    fields.value = importReplace.value ? imported : [...fields.value, ...imported]
    selectedUid.value = fields.value[0]?.uid || ''
    importVisible.value = false
    importJsonText.value = ''
    const dupes = findDuplicateKeys(fields.value)
    if (dupes.length)
      message.warning(`已导入 ${imported.length} 个字段，但存在重复字段名：${dupes.join('、')}`)
    else
      message.success(`已导入 ${imported.length} 个字段`)
  }
  catch (error) {
    message.error(error instanceof Error ? error.message : 'JSON 解析失败')
  }
}

async function copyText(text: string, tip: string) {
  try {
    await navigator.clipboard.writeText(text)
    message.success(tip)
  }
  catch {
    message.error('复制失败，请手动选择文本')
  }
}

function handleCopyJson() {
  copyText(JSON.stringify(toExportFields(fields.value), null, 2), '已复制 JSON')
}

function handleDownloadJson() {
  downloadTextFile(
    JSON.stringify(toExportFields(fields.value), null, 2),
    'form-fields.json',
    'application/json;charset=utf-8',
  )
  message.success('已下载 JSON 文件')
}

function handleExportTs() {
  copyText(serializeDefineFields(fields.value), '已复制 defineFields 代码')
}

function handleDownloadTs() {
  downloadTextFile(serializeDefineFields(fields.value), 'form-fields.ts')
  message.success('已下载 TS 文件')
}

function resolveCrudExportConfig(options: { silent?: boolean } = {}): CrudExportConfig | null {
  const { silent = false } = options
  const warn = (text: string) => {
    if (!silent)
      message.warning(text)
    return null
  }

  if (!fields.value.length)
    return warn('请先添加字段')
  if (duplicateKeys.value.length)
    return warn('存在重复字段名，请先修正后再导出')

  const functionName = crudExportForm.functionName.trim()
  const moduleName = crudExportForm.moduleName.trim() || 'system'
  const businessName = crudExportForm.businessName.trim()

  if (!functionName)
    return warn('请填写功能名称')
  if (!businessName)
    return warn('请填写业务标识')
  if (!/^[a-z][\w-]*$/i.test(businessName))
    return warn('业务标识须以字母开头，仅含字母、数字、下划线或连字符')

  const pkField = crudExportForm.pkField.trim() || inferPkField(fields.value)

  return {
    functionName,
    moduleName,
    businessName,
    pkField,
    labelField: crudExportForm.labelField.trim() || inferLabelField(fields.value, pkField),
    fieldsVarName: crudExportForm.fieldsVarName.trim() || inferFieldsVarName(businessName),
    formCols: formCols.value,
    modalWidth: crudExportForm.modalWidth || inferModalWidth(formCols.value),
    includeApi: crudExportForm.includeApi,
  }
}

const crudPreviewVue = computed(() => {
  const config = resolveCrudExportConfig({ silent: true })
  if (!config)
    return ''
  return exportCrudPage(fields.value, config).vue
})

const crudPreviewApi = computed(() => {
  const config = resolveCrudExportConfig({ silent: true })
  if (!config || !config.includeApi)
    return ''
  return exportCrudPage(fields.value, config).api
})

function openCrudExport() {
  if (!fields.value.length) {
    message.warning('请先添加字段')
    return
  }
  if (duplicateKeys.value.length) {
    message.warning('存在重复字段名，请先修正后再导出')
    return
  }

  const firstLabel = fields.value.find(field => field.label)?.label || ''
  if (!crudExportForm.functionName)
    crudExportForm.functionName = firstLabel ? `${firstLabel}管理` : ''
  if (!crudExportForm.businessName) {
    const key = resolveFieldKey(fields.value[0])
    crudExportForm.businessName = key.replace(/Id$/i, '').replace(/(?:Name|Title|Code)$/i, '') || 'demo'
  }
  crudExportForm.pkField = inferPkField(fields.value)
  crudExportForm.labelField = inferLabelField(fields.value, crudExportForm.pkField)
  crudExportForm.fieldsVarName = inferFieldsVarName(crudExportForm.businessName)
  crudExportForm.modalWidth = inferModalWidth(formCols.value)
  crudExportVisible.value = true
}

function handleDownloadCrud() {
  const config = resolveCrudExportConfig()
  if (!config)
    return

  const result = exportCrudPage(fields.value, config)
  const zipName = `${config.moduleName}-${config.businessName}-crud.zip`
  downloadZipFile(result.files, zipName)
  crudExportVisible.value = false
  message.success(`已下载 ${zipName}`)
}

function handleClear() {
  confirmDanger({
    title: '确认清空',
    content: '是否清空画布中的所有字段？此操作可通过撤销恢复。',
    successMessage: '已清空',
    action: async () => {
      invalidateRuntimeCache()
      fields.value = []
      selectedUid.value = ''
    },
  })
}

function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  if (target?.closest('input, textarea, [contenteditable="true"]'))
    return

  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault()
    if (e.shiftKey)
      redo()
    else
      undo()
    return
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault()
    redo()
    return
  }
  if (e.key === 'Delete' && selectedUid.value) {
    const index = fields.value.findIndex(f => f.uid === selectedUid.value)
    if (index >= 0)
      removeField(index)
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  if (bpmFormId.value) {
    await loadBpmForm(bpmFormId.value)
  }
})

watch(bpmFormId, async (id, prev) => {
  if (id && id !== prev)
    await loadBpmForm(id)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onGridResizeMove)
  document.removeEventListener('mouseup', onGridResizeEnd)
  window.removeEventListener('keydown', onKeydown)
})

async function loadBpmForm(id: number) {
  try {
    const data = await FormApi.getForm(id) as FormApi.FormVO
    bpmFormMeta.value = data
    const unpacked = unpackBpmForm(data.conf, data.fields)
    invalidateRuntimeCache()
    fields.value = unpacked.fields
    formCols.value = unpacked.formCols
    selectedUid.value = unpacked.fields[0]?.uid || ''
    document.title = `设计表单 · ${data.name || id}`
  }
  catch (e: any) {
    message.error(e?.message || '加载流程表单失败')
  }
}

async function handleBpmSave() {
  if (!bpmFormId.value)
    return
  if (duplicateKeys.value.length) {
    message.warning('存在重复字段名，请先修正后再保存')
    return
  }
  bpmSaving.value = true
  try {
    const packed = packBpmForm(fields.value, formCols.value)
    await FormApi.updateForm({
      id: bpmFormId.value,
      name: bpmFormMeta.value.name || '',
      status: bpmFormMeta.value.status ?? 0,
      remark: bpmFormMeta.value.remark || '',
      conf: packed.conf,
      fields: packed.fields,
      createTime: bpmFormMeta.value.createTime || '',
    } as FormApi.FormVO)
    bpmFormMeta.value = {
      ...bpmFormMeta.value,
      conf: packed.conf,
      fields: packed.fields,
    }
    message.success('已保存到流程表单')
  }
  catch (e: any) {
    message.error(e?.message || '保存失败')
  }
  finally {
    bpmSaving.value = false
  }
}

function handleBpmBack() {
  if (router.hasRoute('BpmForm')) {
    router.push({ name: 'BpmForm' })
    return
  }
  if (router.hasRoute('Bpm-Form')) {
    router.push({ name: 'Bpm-Form' })
    return
  }
  router.push({ name: resolveBpmRouteName(router, 'Bpm-Form', 'BpmForm') })
}
</script>

<style scoped>
.form-builder {
  --fb-border: #e8ecf1;
  --fb-surface: #fff;
  --fb-muted: #6b7280;
  --fb-bg: #f3f5f8;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--fb-bg);
  border-radius: 8px;
}

.form-builder__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  min-height: 52px;
  padding: 8px 14px;
  background: var(--fb-surface);
  border-bottom: 1px solid var(--fb-border);
}

.form-builder__toolbar-left,
.form-builder__toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.form-builder__toolbar-right {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.form-builder__toolbar-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-builder__toolbar-divider {
  width: 1px;
  height: 18px;
  background: var(--fb-border);
  flex-shrink: 0;
}

.form-builder__toolbar-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.form-builder__toolbar-label {
  font-size: 12px;
  color: var(--fb-muted);
  white-space: nowrap;
}

.form-builder__cols-input {
  width: 72px;
}

.form-builder__duplicate-alert {
  margin: 10px 12px 0;
}

.form-builder__save-status {
  font-size: 12px;
  color: var(--fb-muted);
}

.form-builder__save-status.is-saved {
  color: var(--n-success-color);
}

.form-builder__save-status.is-error {
  color: var(--n-error-color);
}

.form-builder__body {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr) 340px;
  grid-template-rows: minmax(0, 1fr);
  gap: 10px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 10px 12px 12px;
}

.form-builder__panel {
  min-height: 0;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--fb-surface);
  border: 1px solid var(--fb-border);
  border-radius: 10px;
}

.form-builder__panel-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 42px;
  padding: 0 14px;
  border-bottom: 1px solid var(--fb-border);
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.form-builder__panel-hint {
  font-size: 12px;
  font-weight: 400;
  color: var(--fb-muted);
}

.form-builder__panel-body {
  position: relative;
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
  padding: 12px;
  overflow-x: hidden;
  overflow-y: auto;
}

.form-builder__panel-body--canvas {
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--fb-border) 55%, transparent) 1px, transparent 1px) 0 0 / 16px 16px,
    linear-gradient(color-mix(in srgb, var(--fb-border) 55%, transparent) 1px, transparent 1px) 0 0 / 16px 16px,
    #fafbfc;
}

.form-builder__palette :deep(.n-collapse-item__header) {
  padding: 6px 0 !important;
  font-size: 12px;
  font-weight: 600;
  color: var(--fb-muted);
}

.form-builder__palette :deep(.n-collapse-item__content-inner) {
  padding: 4px 0 10px !important;
}

.form-builder__grid-shell {
  position: relative;
  width: 100%;
}

.form-builder__field-list,
.form-builder__field-grid {
  flex: 0 0 auto;
  position: relative;
  z-index: 1;
}

.form-builder__field-grid {
  display: grid;
  gap: 10px;
  align-items: start;
  width: 100%;
}

.form-builder__col-guides {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: grid;
  gap: 10px;
  width: 100%;
  pointer-events: none;
}

.form-builder__col-guide {
  min-height: 100%;
  border: 1px dashed color-mix(in srgb, var(--n-primary-color) 22%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--n-primary-color) 4%, transparent);
}

.form-builder__palette-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.form-builder__palette-item {
  padding: 8px 10px;
  border: 1px solid var(--fb-border);
  border-radius: 8px;
  cursor: grab;
  user-select: none;
  font-size: 12px;
  color: #374151;
  background: #f8fafc;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.form-builder__palette-item:hover {
  border-color: color-mix(in srgb, var(--n-primary-color) 45%, var(--fb-border));
  background: color-mix(in srgb, var(--n-primary-color) 8%, #fff);
  color: var(--n-primary-color);
}

.form-builder__palette-item:active {
  cursor: grabbing;
}

.form-builder__dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.form-builder__dropzone.is-empty,
.form-builder__dropzone.is-palette-dragging {
  min-height: 100%;
}

.form-builder__dropzone.is-palette-dragging {
  outline: 2px dashed var(--n-primary-color);
  outline-offset: -2px;
  background: color-mix(in srgb, var(--n-primary-color) 6%, transparent);
  border-radius: 8px;
}

.form-builder__field-wrap {
  position: relative;
}

.form-builder__drop-indicator {
  grid-column: 1 / -1;
  height: 3px;
  margin: 0 0 2px;
  border-radius: 999px;
  background: var(--n-primary-color);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--n-primary-color) 30%, transparent);
}

.form-builder__drop-indicator--tail {
  margin-top: 0;
}

.form-builder__drop-tail {
  flex: 1;
  min-height: 100px;
  margin-top: 8px;
  border: 1px dashed color-mix(in srgb, var(--n-primary-color) 35%, var(--fb-border));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fb-muted);
  font-size: 13px;
  background: color-mix(in srgb, #fff 70%, transparent);
}

.form-builder__dropzone.is-palette-dragging .form-builder__drop-tail {
  border-color: var(--n-primary-color);
  color: var(--n-primary-color);
  background: color-mix(in srgb, var(--n-primary-color) 4%, transparent);
}

.form-builder__field {
  position: relative;
  height: 100%;
  border: 1px solid var(--fb-border);
  border-radius: 10px;
  padding: 10px 12px;
  background: #fff;
  cursor: grab;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-builder__field:hover {
  border-color: color-mix(in srgb, var(--n-primary-color) 35%, var(--fb-border));
}

.form-builder__field:active {
  cursor: grabbing;
}

.form-builder__field.is-resizing-grid {
  border-color: var(--n-primary-color);
  box-shadow: 0 0 0 1px var(--n-primary-color);
  cursor: col-resize;
}

.form-builder__field-resizer {
  position: absolute;
  top: 8px;
  bottom: 8px;
  width: 10px;
  border-radius: 4px;
  cursor: col-resize;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.form-builder__field-resizer--west {
  left: -5px;
}

.form-builder__field-resizer--east {
  right: -5px;
}

.form-builder__field:hover .form-builder__field-resizer,
.form-builder__field.is-active .form-builder__field-resizer,
.form-builder__field.is-resizing-grid .form-builder__field-resizer {
  opacity: 1;
}

.form-builder__field-resizer:hover,
.form-builder__field.is-resizing-grid .form-builder__field-resizer {
  background: color-mix(in srgb, var(--n-primary-color) 28%, transparent);
}

.form-builder__field.is-active {
  border-color: var(--n-primary-color);
  box-shadow: 0 0 0 1px var(--n-primary-color), 0 4px 14px color-mix(in srgb, var(--n-primary-color) 12%, transparent);
}

.form-builder__field.is-duplicate-key {
  border-color: var(--n-error-color);
}

.form-builder__field.is-duplicate-key.is-active {
  box-shadow: 0 0 0 1px var(--n-error-color);
}

.form-builder__field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.form-builder__field-head-main {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.form-builder__field-handle {
  cursor: grab;
  color: #9ca3af;
  letter-spacing: -2px;
  flex-shrink: 0;
}

.form-builder__field-label {
  font-weight: 600;
  font-size: 13px;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-builder__field-ops {
  flex-shrink: 0;
}

.form-builder__field-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.form-builder__field-comp {
  margin-left: auto;
  font-size: 11px;
  color: #9ca3af;
}

.form-builder__field-preview {
  pointer-events: none;
}

.form-builder__field-preview--compact {
  min-height: 34px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  border-radius: 6px;
  background: #f8fafc;
  border: 1px dashed var(--fb-border);
}

.form-builder__field-preview-hint {
  font-size: 12px;
  color: var(--fb-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.form-builder__import-tip {
  font-size: 12px;
  color: var(--fb-muted);
}

.form-builder__ghost {
  opacity: 0.45;
}

.form-builder__chosen {
  box-shadow: 0 6px 20px color-mix(in srgb, var(--n-primary-color) 18%, transparent);
}

.form-builder__dragging {
  opacity: 0.85;
}

@media (max-width: 1200px) {
  .form-builder__body {
    grid-template-columns: 200px minmax(0, 1fr) 300px;
  }
}
</style>
