<template>
  <div class="home-index">
    <n-spin :show="loading">
      <n-grid cols="1 s:2 m:4" responsive="screen" :x-gap="16" :y-gap="16" class="home-index__stats">
        <n-gi v-for="item in statCards" :key="item.key">
          <n-card :bordered="false" class="home-index__stat-card">
            <div class="home-index__stat-label">{{ item.label }}</div>
            <div class="home-index__stat-value" :style="{ color: item.color }">
              {{ item.value }}
            </div>
          </n-card>
        </n-gi>
      </n-grid>

      <n-grid cols="1 m:2" responsive="screen" :x-gap="16" :y-gap="16" class="home-index__charts">
        <n-gi>
          <n-card title="近 7 日登录趋势" :bordered="false">
            <EChart :option="loginTrendOption" height="320px" :loading="loading" />
          </n-card>
        </n-gi>
        <n-gi>
          <n-card title="部门用户分布" :bordered="false">
            <EChart :option="deptPieOption" height="320px" :loading="loading" />
          </n-card>
        </n-gi>
        <n-gi :span="2">
          <n-card title="操作日志模块统计" :bordered="false">
            <EChart :option="operlogBarOption" height="320px" :loading="loading" />
          </n-card>
        </n-gi>
      </n-grid>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getDashboardStats, type DashboardStats } from '@/api/system/dashboard'
import { EChart } from '@/components/common/charts'
import type { ECOption } from '@/hooks/charts/echarts'
import { unwrapData } from '@/utils/fetch'

const loading = ref(false)
const stats = ref<DashboardStats>({
  userTotal: 0,
  onlineTotal: 0,
  noticeTotal: 0,
  operlogToday: 0,
  loginTrend: [],
  userByDept: [],
  operlogByModule: [],
})

const statCards = computed(() => [
  { key: 'user', label: '用户总数', value: stats.value.userTotal, color: '#2080f0' },
  { key: 'online', label: '在线用户', value: stats.value.onlineTotal, color: '#18a058' },
  { key: 'notice', label: '通知公告', value: stats.value.noticeTotal, color: '#f0a020' },
  { key: 'operlog', label: '今日操作', value: stats.value.operlogToday, color: '#d03050' },
])

const loginTrendOption = computed<ECOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 20, top: 30, bottom: 30 },
  xAxis: {
    type: 'category',
    data: stats.value.loginTrend.map(i => i.date),
    boundaryGap: false,
  },
  yAxis: { type: 'value', minInterval: 1 },
  series: [{
    name: '登录次数',
    type: 'line',
    smooth: true,
    areaStyle: { opacity: 0.15 },
    data: stats.value.loginTrend.map(i => i.count),
  }],
}))

const deptPieOption = computed<ECOption>(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, type: 'scroll' },
  series: [{
    type: 'pie',
    radius: ['42%', '68%'],
    center: ['50%', '45%'],
    data: stats.value.userByDept,
    label: { formatter: '{b}: {c}' },
  }],
}))

const operlogBarOption = computed<ECOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 20, top: 30, bottom: 30 },
  xAxis: {
    type: 'category',
    data: stats.value.operlogByModule.map(i => i.name),
    axisLabel: { interval: 0, rotate: stats.value.operlogByModule.length > 6 ? 20 : 0 },
  },
  yAxis: { type: 'value', minInterval: 1 },
  series: [{
    name: '操作次数',
    type: 'bar',
    barMaxWidth: 48,
    data: stats.value.operlogByModule.map(i => i.value),
  }],
}))

async function loadStats() {
  loading.value = true
  try {
    const res = await getDashboardStats()
    stats.value = unwrapData(res)
  }
  catch {
    // 保持空态，图表组件会展示「暂无数据」
  }
  finally {
    loading.value = false
  }
}

onMounted(loadStats)
</script>

<style scoped>
.home-index {
  overflow: auto;
}

.home-index__stats {
  margin-bottom: 16px;
}

.home-index__stat-card {
  min-height: 96px;
}

.home-index__stat-label {
  font-size: 13px;
  color: var(--n-text-color-3);
  margin-bottom: 8px;
}

.home-index__stat-value {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
}

.home-index__charts :deep(.n-card-header) {
  padding-bottom: 8px;
}
</style>
