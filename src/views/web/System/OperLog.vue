<template>
  <div class="system-page">
    <SearchPanel
      v-model:search-model="searchModel"
      :fields="logFields"
      @search="handleSearch"
    >
      <template #default>
        <n-button
          v-if="hasPermission('monitor:operlog:remove')"
          :disabled="!checkedIds.length"
          @click="handleDelete"
        >
          删除
        </n-button>
        <n-button v-if="hasPermission('monitor:operlog:remove')" type="error" @click="handleClean">
          清空
        </n-button>
      </template>
    </SearchPanel>

    <CommonTable
      class="system-page__table"
      flex-height
      selectable
      col-setting-key="system-operlog"
      v-model:checked-row-keys="checkedIds"
      :data="tableData"
      :fields="tableFields"
      :page="searchModel.pageNum as number"
      :page-size="searchModel.pageSize as number"
      :item-count="total"
      :row-key="(row: Record<string, unknown>) => row.operId as number"
      :table-props="{ loading }"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
    />

    <CommonModal
      v-model:show="detailVisible"
      title="操作日志详细"
      :width="780"
      :show-footer="false"
    >
      <div v-if="detail" class="operlog-detail">
        <section class="operlog-detail__card">
          <div class="operlog-detail__card-title">基本信息</div>
          <div class="operlog-detail__grid">
            <div class="operlog-detail__item">
              <span class="operlog-detail__label">操作模块</span>
              <span class="operlog-detail__value">{{ detail.title || '-' }}</span>
            </div>
            <div class="operlog-detail__item">
              <span class="operlog-detail__label">业务类型</span>
              <span class="operlog-detail__value">{{ businessLabel(detail.businessType) }}</span>
            </div>
            <div class="operlog-detail__item">
              <span class="operlog-detail__label">操作时间</span>
              <span class="operlog-detail__value">{{ detail.operTime || '-' }}</span>
            </div>
            <div class="operlog-detail__item">
              <span class="operlog-detail__label">执行状态</span>
              <span class="operlog-detail__value">
                <n-tag :type="detail.status === '1' ? 'success' : 'error'" size="small">
                  {{ detail.status === '1' ? '正常' : '异常' }}
                </n-tag>
              </span>
            </div>
          </div>
        </section>

        <section class="operlog-detail__card">
          <div class="operlog-detail__card-title">操作人员</div>
          <div class="operlog-detail__grid">
            <div class="operlog-detail__item">
              <span class="operlog-detail__label">操作人员</span>
              <span class="operlog-detail__value">{{ detail.operName || '-' }}</span>
            </div>
            <div v-if="detail.deptName" class="operlog-detail__item">
              <span class="operlog-detail__label">所属部门</span>
              <span class="operlog-detail__value">{{ detail.deptName }}</span>
            </div>
            <div class="operlog-detail__item operlog-detail__item--full">
              <span class="operlog-detail__label">操作地址</span>
              <span class="operlog-detail__value">
                {{ detail.operIp || '-' }}
                <span v-if="detail.operLocation" class="operlog-detail__location">{{ detail.operLocation }}</span>
              </span>
            </div>
          </div>
        </section>

        <section class="operlog-detail__card">
          <div class="operlog-detail__card-title">请求信息</div>
          <div class="operlog-detail__rows">
            <div class="operlog-detail__item operlog-detail__item--full">
              <span class="operlog-detail__label">请求地址</span>
              <span class="operlog-detail__value">
                <span
                  v-if="detail.requestMethod"
                  class="operlog-detail__method"
                  :class="`operlog-detail__method--${detail.requestMethod}`"
                >
                  {{ detail.requestMethod }}
                </span>
                {{ detail.operUrl || '-' }}
              </span>
            </div>
            <div class="operlog-detail__item operlog-detail__item--full">
              <span class="operlog-detail__label">操作方法</span>
              <span class="operlog-detail__value operlog-detail__mono">{{ detail.method || '-' }}</span>
            </div>
            <div class="operlog-detail__item">
              <span class="operlog-detail__label">消耗时间</span>
              <span class="operlog-detail__value">{{ detail.costTime ?? '-' }} 毫秒</span>
            </div>
          </div>
        </section>

        <section class="operlog-detail__card">
          <div class="operlog-detail__card-title">请求参数</div>
          <div class="operlog-detail__code-body">
            <div class="operlog-detail__code-wrap">
              <n-button
                class="operlog-detail__copy"
                size="tiny"
                quaternary
                @click="copyText(detail.operParam)"
              >
                复制
              </n-button>
              <pre class="operlog-detail__pre">{{ formatJson(detail.operParam) }}</pre>
            </div>
          </div>
        </section>

        <section class="operlog-detail__card">
          <div class="operlog-detail__card-title">返回参数</div>
          <div class="operlog-detail__code-body">
            <div class="operlog-detail__code-wrap">
              <n-button
                class="operlog-detail__copy"
                size="tiny"
                quaternary
                @click="copyText(detail.jsonResult)"
              >
                复制
              </n-button>
              <pre class="operlog-detail__pre">{{ formatJson(detail.jsonResult) }}</pre>
            </div>
          </div>
        </section>

        <section v-if="detail.status !== '1' && detail.errorMsg" class="operlog-detail__card">
          <div class="operlog-detail__card-title operlog-detail__card-title--error">异常信息</div>
          <div class="operlog-detail__error">{{ detail.errorMsg }}</div>
        </section>
      </div>
    </CommonModal>
  </div>
</template>

<script setup lang="tsx">
import { cleanOperLog, deleteOperLog, listOperLog } from '@/api/system/operlog'
import type { SysOperLog } from '@/api/system/types'
import { businessTypeOptions, operStatusOptions } from './constants'
import { usePermission } from '@/hooks/usePermission'
import { splitDateRange } from '@/hooks/usePageList'
import { useMessage } from 'naive-ui'

const { hasPermission } = usePermission()
const { confirmDanger, confirmBatchDelete } = useConfirm()
const message = useMessage()
const checkedIds = ref<Array<string | number>>([])

const logFields = defineFields([
  {
    key: 'title',
    label: '系统模块',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: { width: 120 },
  },
  {
    key: 'businessType',
    label: '操作类型',
    component: 'NSelect',
    options: businessTypeOptions,
    search: { enabled: true, defaultValue: null },
    form: false,
    table: {
      width: 100,
      format: 'option',
    },
  },
  {
    key: 'operName',
    label: '操作人员',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: { width: 100 },
  },
  {
    key: 'operIp',
    label: '操作地址',
    component: 'NInput',
    search: { enabled: true },
    form: false,
    table: { width: 130 },
  },
  {
    key: 'status',
    label: '状态',
    component: 'NSelect',
    options: operStatusOptions,
    search: { enabled: true, defaultValue: null },
    form: false,
    table: {
      width: 80,
      format: 'option',
      tagType: val => (val === '1' ? 'success' : 'error'),
    },
  },
  {
    key: 'dateRange',
    label: '操作时间',
    component: 'NDatePicker',
    bind: {
      type: 'datetimerange',
      clearable: true,
      valueFormat: 'yyyy-MM-dd HH:mm:ss',
    },
    search: { enabled: true, span: 8, defaultValue: null },
    form: false,
    table: false,
  },
  {
    key: 'operTime',
    label: '操作时间',
    component: 'NInput',
    search: false,
    form: false,
    table: { width: 170 },
  },
  {
    key: 'costTime',
    label: '耗时(ms)',
    component: 'NInput',
    search: false,
    form: false,
    table: { width: 90, align: 'center' },
  },
])

const detailVisible = ref(false)
const detail = ref<SysOperLog | null>(null)

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
  fetcher: async query => toPageResult(await listOperLog(query)),
  defaults: extractSearchDefaults(logFields),
  buildQuery: splitDateRange,
})

const tableFields = computed(() => [
  ...logFields.filter(f => f.key !== 'dateRange'),
  {
    key: 'actions',
    label: '操作',
    form: false,
    search: false,
    table: {
      width: 80,
      fixed: 'right' as const,
      actions: () => [
        {
          key: 'detail',
          label: '详细',
          type: 'primary',
          onClick: (r) => openDetail(r as unknown as SysOperLog),
        },
      ],
    },
  },
])

function businessLabel(type?: number) {
  return businessTypeOptions.find(o => o.value === type)?.label || '-'
}

function formatJson(str?: string) {
  if (!str)
    return '（无数据）'
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  }
  catch {
    return str
  }
}

async function copyText(str?: string) {
  const text = formatJson(str)
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    }
    else {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    message.success('已复制')
  }
  catch {
    message.error('复制失败')
  }
}

function openDetail(row: SysOperLog) {
  detail.value = row
  detailVisible.value = true
}

function handleDelete() {
  confirmBatchDelete({
    count: checkedIds.value.length,
    label: '日志',
    action: () => deleteOperLog(checkedIds.value as number[]),
    onDone: fetchList,
  })
}

function handleClean() {
  confirmDanger({
    title: '确认清空',
    content: '是否确认清空所有操作日志？',
    successMessage: '清空成功',
    action: async () => {
      await cleanOperLog()
      await fetchList()
    },
  })
}
</script>

<style scoped>
.operlog-detail {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0 4px;
}

.operlog-detail__card {
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  margin-bottom: 14px;
  overflow: hidden;
}

.operlog-detail__card-title {
  background: var(--n-action-color);
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--n-border-color);
}

.operlog-detail__card-title--error {
  color: var(--n-error-color);
}

.operlog-detail__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.operlog-detail__rows {
  display: flex;
  flex-direction: column;
}

.operlog-detail__item {
  display: flex;
  align-items: flex-start;
  padding: 10px 16px;
  font-size: 13px;
  border-bottom: 1px solid var(--n-divider-color);
}

.operlog-detail__item:last-child {
  border-bottom: none;
}

.operlog-detail__item--full {
  grid-column: 1 / -1;
}

.operlog-detail__label {
  flex-shrink: 0;
  width: 72px;
  color: var(--n-text-color-3);
  margin-right: 12px;
}

.operlog-detail__value {
  flex: 1;
  word-break: break-all;
  color: var(--n-text-color);
}

.operlog-detail__location {
  margin-left: 8px;
  color: var(--n-text-color-3);
  font-size: 12px;
}

.operlog-detail__mono {
  font-family: Consolas, 'SFMono-Regular', monospace;
  font-size: 12px;
}

.operlog-detail__method {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 700;
  margin-right: 6px;
  vertical-align: middle;
  background: var(--n-action-color);
}

.operlog-detail__method--GET {
  background: #e8f5e9;
  color: #27ae60;
}

.operlog-detail__method--POST {
  background: #e3f2fd;
  color: #1565c0;
}

.operlog-detail__method--PUT {
  background: #fff3e0;
  color: #e65100;
}

.operlog-detail__method--DELETE {
  background: #fce4ec;
  color: #c62828;
}

.operlog-detail__code-body {
  padding: 14px;
}

.operlog-detail__code-wrap {
  position: relative;
  background: var(--n-action-color);
  border: 1px solid var(--n-border-color);
  border-radius: 4px;
  overflow: hidden;
  max-height: 260px;
}

.operlog-detail__copy {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  background: rgba(255, 255, 255, 0.9) !important;
}

.operlog-detail__pre {
  margin: 0;
  padding: 12px 14px;
  font-size: 12px;
  line-height: 1.6;
  font-family: Consolas, 'SFMono-Regular', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  overflow: auto;
  max-height: 240px;
}

.operlog-detail__error {
  padding: 12px 16px;
  font-size: 13px;
  color: var(--n-error-color);
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
