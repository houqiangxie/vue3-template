<template>
  <div>
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="genFields"
      @search="handleSearch"
    >
      <template #default>
        <n-button v-if="hasPermission('tool:gen:import')" type="primary" @click="openImport">
          导入
        </n-button>
        <n-button
          v-if="hasPermission('tool:gen:code')"
          type="info"
          :disabled="!checkedIds.length"
          :loading="downloading"
          @click="handleBatchGen"
        >
          生成
        </n-button>
        <n-button
          v-if="hasPermission('tool:gen:remove')"
          type="error"
          :disabled="!checkedIds.length"
          @click="handleBatchDelete"
        >
          删除
        </n-button>
      </template>
    </SearchPanel>

    <CommonTable
      class="page-container__table"
      flex-height
      selectable
      col-setting-key="tool-gen"
      v-model:checked-row-keys="checkedIds"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :row-key="(row: any) => row.tableId"
      :loading="loading"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
    />

    <CommonModal
      v-model:show="importVisible"
      title="导入表"
      :width="760"
      @confirm="handleImport"
    >
      <SearchPanel
        v-model:search-model="dbSearch"
        :fields="dbFields"
        @search="fetchDbList"
      />
      <CommonTable
        selectable
        col-setting-key="tool-gen-db"
        v-model:checked-row-keys="checkedDbTables"
        :data="dbTableData"
        :fields="dbFields"
        :page="dbSearch.pageNum as number"
        :page-size="dbSearch.pageSize as number"
        :item-count="dbTotal"
        :row-key="(row: any) => row.tableName"
        :loading="dbLoading"
        :table-props="{ maxHeight: 360 }"
        @update:page="onDbPageChange"
        @update:page-size="onDbPageSizeChange"
      />
    </CommonModal>

    <CommonModal
      v-model:show="editVisible"
      title="编辑生成配置"
      :width="960"
      :loading="editSubmitting"
      @confirm="handleEditSubmit"
    >
      <n-tabs v-model:value="editTab" type="line">
        <n-tab-pane name="basic" tab="基本信息">
          <n-form
            ref="editFormRef"
            :model="editInfo"
            label-placement="left"
            label-width="100"
            require-mark-placement="right-hanging"
          >
            <n-grid cols="1 m:2" responsive="screen" :x-gap="12">
              <n-form-item-gi label="表名称" path="tableName" required>
                <n-input v-model:value="editInfo.tableName" disabled />
              </n-form-item-gi>
              <n-form-item-gi label="表描述" path="tableComment" required>
                <n-input v-model:value="editInfo.tableComment" />
              </n-form-item-gi>
              <n-form-item-gi label="实体类名" path="className" required>
                <n-input v-model:value="editInfo.className" />
              </n-form-item-gi>
              <n-form-item-gi label="作者" path="functionAuthor">
                <n-input v-model:value="editInfo.functionAuthor" />
              </n-form-item-gi>
              <n-form-item-gi label="生成包路径" path="packageName" required>
                <n-input v-model:value="editInfo.packageName" />
              </n-form-item-gi>
              <n-form-item-gi label="生成模块名" path="moduleName" required>
                <n-input v-model:value="editInfo.moduleName" />
              </n-form-item-gi>
              <n-form-item-gi label="生成业务名" path="businessName" required>
                <n-input v-model:value="editInfo.businessName" />
              </n-form-item-gi>
              <n-form-item-gi label="生成功能名" path="functionName" required>
                <n-input v-model:value="editInfo.functionName" />
              </n-form-item-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="columns" tab="字段信息">
          <n-data-table
            :columns="columnEditColumns"
            :data="editColumns"
            size="small"
            :bordered="false"
            :max-height="420"
          />
        </n-tab-pane>
      </n-tabs>
    </CommonModal>

    <CommonModal
      v-model:show="previewVisible"
      title="代码预览"
      :width="1024"
      :show-footer="false"
    >
      <n-tabs v-if="previewFiles.length" type="card" size="small">
        <n-tab-pane
          v-for="file in previewFiles"
          :key="file.name"
          :name="file.name"
          :tab="file.name.split('/').pop() || file.name"
        >
          <div class="gen-preview-path">
            {{ file.name }}
          </div>
          <n-code :code="file.content" :language="previewLanguage(file.name)" word-wrap />
        </n-tab-pane>
      </n-tabs>
    </CommonModal>
  </div>
</template>

<script setup lang="tsx">
import type { DataTableColumns, FormInst } from 'naive-ui'
import { NCheckbox, NInput, NSelect } from 'naive-ui'
import {
  batchGenCodePath,
  deleteGenTable,
  downloadGenCodePath,
  genCode,
  getGenTable,
  importGenTable,
  listDbTable,
  listGenTable,
  previewGenCode,
  synchDb,
  updateGenTable,
} from '@/api/system/gen'
import type { GenTable, GenTableColumn } from '@/api/system/types'
import { useDownload } from '@/hooks/useDownload'
import { usePermission } from '@/hooks/usePermission'
import { unwrapData } from '@/utils/fetch'

defineOptions({ name: 'Tool-Gen' })

const { hasPermission } = usePermission()
const { confirmDanger, confirmBatchDelete, message } = useConfirm()
const { download, downloading } = useDownload()

const checkedIds = ref<Array<string | number>>([])
const importVisible = ref(false)
const editVisible = ref(false)
const previewVisible = ref(false)
const editSubmitting = ref(false)
const editTab = ref('basic')
const editFormRef = ref<FormInst | null>(null)
const editInfo = ref<Partial<GenTable>>({})
const editColumns = ref<GenTableColumn[]>([])
const previewFiles = ref<Array<{ name: string, content: string }>>([])
const checkedDbTables = ref<Array<string | number>>([])

const htmlTypeOptions = [
  { label: '文本框', value: 'input' },
  { label: '文本域', value: 'textarea' },
  { label: '下拉框', value: 'select' },
  { label: '单选框', value: 'radio' },
  { label: '复选框', value: 'checkbox' },
  { label: '日期控件', value: 'datetime' },
  { label: '富文本', value: 'editor' },
]

const queryTypeOptions = [
  { label: '=', value: 'EQ' },
  { label: '!=', value: 'NE' },
  { label: '>', value: 'GT' },
  { label: '>=', value: 'GE' },
  { label: '<', value: 'LT' },
  { label: '<=', value: 'LE' },
  { label: 'LIKE', value: 'LIKE' },
  { label: 'BETWEEN', value: 'BETWEEN' },
]

const genFields = defineFields([
  {
    key: 'tableName',
    label: '表名称',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: { minWidth: 140 },
  },
  {
    key: 'tableComment',
    label: '表描述',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: { minWidth: 140 },
  },
  {
    key: 'className',
    label: '实体',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 130 },
  },
  {
    key: 'createTime',
    label: '创建时间',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 170 },
  },
  {
    key: 'updateTime',
    label: '更新时间',
    component: 'NInput',
    form: false,
    search: false,
    table: { width: 170 },
  },
])

const dbFields = defineFields([
  {
    key: 'tableName',
    label: '表名称',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: { minWidth: 160 },
  },
  {
    key: 'tableComment',
    label: '表描述',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: { minWidth: 160 },
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
  fetchList,
  handleSearch,
  onPageChange,
  onPageSizeChange,
} = usePageList({
  fetcher: async q => toPageResult(await listGenTable(q)),
  defaults: extractSearchDefaults(genFields),
  onFetched: () => {
    checkedIds.value = []
  },
})

const {
  searchModel: dbSearch,
  tableData: dbTableData,
  total: dbTotal,
  loading: dbLoading,
  fetchList: fetchDbList,
  onPageChange: onDbPageChange,
  onPageSizeChange: onDbPageSizeChange,
} = usePageList({
  fetcher: async q => toPageResult(await listDbTable(q)),
  defaults: extractSearchDefaults(dbFields),
  immediate: false,
  onFetched: () => {
    checkedDbTables.value = []
  },
})

function yesNoCheckbox(row: GenTableColumn, key: keyof GenTableColumn) {
  return (
    <NCheckbox
      checked={row[key] === '1'}
      onUpdateChecked={(v: boolean) => {
        ;(row as any)[key] = v ? '1' : '0'
      }}
    />
  )
}

const columnEditColumns = computed<DataTableColumns<GenTableColumn>>(() => [
  { title: '字段列名', key: 'columnName', width: 120, ellipsis: { tooltip: true } },
  {
    title: '字段描述',
    key: 'columnComment',
    width: 130,
    render: row => (
      <NInput
        size="small"
        value={row.columnComment}
        onUpdateValue={v => { row.columnComment = v }}
      />
    ),
  },
  { title: '物理类型', key: 'columnType', width: 110 },
  {
    title: 'Java 属性',
    key: 'javaField',
    width: 120,
    render: row => (
      <NInput
        size="small"
        value={row.javaField}
        onUpdateValue={v => { row.javaField = v }}
      />
    ),
  },
  { title: '插入', key: 'isInsert', width: 60, render: row => yesNoCheckbox(row, 'isInsert') },
  { title: '编辑', key: 'isEdit', width: 60, render: row => yesNoCheckbox(row, 'isEdit') },
  { title: '列表', key: 'isList', width: 60, render: row => yesNoCheckbox(row, 'isList') },
  { title: '查询', key: 'isQuery', width: 60, render: row => yesNoCheckbox(row, 'isQuery') },
  {
    title: '查询方式',
    key: 'queryType',
    width: 110,
    render: row => (
      <NSelect
        size="small"
        options={queryTypeOptions}
        value={row.queryType}
        onUpdateValue={v => { row.queryType = v }}
      />
    ),
  },
  {
    title: '显示类型',
    key: 'htmlType',
    width: 120,
    render: row => (
      <NSelect
        size="small"
        options={htmlTypeOptions}
        value={row.htmlType}
        onUpdateValue={v => { row.htmlType = v }}
      />
    ),
  },
])

const tableFields = computed(() => [
  ...genFields,
  {
    key: 'actions',
    label: '操作',
    form: false,
    search: false,
    table: {
      width: 320,
      fixed: 'right' as const,
      actions: () => [
        {
          key: 'preview',
          label: '预览',
          type: 'info' as const,
          permission: 'tool:gen:preview',
          onClick: (r: Record<string, unknown>) => handlePreview(r as unknown as GenTable),
        },
        {
          key: 'edit',
          label: '编辑',
          type: 'primary' as const,
          permission: 'tool:gen:edit',
          onClick: (r: Record<string, unknown>) => handleEdit(r as unknown as GenTable),
        },
        {
          key: 'gen',
          label: '生成',
          type: 'success' as const,
          permission: 'tool:gen:code',
          onClick: (r: Record<string, unknown>) => handleGen(r as unknown as GenTable),
        },
        {
          key: 'sync',
          label: '同步',
          type: 'warning' as const,
          permission: 'tool:gen:edit',
          onClick: (r: Record<string, unknown>) => handleSync(r as unknown as GenTable),
        },
        {
          key: 'delete',
          label: '删除',
          type: 'error' as const,
          permission: 'tool:gen:remove',
          onClick: (r: Record<string, unknown>) => {
            const row = r as unknown as GenTable
            confirmDanger({
              title: '确认删除',
              content: `是否确认删除表「${row.tableName}」？`,
              successMessage: '删除成功',
              action: async () => {
                await deleteGenTable([row.tableId])
                await fetchList()
              },
            })
          },
        },
      ],
    },
  },
])

function openImport() {
  importVisible.value = true
  fetchDbList()
}

async function handleImport() {
  if (!checkedDbTables.value.length) {
    message.warning('请选择要导入的表')
    return false
  }
  await importGenTable(checkedDbTables.value.join(','))
  message.success('导入成功')
  importVisible.value = false
  await fetchList()
}

async function handleEdit(row: GenTable) {
  const res = await getGenTable(row.tableId)
  const detail = unwrapData(res)
  editInfo.value = { ...detail.info }
  editColumns.value = (detail.rows || []).map(c => ({ ...c }))
  editTab.value = 'basic'
  editVisible.value = true
}

async function handleEditSubmit() {
  if (!editInfo.value.tableId)
    return
  editSubmitting.value = true
  try {
    await updateGenTable({
      info: editInfo.value,
      rows: editColumns.value,
    })
    message.success('保存成功')
    editVisible.value = false
    await fetchList()
  }
  finally {
    editSubmitting.value = false
  }
}

function previewLanguage(name: string) {
  if (name.endsWith('.java'))
    return 'java'
  if (name.endsWith('.xml'))
    return 'xml'
  if (name.endsWith('.vue'))
    return 'html'
  if (name.endsWith('.ts'))
    return 'typescript'
  if (name.endsWith('.sql'))
    return 'sql'
  return 'text'
}

async function handlePreview(row: GenTable) {
  const res = await previewGenCode(row.tableId)
  const data = unwrapData(res) || {}
  previewFiles.value = Object.entries(data).map(([name, content]) => ({
    name,
    content: String(content),
  }))
  previewVisible.value = true
}

/** genType=0 下载 zip；genType=1 生成到自定义路径 */
async function handleGen(row: GenTable) {
  if (row.genType === '1') {
    confirmDanger({
      title: '确认生成',
      content: `是否生成表「${row.tableName}」到自定义路径？`,
      successMessage: '生成成功',
      action: async () => {
        await genCode(row.tableName)
      },
    })
    return
  }
  await download(downloadGenCodePath(row.tableName), {
    filename: `${row.tableName}.zip`,
  })
  message.success('代码已下载')
}

async function handleBatchGen() {
  const idSet = new Set(checkedIds.value.map(Number))
  const names = tableData.value
    .filter(r => idSet.has(Number((r as GenTable).tableId)))
    .map(r => (r as GenTable).tableName)
    .filter(Boolean)
  if (!names.length) {
    message.warning('请选择要生成的表')
    return
  }
  await download(batchGenCodePath, {
    params: { tables: names.join(',') },
    filename: 'ruoyi.zip',
  })
  message.success('代码已下载')
}

function handleSync(row: GenTable) {
  confirmDanger({
    title: '确认同步',
    content: `是否同步表「${row.tableName}」的数据库结构？`,
    successMessage: '同步成功',
    action: async () => {
      await synchDb(row.tableName)
      await fetchList()
    },
  })
}

function handleBatchDelete() {
  confirmBatchDelete({
    count: checkedIds.value.length,
    label: '生成表',
    action: () => deleteGenTable(checkedIds.value as number[]),
    onDone: fetchList,
  })
}
</script>

<style scoped>
.gen-preview-path {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--n-text-color-3);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  word-break: break-all;
}
</style>
