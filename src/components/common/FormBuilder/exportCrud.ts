import type { BuilderField } from './types'
import { serializeDefineFields } from './serialize'
import { resolveFieldKey } from './utils'

export interface CrudExportConfig {
  moduleName: string
  businessName: string
  functionName: string
  pkField: string
  labelField: string
  fieldsVarName: string
  formCols: number
  modalWidth?: number
  includeApi?: boolean
}

export interface CrudExportFile {
  name: string
  content: string
}

export interface CrudExportResult {
  vue: string
  api: string
  files: CrudExportFile[]
}

function toCamel(s: string) {
  return s.replace(/[-_]([a-z])/g, (_, c: string) => c.toUpperCase())
}

function toPascal(s: string) {
  const camel = toCamel(s)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}

function toKebab(s: string) {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase()
}

export function inferPkField(fields: BuilderField[]): string {
  const tablePk = fields.find((field) => {
    const key = resolveFieldKey(field)
    return /Id$/.test(key) && field.form === false && field.table !== false
  })
  if (tablePk)
    return resolveFieldKey(tablePk)

  const idField = fields.find(field => /Id$/.test(resolveFieldKey(field)))
  if (idField)
    return resolveFieldKey(idField)

  return 'id'
}

export function inferLabelField(fields: BuilderField[], pkField: string): string {
  const tableFields = fields.filter(field => field.table !== false)
  const textField = tableFields.find((field) => {
    const key = resolveFieldKey(field)
    if (key === pkField)
      return false
    return ['NInput', 'NInputNumber'].includes(String(field.component))
  })
  if (textField)
    return resolveFieldKey(textField)

  const fallback = tableFields.find(field => resolveFieldKey(field) !== pkField)
  return fallback ? resolveFieldKey(fallback) : pkField
}

export function inferFieldsVarName(businessName: string) {
  const camel = toCamel(businessName)
  return `${camel}Fields`
}

export function inferApiPrefix(businessName: string) {
  return toPascal(businessName)
}

export function inferPageName(moduleName: string, businessName: string) {
  return `${toPascal(moduleName)}-${toPascal(businessName)}`
}

export function inferModalWidth(formCols: number) {
  if (formCols <= 1)
    return 560
  if (formCols === 2)
    return 720
  return 860
}

function buildApiFile(config: CrudExportConfig): string {
  const { moduleName, businessName, pkField } = config
  const apiPrefix = inferApiPrefix(businessName)
  const typeName = `Sys${apiPrefix}`

  return `import type { PageQuery, PageResult, ${typeName} } from './types'
import { del, get, post, put } from '@/utils/fetch'

/** ${config.functionName}分页 */
export function list${apiPrefix}(query: PageQuery = {}) {
  return get<PageResult<${typeName}>>('/${moduleName}/${businessName}/list', query)
}

/** ${config.functionName}详情 */
export function get${apiPrefix}(${pkField}: number) {
  return get<${typeName}>(\`/${moduleName}/${businessName}/\${${pkField}}\`)
}

/** 新增${config.functionName} */
export function add${apiPrefix}(data: Partial<${typeName}>) {
  return post('/${moduleName}/${businessName}', data)
}

/** 修改${config.functionName} */
export function update${apiPrefix}(data: Partial<${typeName}>) {
  return put('/${moduleName}/${businessName}', data)
}

/** 删除${config.functionName} */
export function delete${apiPrefix}(${pkField}s: number[]) {
  return del(\`/${moduleName}/${businessName}/\${${pkField}s.join(',')}\`)
}
`
}

function buildVueFile(fields: BuilderField[], config: CrudExportConfig): string {
  const {
    moduleName,
    businessName,
    functionName,
    pkField,
    labelField,
    fieldsVarName,
    formCols,
  } = config
  const apiPrefix = inferApiPrefix(businessName)
  const pageName = inferPageName(moduleName, businessName)
  const permPrefix = `${moduleName}:${businessName}`
  const colSettingKey = `${moduleName}-${toKebab(businessName)}`
  const modalWidth = config.modalWidth ?? inferModalWidth(formCols)
  const fieldsBlock = serializeDefineFields(fields, fieldsVarName)

  return `<template>
  <div>
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="${fieldsVarName}"
      @search="handleSearch"
    >
      <template #default>
        <n-button v-if="hasPermission('${permPrefix}:add')" type="primary" @click="handleAdd">
          <template #icon>
            <n-icon size="14"><AddOutline /></n-icon>
          </template>
          新增
        </n-button>
        <n-button
          v-if="hasPermission('${permPrefix}:remove')"
          type="error"
          secondary
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
      col-setting-key="${colSettingKey}"
      v-model:checked-row-keys="checkedIds"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :row-key="(row: Record<string, unknown>) => row.${pkField} as number"
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
import {
  add${apiPrefix},
  delete${apiPrefix},
  list${apiPrefix},
  update${apiPrefix},
} from '@/api/${moduleName}/${businessName}'
import { usePermission } from '@/hooks/usePermission'

defineOptions({ name: '${pageName}' })

const { hasPermission } = usePermission()
const { confirmBatchDelete } = useConfirm()
const checkedIds = ref<Array<string | number>>([])

${fieldsBlock}
const {
  searchModel,
  tableData,
  total,
  loading,
  fetchList,
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
  fetcher: async query => toPageResult(await list${apiPrefix}(query)),
  defaults: extractSearchDefaults(${fieldsVarName}),
  formDefaults: () => extractFormDefaults(${fieldsVarName}),
})

const tableFields = computed(() => [
  ...${fieldsVarName},
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
          permission: '${permPrefix}:edit',
          onClick: (r) => openEdit(r as Record<string, unknown>),
        },
        {
          key: 'delete',
          label: '删除',
          type: 'error',
          permission: '${permPrefix}:remove',
          popconfirm: (r) => \`是否确认删除「\${(r as Record<string, unknown>).${labelField}}」？\`,
          onClick: async (r) => {
            await removeAndRefresh(() => delete${apiPrefix}([(r as Record<string, unknown>).${pkField} as number]))
          },
        },
      ],
    },
  },
])

const formModalConfig = computed(() => defineModal({
  title: isEdit.value ? '修改${functionName}' : '新增${functionName}',
  width: ${modalWidth},
  sections: [{
    type: 'form',
    key: 'main',
    fields: ${fieldsVarName},
    formProps: { cols: ${formCols}, labelWidth: 90 },
  }],
}))

function handleAdd() {
  openCreate()
}

function handleBatchDelete() {
  confirmBatchDelete({
    count: checkedIds.value.length,
    label: '${functionName}',
    action: () => delete${apiPrefix}(checkedIds.value as number[]),
    onDone: fetchList,
  })
}

async function handleSubmit() {
  await submitCreateOrUpdate(add${apiPrefix}, update${apiPrefix})
}
</script>
`
}

export function exportCrudPage(fields: BuilderField[], config: CrudExportConfig): CrudExportResult {
  const vue = buildVueFile(fields, config)
  const api = buildApiFile(config)
  const vueFileName = `src/views/web/${toPascal(config.moduleName)}/${toPascal(config.businessName)}.vue`
  const apiFileName = `src/api/${config.moduleName}/${config.businessName}.ts`

  const files: CrudExportFile[] = [{ name: vueFileName, content: vue }]
  if (config.includeApi !== false)
    files.push({ name: apiFileName, content: api })

  return { vue, api, files }
}
