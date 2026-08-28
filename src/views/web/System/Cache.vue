<template>
  <div class="cache-monitor">
    <n-tabs type="line" animated>
      <n-tab-pane name="info" tab="缓存监控">
        <div class="cache-monitor__toolbar">
          <n-button type="primary" :loading="infoLoading" @click="loadCacheInfo">
            刷新
          </n-button>
        </div>
        <n-spin :show="infoLoading">
          <n-grid cols="1 m:2" responsive="screen" :x-gap="16" :y-gap="16">
            <n-gi>
              <n-card title="基本信息" :bordered="false" size="small">
                <n-descriptions :column="1" label-placement="left" size="small">
                  <n-descriptions-item
                    v-for="item in infoItems"
                    :key="item.key"
                    :label="item.label"
                  >
                    {{ item.value }}
                  </n-descriptions-item>
                </n-descriptions>
              </n-card>
            </n-gi>
            <n-gi>
              <n-card title="命令统计" :bordered="false" size="small">
                <EChart :option="commandChartOption" height="320px" :loading="infoLoading" />
              </n-card>
            </n-gi>
          </n-grid>
        </n-spin>
      </n-tab-pane>

      <n-tab-pane name="list" tab="缓存列表">
        <div class="cache-monitor__toolbar">
          <n-button
            v-if="hasPermission('monitor:cache:remove')"
            type="error"
            @click="handleClearAll"
          >
            清理全部
          </n-button>
          <n-button @click="reloadNames">
            刷新
          </n-button>
        </div>

        <n-grid cols="1 m:3" responsive="screen" :x-gap="12" :y-gap="12">
          <n-gi>
            <n-card title="缓存名称" size="small" :bordered="false">
              <n-spin :show="namesLoading">
                <n-list hoverable clickable>
                  <n-list-item
                    v-for="item in cacheNames"
                    :key="item.cacheName"
                    class="cache-monitor__list-item"
                    :class="{ 'is-active': selectedName === item.cacheName }"
                    @click="selectName(item.cacheName)"
                  >
                    <div class="cache-monitor__list-row">
                      <div>
                        <div class="cache-monitor__list-title">{{ item.cacheName }}</div>
                        <div class="cache-monitor__list-desc">{{ item.remark || '-' }}</div>
                      </div>
                      <n-button
                        v-if="hasPermission('monitor:cache:remove')"
                        text
                        type="error"
                        size="tiny"
                        @click.stop="handleClearName(item.cacheName)"
                      >
                        清理
                      </n-button>
                    </div>
                  </n-list-item>
                </n-list>
              </n-spin>
            </n-card>
          </n-gi>

          <n-gi>
            <n-card title="键名列表" size="small" :bordered="false">
              <n-spin :show="keysLoading">
                <n-empty v-if="!cacheKeys.length" description="请选择缓存名称" size="small" />
                <n-list v-else hoverable clickable>
                  <n-list-item
                    v-for="key in cacheKeys"
                    :key="key"
                    class="cache-monitor__list-item"
                    :class="{ 'is-active': selectedKey === key }"
                    @click="selectKey(key)"
                  >
                    <div class="cache-monitor__list-row">
                      <n-ellipsis style="max-width: 180px">{{ key }}</n-ellipsis>
                      <n-button
                        v-if="hasPermission('monitor:cache:remove')"
                        text
                        type="error"
                        size="tiny"
                        @click.stop="handleClearKey(key)"
                      >
                        删除
                      </n-button>
                    </div>
                  </n-list-item>
                </n-list>
              </n-spin>
            </n-card>
          </n-gi>

          <n-gi>
            <n-card title="缓存内容" size="small" :bordered="false">
              <n-spin :show="valueLoading">
                <n-empty v-if="!cacheValue" description="请选择键名" size="small" />
                <n-descriptions v-else :column="1" label-placement="left" size="small">
                  <n-descriptions-item label="缓存名称">
                    {{ cacheValue.cacheName }}
                  </n-descriptions-item>
                  <n-descriptions-item label="缓存键名">
                    {{ cacheValue.cacheKey }}
                  </n-descriptions-item>
                  <n-descriptions-item label="缓存内容">
                    <pre class="cache-monitor__value">{{ cacheValue.cacheValue }}</pre>
                  </n-descriptions-item>
                </n-descriptions>
              </n-spin>
            </n-card>
          </n-gi>
        </n-grid>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import {
  clearCacheAll,
  clearCacheKey,
  clearCacheName,
  getCache,
  getCacheValue,
  listCacheKey,
  listCacheName,
} from '@/api/system/cache'
import type { CacheInfo, CacheKV, CacheName } from '@/api/system/types'
import { EChart } from '@/components/common/charts'
import type { ECOption } from '@/hooks/charts/echarts'
import { usePermission } from '@/hooks/usePermission'
import { unwrapData } from '@/utils/fetch'

defineOptions({ name: 'Monitor-Cache' })

const { hasPermission } = usePermission()
const { confirmDanger } = useConfirm()

const infoLoading = ref(false)
const namesLoading = ref(false)
const keysLoading = ref(false)
const valueLoading = ref(false)

const cacheInfo = ref<CacheInfo | null>(null)
const cacheNames = ref<CacheName[]>([])
const cacheKeys = ref<string[]>([])
const cacheValue = ref<CacheKV | null>(null)
const selectedName = ref('')
const selectedKey = ref('')

const INFO_LABELS: Record<string, string> = {
  redis_version: 'Redis 版本',
  redis_mode: '运行模式',
  tcp_port: '端口',
  connected_clients: '客户端数',
  uptime_in_days: '运行天数',
  used_memory_human: '使用内存',
  used_memory_peak_human: '峰值内存',
  maxmemory_human: '内存配置',
  aof_enabled: 'AOF 是否开启',
  rdb_last_bgsave_status: 'RDB 状态',
  instantaneous_ops_per_sec: '每秒执行数',
  keyspace_hits: '命中次数',
  keyspace_misses: '未命中次数',
}

const infoItems = computed(() => {
  const info = cacheInfo.value?.info || {}
  const items = Object.entries(INFO_LABELS).map(([key, label]) => ({
    key,
    label,
    value: info[key] ?? '-',
  }))
  items.push({
    key: 'dbSize',
    label: 'Key 数量',
    value: String(cacheInfo.value?.dbSize ?? '-'),
  })
  return items
})

const commandChartOption = computed<ECOption>(() => {
  const stats = cacheInfo.value?.commandStats || []
  return {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, type: 'scroll' },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      data: stats.map(s => ({ name: s.name, value: Number(s.value) || 0 })),
      label: { formatter: '{b}: {c}' },
    }],
  }
})

async function loadCacheInfo() {
  infoLoading.value = true
  try {
    const res = await getCache()
    cacheInfo.value = unwrapData(res)
  }
  finally {
    infoLoading.value = false
  }
}

async function reloadNames() {
  namesLoading.value = true
  try {
    const res = await listCacheName()
    cacheNames.value = unwrapData(res) || []
  }
  finally {
    namesLoading.value = false
  }
}

async function selectName(name: string) {
  selectedName.value = name
  selectedKey.value = ''
  cacheValue.value = null
  keysLoading.value = true
  try {
    const res = await listCacheKey(name)
    cacheKeys.value = unwrapData(res) || []
  }
  finally {
    keysLoading.value = false
  }
}

async function selectKey(key: string) {
  if (!selectedName.value)
    return
  selectedKey.value = key
  valueLoading.value = true
  try {
    const res = await getCacheValue(selectedName.value, key)
    cacheValue.value = unwrapData(res)
  }
  finally {
    valueLoading.value = false
  }
}

function handleClearName(name: string) {
  confirmDanger({
    title: '确认清理',
    content: `是否清理缓存名称「${name}」下的全部键？`,
    successMessage: '清理成功',
    action: async () => {
      await clearCacheName(name)
      if (selectedName.value === name) {
        cacheKeys.value = []
        cacheValue.value = null
        selectedKey.value = ''
      }
      await loadCacheInfo()
    },
  })
}

function handleClearKey(key: string) {
  confirmDanger({
    title: '确认删除',
    content: `是否删除缓存键「${key}」？`,
    successMessage: '删除成功',
    action: async () => {
      await clearCacheKey(key)
      cacheKeys.value = cacheKeys.value.filter(k => k !== key)
      if (selectedKey.value === key) {
        selectedKey.value = ''
        cacheValue.value = null
      }
      await loadCacheInfo()
    },
  })
}

function handleClearAll() {
  confirmDanger({
    title: '确认清理',
    content: '是否清理全部缓存？此操作不可恢复。',
    successMessage: '清理成功',
    action: async () => {
      await clearCacheAll()
      cacheKeys.value = []
      cacheValue.value = null
      selectedKey.value = ''
      await loadCacheInfo()
    },
  })
}

onMounted(() => {
  loadCacheInfo()
  reloadNames()
})
</script>

<style scoped>
.cache-monitor {
  overflow: auto;
}

.cache-monitor__toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.cache-monitor__list-item.is-active {
  background: var(--n-color-target);
}

.cache-monitor__list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.cache-monitor__list-title {
  font-weight: 500;
}

.cache-monitor__list-desc {
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-top: 2px;
}

.cache-monitor__value {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
  max-height: 320px;
  overflow: auto;
}
</style>
