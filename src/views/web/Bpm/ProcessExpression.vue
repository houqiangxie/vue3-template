<template>
  <div>
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="expressionFields"
      @search="handleSearch"
    >
      <template #default>
        <n-space>
          <n-button
            v-if="hasPermission('bpm:process-expression:query')"
            secondary
            :loading="exporting"
            @click="handleExport"
          >
            导出
          </n-button>
          <n-button v-if="hasPermission('bpm:process-expression:create')" type="primary" @click="handleAdd">
            <template #icon>
              <n-icon size="14"><AddOutline /></n-icon>
            </template>
            新增
          </n-button>
        </n-space>
      </template>
    </SearchPanel>

    <CommonTable
      class="page-container__table"
      flex-height
      show-index
      col-setting-key="bpm-process-expression"
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
      @confirm="handleSubmit"
    />
  </div>
</template>

<script setup lang="tsx">
import { AddOutline } from '@vicons/ionicons5'
import { ProcessExpressionApi, type ProcessExpressionVO } from '@/api/bpm/processExpression'
import { usePermission } from '@/hooks/usePermission'
import { useDownload } from '@/hooks/useDownload'
import { bpmStatusOptions, buildBpmPageQuery, toBpmPageResult } from './constants'

const { hasPermission } = usePermission()
const { download } = useDownload()
const exporting = ref(false)

const expressionFields = defineFields([
  {
    key: 'name',
    label: '名字',
    component: 'NInput',
    search: { enabled: true },
    form: { required: true },
    table: { minWidth: 140 },
  },
  {
    key: 'status',
    label: '状态',
    component: 'NSelect',
    options: bpmStatusOptions,
    form: { required: true, defaultValue: 0 },
    search: { enabled: true, defaultValue: null },
    table: {
      width: 90,
      format: 'option',
      tagType: val => (val === 0 ? 'success' : 'error'),
    },
  },
  {
    key: 'expression',
    label: '表达式',
    component: 'NInput',
    bind: { type: 'textarea', rows: 4 },
    form: { required: true, span: 2 },
    search: false,
    table: { minWidth: 220, ellipsis: { tooltip: true } },
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
  formVisible,
  formData,
  isEdit,
  submitting,
  openCreate,
  openEdit,
  submitCreateOrUpdate,
  removeAndRefresh,
} = useCrud({
  fetcher: async query =>
    toBpmPageResult(await ProcessExpressionApi.getProcessExpressionPage(buildBpmPageQuery(query))),
  defaults: extractSearchDefaults(expressionFields),
  formDefaults: () => extractFormDefaults(expressionFields),
})

const tableFields = computed(() => [
  ...expressionFields,
  {
    key: 'actions',
    label: '操作',
    form: false,
    search: false,
    table: {
      width: 140,
      fixed: 'right' as const,
      actions: () => [
        {
          key: 'edit',
          label: '修改',
          type: 'primary',
          permission: 'bpm:process-expression:update',
          onClick: (r) => openEdit(r as unknown as ProcessExpressionVO),
        },
        {
          key: 'delete',
          label: '删除',
          type: 'error',
          permission: 'bpm:process-expression:delete',
          popconfirm: (r) => `是否确认删除表达式「${(r as unknown as ProcessExpressionVO).name}」？`,
          onClick: async (r) => {
            await removeAndRefresh(() =>
              ProcessExpressionApi.deleteProcessExpression((r as unknown as ProcessExpressionVO).id),
            )
          },
        },
      ],
    },
  },
])

const formModalConfig = computed(() => defineModal({
  title: isEdit.value ? '修改流程表达式' : '新增流程表达式',
  width: 560,
  sections: [{
    type: 'form',
    key: 'main',
    fields: expressionFields,
    formProps: { cols: 2, labelWidth: 80 },
  }],
}))

function handleAdd() {
  openCreate({ status: 0 })
}

async function handleExport() {
  exporting.value = true
  try {
    await download('/jgzf-flowable/bpm/process-expression/export-excel', {
      params: { ...searchModel.value } as Record<string, unknown>,
      filename: `process_expression_${Date.now()}.xlsx`,
    })
  }
  finally {
    exporting.value = false
  }
}

async function handleSubmit() {
  await submitCreateOrUpdate(
    ProcessExpressionApi.createProcessExpression,
    ProcessExpressionApi.updateProcessExpression,
  )
}
</script>
