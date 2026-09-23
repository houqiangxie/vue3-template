<template>
  <div class="bpm-model-page">
    <div class="bpm-model-page__toolbar">
      <n-input
        v-model:value="keyword"
        clearable
        placeholder="搜索流程"
        style="width: 220px"
        @keyup.enter="loadData"
      >
        <template #prefix>
          <n-icon :component="SearchOutline" />
        </template>
      </n-input>
      <n-space>
        <n-button
          v-if="hasPermission('bpm:model:update')"
          secondary
          :loading="sortSaving"
          @click="openSortModal"
        >
          调整排序
        </n-button>
        <n-button v-if="hasPermission('bpm:model:create')" type="primary" @click="goCreate">
          <template #icon>
            <n-icon :component="AddOutline" />
          </template>
          新建模型
        </n-button>
      </n-space>
    </div>

    <n-spin :show="loading">
      <div v-if="!grouped.length" class="bpm-model-page__empty">
        <n-empty description="暂无流程模型" />
      </div>

      <n-collapse v-else :default-expanded-names="expandedNames" display-directive="show">
        <n-collapse-item
          v-for="group in grouped"
          :key="group.code"
          :name="group.code"
          :title="`${group.name}（${group.models.length}）`"
        >
          <n-data-table
            :columns="columns"
            :data="group.models"
            :bordered="false"
            :single-line="false"
            size="small"
            :scroll-x="1400"
            :row-key="(row: ModelRow) => row.id"
          />
        </n-collapse-item>
      </n-collapse>
    </n-spin>

    <DefinitionHistory ref="historyRef" />
    <BpmFormPreviewDialog ref="formPreviewRef" />

    <n-modal
      v-model:show="sortVisible"
      preset="card"
      title="调整模型排序"
      style="width: 420px"
      :bordered="false"
    >
      <p class="bpm-model-sort-hint">拖动调整顺序后保存</p>
      <draggable
        v-model="sortList"
        item-key="id"
        handle=".bpm-model-sort__handle"
        animation="200"
        class="bpm-model-sort-list"
      >
        <template #item="{ element }">
          <div class="bpm-model-sort__item">
            <n-icon class="bpm-model-sort__handle" size="16">
              <MenuOutline />
            </n-icon>
            <span>{{ element.name }}</span>
            <span class="bpm-model-sort__key">{{ element.key }}</span>
          </div>
        </template>
      </draggable>
      <template #footer>
        <n-space justify="end">
          <n-button @click="sortVisible = false">取消</n-button>
          <n-button type="primary" :loading="sortSaving" @click="saveSort">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="tsx">
import type { DataTableColumns } from 'naive-ui'
import { NButton, NSpace, NTag, useDialog, useMessage } from 'naive-ui'
import { AddOutline, MenuOutline, SearchOutline } from '@vicons/ionicons5'
import { useRouter } from 'vue-router'
import Draggable from 'vuedraggable'
import * as ModelApi from '@/api/bpm/model'
import { CategoryApi, type CategoryVO } from '@/api/bpm/category'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { BpmModelFormType } from '@/utils/constants'
import { usePermission } from '@/hooks/usePermission'
import { resolveBpmRouteName } from './routeNames'
import { renderModelVisibleScope } from './utils/listRender'
import DefinitionHistory from '@/views/bpm/model/DefinitionHistory.vue'
import BpmFormPreviewDialog from './components/BpmFormPreviewDialog.vue'

defineOptions({ name: 'Bpm-Model' })

type ModelRow = {
  id: number
  name: string
  key: string
  category?: string
  type?: number
  icon?: string
  visible?: boolean
  formType?: number
  formId?: number
  formName?: string
  formCustomCreatePath?: string
  startUsers?: Array<{ id?: number, name?: string, nickname?: string }>
  startDepts?: Array<{ id?: number, name?: string, deptName?: string }>
  createTime?: string
  processDefinition?: {
    id?: string
    version?: number
    suspensionState?: number
    deploymentTime?: string
    deploymentTIme?: string
  }
}

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const { hasPermission } = usePermission()
const historyRef = ref<InstanceType<typeof DefinitionHistory>>()
const formPreviewRef = ref<InstanceType<typeof BpmFormPreviewDialog>>()

const keyword = ref('')
const loading = ref(false)
const models = ref<ModelRow[]>([])
const categories = ref<CategoryVO[]>([])
const sortVisible = ref(false)
const sortSaving = ref(false)
const sortList = ref<ModelRow[]>([])

const expandedNames = computed(() => grouped.value.map(g => g.code))

const grouped = computed(() => {
  const map = new Map<string, { code: string, name: string, models: ModelRow[] }>()
  for (const cat of categories.value) {
    map.set(cat.code, { code: cat.code, name: cat.name, models: [] })
  }
  for (const model of models.value) {
    const code = model.category || 'default'
    if (!map.has(code))
      map.set(code, { code, name: code, models: [] })
    map.get(code)!.models.push(model)
  }
  return [...map.values()].filter(g => g.models.length > 0)
})

function deploymentTime(row: ModelRow) {
  return row.processDefinition?.deploymentTime
    || row.processDefinition?.deploymentTIme
    || '-'
}

function openFormPreview(row: ModelRow) {
  if (row.formType === BpmModelFormType.CUSTOM && row.formCustomCreatePath) {
    const path = row.formCustomCreatePath.startsWith('/')
      ? row.formCustomCreatePath
      : `/${row.formCustomCreatePath}`
    router.push(path).catch(() => message.warning('无法打开自定义表单路径'))
    return
  }
  if (row.formId)
    formPreviewRef.value?.openByFormId(row.formId, '表单详情')
  else
    message.warning('暂无表单')
}

const columns: DataTableColumns<ModelRow> = [
  {
    title: '流程名',
    key: 'name',
    ellipsis: { tooltip: true },
    minWidth: 180,
    render: (row) => (
      <span class="bpm-model-name">
        {row.icon
          ? <img class="bpm-model-name__img" src={row.icon} alt="" />
          : <span class="bpm-model-name__icon">{(row.name || '?').slice(0, 2)}</span>}
        {row.name}
      </span>
    ),
  },
  {
    title: '可见范围',
    key: 'visible',
    minWidth: 140,
    ellipsis: { tooltip: true },
    render: (row) => renderModelVisibleScope(row),
  },
  {
    title: '流程类型',
    key: 'type',
    width: 120,
    render: (row) => (
      <NTag type="info" size="small" bordered={false}>
        {getDictLabel(DICT_TYPE.BPM_MODEL_TYPE, row.type)}
      </NTag>
    ),
  },
  {
    title: '表单信息',
    key: 'formName',
    minWidth: 120,
    ellipsis: { tooltip: true },
    render: (row) => {
      if (row.formType === BpmModelFormType.NORMAL && (row.formName || row.formId)) {
        return (
          <NButton text type="primary" onClick={() => openFormPreview(row)}>
            {row.formName || `表单 #${row.formId}`}
          </NButton>
        )
      }
      if (row.formType === BpmModelFormType.CUSTOM && row.formCustomCreatePath) {
        return (
          <NButton text type="primary" onClick={() => openFormPreview(row)}>
            {row.formCustomCreatePath}
          </NButton>
        )
      }
      return '暂无表单'
    },
  },
  {
    title: '版本',
    key: 'version',
    width: 70,
    render: (row) => row.processDefinition?.version ?? '-',
  },
  {
    title: '部署时间',
    key: 'deploymentTime',
    width: 160,
    render: (row) => deploymentTime(row),
  },
  {
    title: '状态',
    key: 'suspensionState',
    width: 90,
    render: (row) => {
      const state = row.processDefinition?.suspensionState
      if (!state)
        return <NTag size="small" bordered={false}>未发布</NTag>
      return (
        <NTag size="small" type={state === 1 ? 'success' : 'warning'} bordered={false}>
          {state === 1 ? '激活' : '挂起'}
        </NTag>
      )
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 400,
    fixed: 'right' as const,
    render: (row) => {
      const state = row.processDefinition?.suspensionState
      return (
        <NSpace size="small">
          {hasPermission('bpm:model:update')
            ? <NButton text type="primary" onClick={() => goEdit(row.id)}>修改</NButton>
            : null}
          {hasPermission('bpm:model:create')
            ? <NButton text type="primary" onClick={() => goCopy(row.id)}>复制</NButton>
            : null}
          {hasPermission('bpm:model:deploy')
            ? <NButton text type="primary" onClick={() => handleDeploy(row)}>发布</NButton>
            : null}
          {row.processDefinition
            ? <NButton text onClick={() => openHistory(row)}>历史</NButton>
            : null}
          {row.processDefinition
            ? <NButton text type="info" onClick={() => goReport(row)}>报表</NButton>
            : null}
          {row.processDefinition && state === 1 && hasPermission('bpm:model:update')
            ? <NButton text type="warning" onClick={() => handleState(row, 2)}>挂起</NButton>
            : null}
          {row.processDefinition && state === 2 && hasPermission('bpm:model:update')
            ? <NButton text type="success" onClick={() => handleState(row, 1)}>激活</NButton>
            : null}
          {row.processDefinition && hasPermission('bpm:model:delete')
            ? <NButton text type="warning" onClick={() => handleClean(row)}>清理</NButton>
            : null}
          {hasPermission('bpm:model:delete')
            ? <NButton text type="error" onClick={() => handleDelete(row)}>删除</NButton>
            : null}
        </NSpace>
      )
    },
  },
]

async function loadData() {
  loading.value = true
  try {
    const [modelList, categoryList] = await Promise.all([
      ModelApi.getModelList(keyword.value || undefined),
      CategoryApi.getCategorySimpleList(),
    ])
    models.value = (Array.isArray(modelList) ? modelList : []) as ModelRow[]
    categories.value = (categoryList || []) as CategoryVO[]
  }
  catch (e: any) {
    message.error(e?.message || '加载失败')
    models.value = []
  }
  finally {
    loading.value = false
  }
}

function goCreate() {
  router.push({ name: resolveBpmRouteName(router, 'Bpm-ModelEditor', 'BpmModelEditor'), params: { type: 'create' } })
}

function goEdit(id: number) {
  router.push({
    name: resolveBpmRouteName(router, 'Bpm-ModelEditor', 'BpmModelEditor'),
    params: { type: 'update', id: String(id) },
  })
}

function goCopy(id: number) {
  router.push({
    name: resolveBpmRouteName(router, 'Bpm-ModelEditor', 'BpmModelEditor'),
    params: { type: 'copy', id: String(id) },
  })
}

function openHistory(row: ModelRow) {
  historyRef.value?.open(row.key)
}

function goReport(row: ModelRow) {
  const defId = row.processDefinition?.id
  if (!defId) {
    message.warning('该模型尚未发布，无法查看报表')
    return
  }
  router.push({
    name: resolveBpmRouteName(router, 'Bpm-ProcessInstanceReport', 'BpmProcessInstanceReport'),
    query: {
      processDefinitionId: String(defId),
      processDefinitionKey: row.key,
    },
  })
}

function openSortModal() {
  sortList.value = [...models.value]
  sortVisible.value = true
}

async function saveSort() {
  sortSaving.value = true
  try {
    await ModelApi.updateModelSortBatch(sortList.value.map(m => m.id))
    message.success('排序已保存')
    sortVisible.value = false
    await loadData()
  }
  catch (e: any) {
    message.error(e?.message || '排序失败')
  }
  finally {
    sortSaving.value = false
  }
}

function handleDeploy(row: ModelRow) {
  dialog.warning({
    title: '确认发布',
    content: `是否发布流程「${row.name}」？`,
    positiveText: '发布',
    negativeText: '取消',
    onPositiveClick: async () => {
      await ModelApi.deployModel(row.id)
      message.success('发布成功')
      await loadData()
    },
  })
}

function handleState(row: ModelRow, state: number) {
  const label = state === 1 ? '激活' : '挂起'
  dialog.warning({
    title: `确认${label}`,
    content: `是否${label}流程「${row.name}」？`,
    positiveText: label,
    negativeText: '取消',
    onPositiveClick: async () => {
      await ModelApi.updateModelState(row.id, state)
      message.success(`${label}成功`)
      await loadData()
    },
  })
}

function handleClean(row: ModelRow) {
  dialog.warning({
    title: '确认清理',
    content: `是否清理流程「${row.name}」的历史实例数据？此操作不可恢复。`,
    positiveText: '清理',
    negativeText: '取消',
    onPositiveClick: async () => {
      await ModelApi.cleanModel(row.id)
      message.success('清理成功')
      await loadData()
    },
  })
}

function handleDelete(row: ModelRow) {
  dialog.warning({
    title: '确认删除',
    content: `是否删除流程「${row.name}」？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await ModelApi.deleteModel(row.id)
      message.success('删除成功')
      await loadData()
    },
  })
}

onMounted(loadData)
</script>

<style scoped>
.bpm-model-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
}
.bpm-model-page__toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}
.bpm-model-page__empty {
  padding: 48px 0;
}
.bpm-model-name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.bpm-model-name__icon,
.bpm-model-name__img {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  flex-shrink: 0;
}
.bpm-model-name__icon {
  background: #3473ff;
  color: #fff;
  font-size: 12px;
}
.bpm-model-name__img {
  object-fit: cover;
  background: #f3f4f6;
}
:deep(.n-collapse-item__header) {
  font-weight: 600;
}
.bpm-model-sort-hint {
  margin: 0 0 12px;
  color: #6b7280;
  font-size: 13px;
}
.bpm-model-sort-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow: auto;
}
.bpm-model-sort__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
}
.bpm-model-sort__handle {
  cursor: grab;
  color: #9ca3af;
}
.bpm-model-sort__key {
  margin-left: auto;
  color: #9ca3af;
  font-size: 12px;
}
</style>
