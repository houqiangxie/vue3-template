<template>
  <n-modal
    v-model:show="visible"
    preset="card"
    title="历史版本"
    :bordered="false"
    style="width: 920px; max-width: 96vw"
  >
    <n-data-table
      :columns="columns"
      :data="list"
      :loading="loading"
      :bordered="false"
      size="small"
      :scroll-x="880"
      :row-key="(row: any) => row.id"
    />
  </n-modal>

  <BpmFormPreviewDialog ref="previewRef" />
</template>

<script setup lang="tsx">
import type { DataTableColumns } from 'naive-ui'
import { NButton, NSpace, NTag, useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import * as DefinitionApi from '@/api/bpm/definition'
import { BpmModelFormType } from '@/utils/constants'
import { resolveBpmRouteName } from '@/views/web/Bpm/routeNames'
import { renderModelVisibleScope } from '@/views/web/Bpm/utils/listRender'
import BpmFormPreviewDialog from '@/views/web/Bpm/components/BpmFormPreviewDialog.vue'

defineOptions({ name: 'BpmDefinitionHistory' })

const emit = defineEmits<{ restored: [] }>()

const router = useRouter()
const message = useMessage()

const visible = ref(false)
const loading = ref(false)
const list = ref<any[]>([])
const modelKey = ref('')
const previewRef = ref<InstanceType<typeof BpmFormPreviewDialog>>()

function openFormPreview(row: any) {
  if (row.formType === BpmModelFormType.CUSTOM && row.formCustomCreatePath) {
    const path = String(row.formCustomCreatePath).startsWith('/')
      ? row.formCustomCreatePath
      : `/${row.formCustomCreatePath}`
    router.push(path).catch(() => message.warning('无法打开自定义表单路径'))
    return
  }
  if (row.formConf || (row.formFields || []).length) {
    previewRef.value?.openWithConf(
      row.formConf,
      row.formFields,
      '表单详情',
      row.formName,
    )
    return
  }
  if (row.formId) {
    previewRef.value?.openByFormId(row.formId, '表单详情')
    return
  }
  message.warning('暂无表单')
}

const columns: DataTableColumns<any> = [
  { title: '版本', key: 'version', width: 70 },
  {
    title: '流程图标',
    key: 'icon',
    width: 72,
    render: (row) => {
      if (row.icon) {
        return (
          <img
            src={row.icon}
            alt=""
            style="width:24px;height:24px;border-radius:4px;object-fit:cover;"
          />
        )
      }
      return '-'
    },
  },
  {
    title: '可见范围',
    key: 'startUsers',
    minWidth: 120,
    ellipsis: { tooltip: true },
    render: (row) => renderModelVisibleScope(row),
  },
  {
    title: '表单信息',
    key: 'formName',
    minWidth: 140,
    ellipsis: { tooltip: true },
    render: (row) => {
      if (row.formType === BpmModelFormType.NORMAL && (row.formName || row.formId || row.formConf)) {
        return (
          <NButton text type="primary" onClick={() => openFormPreview(row)}>
            {row.formName || `表单 #${row.formId || ''}`}
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
    title: '状态',
    key: 'suspensionState',
    width: 90,
    render: (row) => (
      <NTag
        size="small"
        type={row.suspensionState === 1 ? 'success' : 'warning'}
        bordered={false}
      >
        {row.suspensionState === 1 ? '激活' : '挂起'}
      </NTag>
    ),
  },
  {
    title: '部署时间',
    key: 'deploymentTime',
    minWidth: 160,
    render: (row) => row.deploymentTime || row.deploymentTIme || '-',
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    fixed: 'right' as const,
    render: (row) => (
      <NSpace>
        <NButton text type="primary" onClick={() => handleRestore(row)}>
          恢复
        </NButton>
      </NSpace>
    ),
  },
]

async function open(key: string) {
  modelKey.value = key
  visible.value = true
  loading.value = true
  try {
    const data = await DefinitionApi.getProcessDefinitionList({ key })
    list.value = Array.isArray(data) ? data : []
  }
  catch (e: any) {
    message.error(e?.message || '加载历史版本失败')
    list.value = []
  }
  finally {
    loading.value = false
  }
}

function handleRestore(row: any) {
  visible.value = false
  router.push({
    name: resolveBpmRouteName(router, 'Bpm-ModelEditor', 'BpmModelEditor'),
    params: { type: 'definition', id: String(row.id) },
  })
  emit('restored')
}

defineExpose({ open })
</script>
