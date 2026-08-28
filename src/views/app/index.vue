<template>
  <div class="home-index">
    <n-spin :show="loading">
      <n-card :bordered="false" class="home-index__welcome">
        <h1 class="home-index__title">{{ websiteConfig.title }}</h1>
        <p class="home-index__desc">{{ websiteConfig.loginDesc }}</p>
      </n-card>

      <n-grid cols="2" :x-gap="12" :y-gap="12" class="home-index__stats">
        <n-gi v-for="item in statCards" :key="item.key">
          <n-card :bordered="false" size="small">
            <div class="home-index__stat-label">{{ item.label }}</div>
            <div class="home-index__stat-value">{{ item.value }}</div>
          </n-card>
        </n-gi>
      </n-grid>

      <n-card title="近 7 日登录趋势" :bordered="false" class="home-index__chart">
        <EChart :option="loginTrendOption" height="260px" :loading="loading" />
      </n-card>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getDashboardStats, type DashboardStats } from '@/api/system/dashboard'
import { EChart } from '@/components/common/charts'
import { websiteConfig } from '@/config/website.config'
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
  { key: 'user', label: '用户', value: stats.value.userTotal },
  { key: 'online', label: '在线', value: stats.value.onlineTotal },
  { key: 'notice', label: '通知', value: stats.value.noticeTotal },
  { key: 'operlog', label: '今日操作', value: stats.value.operlogToday },
])

const loginTrendOption = computed<ECOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 36, right: 12, top: 24, bottom: 24 },
  xAxis: {
    type: 'category',
    data: stats.value.loginTrend.map(i => i.date),
    boundaryGap: false,
  },
  yAxis: { type: 'value', minInterval: 1 },
  series: [{
    type: 'line',
    smooth: true,
    data: stats.value.loginTrend.map(i => i.count),
  }],
}))

async function loadStats() {
  loading.value = true
  try {
    const res = await getDashboardStats()
    stats.value = unwrapData(res)
  }
  catch {
    // ignore
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

.home-index__welcome {
  margin-bottom: 12px;
}

.home-index__title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 600;
}

.home-index__desc {
  margin: 0;
  color: var(--n-text-color-3);
  font-size: 13px;
}

.home-index__stats {
  margin-bottom: 12px;
}

.home-index__stat-label {
  font-size: 12px;
  color: var(--n-text-color-3);
}

.home-index__stat-value {
  margin-top: 4px;
  font-size: 22px;
  font-weight: 600;
}

.home-index__chart {
  margin-bottom: 12px;
}
</style>
