<template>
  <div class="server-monitor">
    <div class="server-monitor__toolbar">
      <n-button type="primary" :loading="loading" @click="loadServer">
        刷新
      </n-button>
    </div>

    <n-spin :show="loading">
      <n-grid cols="1 m:2" responsive="screen" :x-gap="16" :y-gap="16">
        <n-gi>
          <n-card title="CPU" :bordered="false" size="small">
            <n-descriptions :column="1" label-placement="left" size="small">
              <n-descriptions-item label="核心数">
                {{ info?.cpu.cpuNum ?? '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="用户使用率">
                <UsageBar :value="info?.cpu.used" />
              </n-descriptions-item>
              <n-descriptions-item label="系统使用率">
                <UsageBar :value="info?.cpu.sys" />
              </n-descriptions-item>
              <n-descriptions-item label="当前空闲率">
                <UsageBar :value="info?.cpu.free" status="success" />
              </n-descriptions-item>
            </n-descriptions>
          </n-card>
        </n-gi>

        <n-gi>
          <n-card title="内存" :bordered="false" size="small">
            <n-descriptions :column="1" label-placement="left" size="small">
              <n-descriptions-item label="总内存">
                {{ formatGb(info?.mem.total) }}
              </n-descriptions-item>
              <n-descriptions-item label="已用内存">
                {{ formatGb(info?.mem.used) }}
              </n-descriptions-item>
              <n-descriptions-item label="剩余内存">
                {{ formatGb(info?.mem.free) }}
              </n-descriptions-item>
              <n-descriptions-item label="使用率">
                <UsageBar :value="info?.mem.usage" />
              </n-descriptions-item>
            </n-descriptions>
          </n-card>
        </n-gi>

        <n-gi>
          <n-card title="服务器信息" :bordered="false" size="small">
            <n-descriptions :column="1" label-placement="left" size="small">
              <n-descriptions-item label="服务器名称">
                {{ info?.sys.computerName || '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="服务器 IP">
                {{ info?.sys.computerIp || '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="操作系统">
                {{ info?.sys.osName || '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="系统架构">
                {{ info?.sys.osArch || '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="项目路径">
                {{ info?.sys.userDir || '-' }}
              </n-descriptions-item>
            </n-descriptions>
          </n-card>
        </n-gi>

        <n-gi>
          <n-card title="JVM" :bordered="false" size="small">
            <n-descriptions :column="1" label-placement="left" size="small">
              <n-descriptions-item label="名称">
                {{ info?.jvm.name || '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="版本">
                {{ info?.jvm.version || '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="启动时间">
                {{ info?.jvm.startTime || '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="运行时长">
                {{ info?.jvm.runTime || '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="安装路径">
                {{ info?.jvm.home || '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="最大可用">
                {{ formatGb(info?.jvm.max) }}
              </n-descriptions-item>
              <n-descriptions-item label="占用内存">
                {{ formatGb(info?.jvm.total) }}
              </n-descriptions-item>
              <n-descriptions-item label="已用内存">
                {{ formatGb(info?.jvm.used) }}
              </n-descriptions-item>
              <n-descriptions-item label="使用率">
                <UsageBar :value="info?.jvm.usage" />
              </n-descriptions-item>
            </n-descriptions>
          </n-card>
        </n-gi>

        <n-gi :span="2">
          <n-card title="磁盘状态" :bordered="false" size="small">
            <n-data-table
              :columns="diskColumns"
              :data="info?.sysFiles || []"
              :bordered="false"
              size="small"
              :pagination="false"
            />
          </n-card>
        </n-gi>
      </n-grid>
    </n-spin>
  </div>
</template>

<script setup lang="tsx">
import type { DataTableColumns } from 'naive-ui'
import { NProgress } from 'naive-ui'
import { getServer } from '@/api/system/server'
import type { ServerInfo, ServerSysFile } from '@/api/system/types'
import { unwrapData } from '@/utils/fetch'

defineOptions({ name: 'Monitor-Server' })

const loading = ref(false)
const info = ref<ServerInfo | null>(null)

function formatGb(val?: number) {
  if (val == null || Number.isNaN(val))
    return '-'
  return `${val} GB`
}

function usageStatus(value?: number): 'success' | 'warning' | 'error' | 'info' {
  if (value == null)
    return 'info'
  if (value >= 90)
    return 'error'
  if (value >= 70)
    return 'warning'
  return 'success'
}

function UsageBar(props: { value?: number, status?: 'success' | 'warning' | 'error' | 'info' }) {
  const value = props.value ?? 0
  return (
    <div class="server-monitor__usage">
      <span class="server-monitor__usage-text">{value.toFixed(2)}%</span>
      <NProgress
        type="line"
        percentage={Math.min(100, Math.max(0, value))}
        status={props.status || usageStatus(value)}
        show-indicator={false}
        height={8}
      />
    </div>
  )
}

const diskColumns: DataTableColumns<ServerSysFile> = [
  { title: '盘符路径', key: 'dirName', ellipsis: { tooltip: true } },
  { title: '文件系统', key: 'sysTypeName', width: 100 },
  { title: '盘符类型', key: 'typeName', width: 100 },
  { title: '总大小', key: 'total', width: 100 },
  { title: '可用大小', key: 'free', width: 100 },
  { title: '已用大小', key: 'used', width: 100 },
  {
    title: '已用百分比',
    key: 'usage',
    width: 180,
    render: (row) => <UsageBar value={row.usage} />,
  },
]

async function loadServer() {
  loading.value = true
  try {
    const res = await getServer()
    info.value = unwrapData(res)
  }
  finally {
    loading.value = false
  }
}

onMounted(loadServer)
</script>

<style scoped>
.server-monitor {
  overflow: auto;
}

.server-monitor__toolbar {
  margin-bottom: 12px;
}

.server-monitor__usage {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
}

.server-monitor__usage-text {
  font-size: 12px;
  color: var(--n-text-color-3);
}
</style>
