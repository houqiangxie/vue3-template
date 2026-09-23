<template>
  <div class="bpm-form-page">
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="searchFields"
      @search="handleSearch"
    >
      <template #default>
        <n-button v-if="hasPermission('bpm:form:create')" type="primary" @click="handleAdd">
          <template #icon>
            <n-icon size="14"><AddOutline /></n-icon>
          </template>
          新增
        </n-button>
      </template>
    </SearchPanel>

    <CommonTable
      class="page-container__table"
      flex-height
      show-index
      col-setting-key="bpm-form-v3"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :row-key="(row: Record<string, unknown>) => row.id as number"
      :loading="loading"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
    />

    <CommonModal
      v-model:show="formVisible"
      v-model:form-model="formData"
      :config="formModalConfig"
      :loading="submitting"
      :confirm-text="isEdit ? '确定' : '保存并设计'"
      @confirm="handleSubmit"
    >
      <template v-if="isEdit && formData.id" #footer>
        <n-button type="primary" secondary :disabled="submitting" @click="goDesign(Number(formData.id))">
          设计表单
        </n-button>
      </template>
    </CommonModal>

    <BpmFormPreviewDialog ref="previewRef" />
  </div>
</template>

<script setup lang="tsx">
import { AddOutline } from '@vicons/ionicons5'
import { useRouter } from 'vue-router'
import {
  createForm,
  deleteForm,
  getForm,
  getFormPage,
  updateForm,
  type FormVO,
} from '@/api/bpm/form'
import { usePermission } from '@/hooks/usePermission'
import { bpmStatusOptions, buildBpmPageQuery, extractBpmId, toBpmPageResult } from './constants'
import { resolveBpmRouteName } from './routeNames'
import BpmFormPreviewDialog from './components/BpmFormPreviewDialog.vue'

defineOptions({ name: 'Bpm-Form' })

const { hasPermission } = usePermission()
const router = useRouter()
const message = useMessage()
const previewRef = ref<InstanceType<typeof BpmFormPreviewDialog>>()

const searchFields = defineFields([
  {
    key: 'name',
    label: '表单名',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: false,
  },
])

const formFields = defineFields([
  {
    key: 'name',
    label: '表单名',
    component: 'NInput',
    form: { required: true, span: 2 },
    search: false,
    table: { minWidth: 160 },
  },
  {
    key: 'status',
    label: '状态',
    component: 'NSelect',
    options: bpmStatusOptions,
    form: { required: true, defaultValue: 0 },
    search: false,
    table: {
      width: 90,
      format: 'option',
      tagType: val => (val === 0 ? 'success' : 'error'),
    },
  },
  {
    key: 'remark',
    label: '备注',
    component: 'NInput',
    bind: { type: 'textarea', rows: 2 },
    form: { span: 2 },
    search: false,
    table: { minWidth: 140, ellipsis: { tooltip: true } },
  },
  {
    key: 'fieldCount',
    label: '字段数',
    component: 'NInput',
    form: false,
    search: false,
    table: {
      width: 90,
      render: (row: Record<string, unknown>) => {
        const fields = (row as unknown as FormVO).fields
        return Array.isArray(fields) ? fields.length : 0
      },
    },
  },
  {
    key: 'createTime',
    label: '创建时间',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 170 },
  },
])

const {
  searchModel,
  tableData,
  total,
  loading,
  handleSearch,
  onPageChange,
  onPageSizeChange,
  fetchList,
  formVisible,
  formData,
  isEdit,
  submitting,
  openCreate,
  openEdit,
  submitCreateOrUpdate,
  removeAndRefresh,
} = useCrud({
  fetcher: async (query) => {
    try {
      return toBpmPageResult(await getFormPage(buildBpmPageQuery(query)))
    }
    catch (e: any) {
      if (!e?.shown)
        message.error(e?.message || '加载表单列表失败')
      return { rows: [], total: 0 }
    }
  },
  defaults: extractSearchDefaults(searchFields),
  formDefaults: () => extractFormDefaults(formFields),
})

/** 从设计器返回时强制刷新（keep-alive 激活） */
onActivated(() => {
  void fetchList()
})

const canDesign = computed(() =>
  hasPermission('bpm:form:update') || hasPermission('bpm:form:create') || hasPermission('bpm:form:query'),
)

const tableFields = computed(() => [
  ...formFields.filter(f => f.table !== false),
  {
    key: 'actions',
    label: '操作',
    form: false,
    search: false,
    table: {
      width: 320,
      fixed: 'right' as const,
      actionsMax: 5,
      actions: () => {
        const actions: any[] = []
        if (canDesign.value) {
          actions.push({
            key: 'design',
            label: '设计',
            type: 'primary',
            onClick: (r: Record<string, unknown>) => goDesign((r as unknown as FormVO).id),
          })
        }
        actions.push(
          {
            key: 'preview',
            label: '详情',
            type: 'primary',
            onClick: (r: Record<string, unknown>) => openPreview(r as unknown as FormVO),
          },
          {
            key: 'edit',
            label: '修改',
            type: 'primary',
            permission: 'bpm:form:update',
            onClick: (r: Record<string, unknown>) => openEdit(r as unknown as FormVO),
          },
          {
            key: 'copy',
            label: '复制',
            type: 'primary',
            permission: 'bpm:form:create',
            onClick: (r: Record<string, unknown>) => handleCopy(r as unknown as FormVO),
          },
          {
            key: 'delete',
            label: '删除',
            type: 'error',
            permission: 'bpm:form:delete',
            popconfirm: (r: Record<string, unknown>) =>
              `是否确认删除表单「${(r as unknown as FormVO).name}」？`,
            onClick: async (r: Record<string, unknown>) => {
              await removeAndRefresh(() => deleteForm((r as unknown as FormVO).id))
            },
          },
        )
        return actions
      },
    },
  },
])

const formModalConfig = computed(() => defineModal({
  title: isEdit.value ? '修改流程表单' : '新增流程表单',
  width: 560,
  description: isEdit.value
    ? '可点击「设计表单」打开 FormBuilder 设计器'
    : '保存后将自动进入 FormBuilder 设计字段',
  sections: [{
    type: 'form',
    key: 'main',
    fields: formFields.filter(f => f.key !== 'fieldCount'),
    formProps: { cols: 2, labelWidth: 90 },
  }],
}))

function openPreview(row: FormVO) {
  if (!row?.id) {
    message.warning('表单不存在')
    return
  }
  previewRef.value?.openByFormId(row.id, '表单详情')
}

function goDesign(id: number) {
  if (!id || !Number.isFinite(id) || id <= 0) {
    message.warning('请先保存表单')
    return
  }
  formVisible.value = false
  const idStr = String(id)
  // BPM 独立应用优先走同应用内设计页，保证带 id 且返回列表路由一致
  if (router.hasRoute('BpmFormDesign')) {
    router.push({ name: 'BpmFormDesign', params: { id: idStr }, query: { bpmFormId: idStr } })
    return
  }
  if (router.hasRoute('Tool-Build')) {
    router.push({ name: 'Tool-Build', query: { bpmFormId: idStr } })
    return
  }
  const name = resolveBpmRouteName(router, 'Tool-Build', 'BpmFormDesign')
  router.push({ name, query: { bpmFormId: idStr }, params: { id: idStr } }).catch(() => {
    message.error('未找到表单设计器路由，请确认已配置 Tool/Build 或 BPM 表单设计页')
  })
}

function handleAdd() {
  openCreate({
    status: 0,
    conf: JSON.stringify({ engine: 'formBuilder', version: 1, formCols: 2 }),
    fields: [],
  })
}

async function handleCopy(row: FormVO) {
  if (!row?.id) {
    message.warning('表单不存在')
    return
  }
  try {
    const detail = (await getForm(row.id) as FormVO) || row
    openCreate({
      name: `${detail.name || row.name || '表单'}_copy`,
      status: detail.status ?? 0,
      remark: detail.remark || '',
      conf: detail.conf
        || JSON.stringify({ engine: 'formBuilder', version: 1, formCols: 2 }),
      fields: Array.isArray(detail.fields) ? [...detail.fields] : [],
    })
  }
  catch (e: any) {
    if (!e?.shown)
      message.error(e?.message || '复制失败')
  }
}

async function handleSubmit() {
  if (isEdit.value) {
    await submitCreateOrUpdate(createForm, updateForm)
    return
  }

  // 新增：先落库 → 列表出现数据 → 再带 id 进设计器
  submitting.value = true
  try {
    const body = {
      ...formData.value,
      conf: formData.value.conf
        || JSON.stringify({ engine: 'formBuilder', version: 1, formCols: 2 }),
      fields: Array.isArray(formData.value.fields) ? formData.value.fields : [],
      status: formData.value.status ?? 0,
    }
    const raw = await createForm(body as FormVO)
    const newId = extractBpmId(raw)
    if (!newId) {
      message.error('创建成功，但未返回表单 ID')
      await fetchList()
      return
    }
    message.success('新增成功')
    formVisible.value = false
    await fetchList()
    goDesign(newId)
  }
  catch (e: any) {
    if (!e?.shown)
      message.error(e?.message || '创建失败')
  }
  finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.bpm-form-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>
