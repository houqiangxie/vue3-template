<template>
  <div class="sql-search-demo !overflow-auto">
    <n-space vertical :size="16">
      <n-card title="SqlSearch 示例" :bordered="false">
        <n-alert type="info" :bordered="false" class="mb-4">
          支持宽松/严格校验、列名白名单、LIKE 转义、参数化 SQL、repair 回显、SearchPanel 自动 validate + toParams。
        </n-alert>

        <n-space class="mb-4" align="center" wrap>
          <n-button type="primary" @click="loadSample">
            填入示例条件
          </n-button>
          <n-button @click="resetValue">
            重置
          </n-button>
          <n-button quaternary @click="runValidate">
            校验
          </n-button>
          <n-button quaternary @click="copySql">
            复制 SQL
          </n-button>
          <n-button quaternary @click="copyJson">
            复制 JSON
          </n-button>
          <n-button quaternary @click="copyParams">
            复制 Params
          </n-button>
          <n-divider vertical />
          <span class="opt-label">校验模式</span>
          <n-radio-group v-model:value="validationMode" size="small">
            <n-radio-button value="lenient">
              宽松
            </n-radio-button>
            <n-radio-button value="strict">
              严格
            </n-radio-button>
          </n-radio-group>
          <span class="opt-label">SQL 预览</span>
          <n-switch v-model:value="showSqlPreview" size="small" />
          <span class="opt-label">禁用</span>
          <n-switch v-model:value="disabled" size="small" />
          <span class="opt-label">最大层级</span>
          <n-input-number
            v-model:value="maxDepth"
            size="small"
            :min="0"
            :max="8"
            style="width: 90px"
          />
        </n-space>

        <SqlSearch
          ref="sqlSearchRef"
          v-model:value="searchValue"
          :fields="demoFields"
          :show-sql-preview="showSqlPreview"
          :disabled="disabled"
          :max-depth="maxDepth"
          :validation-mode="validationMode"
          @copy="onCopySql"
        />
      </n-card>

      <n-card title="输出" size="small" :bordered="false">
        <n-grid :cols="2" :x-gap="16" :y-gap="12" responsive="screen" item-responsive>
          <n-gi span="2 m:1">
            <div class="output-label">
              编译 SQL
            </div>
            <n-input
              type="textarea"
              :value="sqlText || '-- 请完善搜索条件'"
              readonly
              :autosize="{ minRows: 4, maxRows: 10 }"
            />
          </n-gi>
          <n-gi span="2 m:1">
            <div class="output-label">
              参数化 SQL
            </div>
            <n-input
              type="textarea"
              :value="parameterizedText"
              readonly
              :autosize="{ minRows: 4, maxRows: 10 }"
            />
          </n-gi>
          <n-gi span="2 m:1">
            <div class="output-label">
              条件 JSON
            </div>
            <n-input
              type="textarea"
              :value="jsonText"
              readonly
              :autosize="{ minRows: 4, maxRows: 10 }"
            />
          </n-gi>
          <n-gi span="2 m:1">
            <div class="output-label">
              toParams
              <n-tag size="small" :type="paramsOk ? 'success' : 'warning'" :bordered="false" class="ml-2">
                {{ paramsOk ? '可提交' : '未完整' }}
              </n-tag>
            </div>
            <n-input
              type="textarea"
              :value="paramsText"
              readonly
              :autosize="{ minRows: 3, maxRows: 8 }"
            />
          </n-gi>
        </n-grid>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import type { SqlSearchFieldDef, SqlSearchValue, SqlValidationMode } from '@/components/common/SqlSearch/types'
import type { ComponentPublicInstance } from 'vue'
import {
  compileSqlSearch,
  compileSqlSearchParameterized,
  createDefaultSqlSearchValue,
  genSqlSearchId,
  repairSqlSearchValue,
  toSqlSearchParams,
  toSqlSearchParamsPruned,
} from '@/components/common/SqlSearch/utils'
import { useMessage } from 'naive-ui'

defineOptions({ name: 'Demo-SqlSearchDemo' })

interface SqlSearchExpose {
  getSql: () => string
  getParameterizedSql: () => { sql: string, params: unknown[] }
  getValue: () => SqlSearchValue
  isComplete: () => boolean
  toParams: () => ReturnType<typeof toSqlSearchParams>
  toParamsPruned: () => ReturnType<typeof toSqlSearchParamsPruned>
  validate: () => boolean
  reset: (value?: SqlSearchValue) => void
  repair: (value: unknown) => void
}

const message = useMessage()

const demoFields: SqlSearchFieldDef[] = [
  { key: 'userName', label: '用户名', column: 'u.user_name', type: 'string', placeholder: '支持模糊匹配' },
  { key: 'nickName', label: '昵称', column: 'u.nick_name', type: 'string' },
  {
    key: 'status',
    label: '状态',
    column: 'u.status',
    type: 'select',
    defaultOperator: 'eq',
    options: [
      { label: '正常', value: '1' },
      { label: '停用', value: '0' },
    ],
  },
  { key: 'age', label: '年龄', column: 'u.age', type: 'number' },
  { key: 'createTime', label: '创建时间', column: 'u.create_time', type: 'datetime' },
  { key: 'enabled', label: '是否启用', column: 'u.enabled', type: 'boolean' },
]

const searchValue = ref<SqlSearchValue>(createDefaultSqlSearchValue())
const showSqlPreview = ref(true)
const disabled = ref(false)
const maxDepth = ref(0)
const validationMode = ref<SqlValidationMode>('lenient')
const sqlSearchRef = ref<(ComponentPublicInstance & SqlSearchExpose) | null>(null)

const sqlText = computed(() => compileSqlSearch(searchValue.value, demoFields))
const parameterizedText = computed(() => {
  const { sql, params } = compileSqlSearchParameterized(searchValue.value, demoFields)
  if (!sql)
    return '-- 请完善搜索条件'
  return `${sql}\n\n-- params: ${JSON.stringify(params)}`
})
const jsonText = computed(() => JSON.stringify(searchValue.value, null, 2))
const params = computed(() =>
  validationMode.value === 'strict'
    ? toSqlSearchParams(searchValue.value, demoFields, 'strict')
    : (toSqlSearchParams(searchValue.value, demoFields, 'lenient') ?? toSqlSearchParamsPruned(searchValue.value, demoFields)),
)
const paramsOk = computed(() => !!params.value)
const paramsText = computed(() =>
  params.value ? JSON.stringify(params.value, null, 2) : '-- 完善条件后生成',
)

function resetValue() {
  sqlSearchRef.value?.reset() ?? (searchValue.value = createDefaultSqlSearchValue())
}

function runValidate() {
  const ok = sqlSearchRef.value?.validate() ?? false
  message[ok ? 'success' : 'warning'](ok ? '条件完整，可提交' : '请完善高亮条件')
}

function loadSample() {
  const raw = {
    type: 'group',
    id: genSqlSearchId(),
    logic: 'and',
    children: [
      {
        type: 'condition',
        id: genSqlSearchId(),
        field: 'status',
        operator: 'eq',
        value: '1',
      },
      {
        type: 'condition',
        id: genSqlSearchId(),
        field: 'userName',
        operator: 'startsWith',
        value: 'admin%_test',
      },
      {
        type: 'condition',
        id: genSqlSearchId(),
        field: 'enabled',
        operator: 'eq',
        value: true,
      },
      {
        type: 'group',
        id: genSqlSearchId(),
        logic: 'or',
        children: [
          {
            type: 'condition',
            id: genSqlSearchId(),
            field: 'age',
            operator: 'between',
            value: [18, 45],
          },
          {
            type: 'condition',
            id: genSqlSearchId(),
            field: 'createTime',
            operator: 'gte',
            value: new Date('2024-01-01T00:00:00').getTime(),
          },
        ],
      },
    ],
  }
  sqlSearchRef.value?.repair(raw) ?? (searchValue.value = repairSqlSearchValue(raw, demoFields))
}

async function copyText(text: string, okMsg: string) {
  if (!text) {
    message.warning('暂无内容可复制')
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    message.success(okMsg)
  }
  catch {
    message.error('复制失败')
  }
}

function onCopySql(sql: string) {
  if (sql)
    message.success('SQL 已复制')
}

function copySql() {
  copyText(sqlSearchRef.value?.getSql() || sqlText.value, 'SQL 已复制')
}

function copyJson() {
  copyText(jsonText.value, 'JSON 已复制')
}

function copyParams() {
  if (!params.value) {
    message.warning('条件未完整，无法导出 Params')
    sqlSearchRef.value?.validate()
    return
  }
  copyText(paramsText.value, 'Params 已复制')
}
</script>

<style scoped>
.sql-search-demo {
  height: 100%;
  background: #f5f7fa;
}

.opt-label {
  font-size: 13px;
  color: var(--n-text-color-2);
}

.output-label {
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--n-text-color-3);
  display: flex;
  align-items: center;
}

.mb-4 {
  margin-bottom: 16px;
}

.ml-2 {
  margin-left: 8px;
}
</style>
