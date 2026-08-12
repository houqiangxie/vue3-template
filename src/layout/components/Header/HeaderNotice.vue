<script setup lang="ts">
import { BellOutlined } from '@vicons/antd'
import { NBadge, NEmpty, NIcon, NList, NListItem, NPopover, NSpin, NTag, NThing } from 'naive-ui'
import { listNotice } from '@/api/system/notice'
import type { SysNotice } from '@/api/system/types'

const router = useRouter()
const loading = ref(false)
const notices = ref<SysNotice[]>([])
const unread = computed(() => notices.value.length)

async function loadNotices() {
  loading.value = true
  try {
    const { data } = await listNotice({ pageNum: 1, pageSize: 8, status: '1' })
    notices.value = data?.rows ?? []
  }
  catch {
    notices.value = []
  }
  finally {
    loading.value = false
  }
}

function onShow(show: boolean) {
  if (show)
    loadNotices()
}

function goNoticePage() {
  router.push({ name: 'System-Notice' }).catch(() => {
    router.push('/system/notice').catch(() => {})
  })
}

function typeLabel(type: SysNotice['noticeType']) {
  return type === '2' ? '公告' : '通知'
}
</script>

<template>
  <div class="header-notice-wrap">
    <NPopover
      trigger="click"
      placement="bottom-end"
      :width="360"
      @update:show="onShow"
    >
      <template #trigger>
        <div class="header-notice__trigger">
          <n-tooltip placement="bottom">
            <template #trigger>
              <NBadge :value="unread" :max="99" :show="unread > 0">
                <NIcon size="18"><BellOutlined /></NIcon>
              </NBadge>
            </template>
            <span>通知公告</span>
          </n-tooltip>
        </div>
      </template>

      <div class="header-notice">
        <div class="header-notice__title">通知公告</div>
        <NSpin :show="loading">
          <NList v-if="notices.length" hoverable clickable>
            <NListItem v-for="item in notices" :key="item.noticeId" @click="goNoticePage">
              <NThing :title="item.noticeTitle" :description="item.createTime">
                <template #header-extra>
                  <NTag size="small" :type="item.noticeType === '2' ? 'warning' : 'info'" :bordered="false">
                    {{ typeLabel(item.noticeType) }}
                  </NTag>
                </template>
              </NThing>
            </NListItem>
          </NList>
          <NEmpty v-else description="暂无通知" size="small" style="padding: 24px 0" />
        </NSpin>
        <div class="header-notice__footer" @click="goNoticePage">
          查看更多
        </div>
      </div>
    </NPopover>
  </div>
</template>

<style scoped>
.header-notice-wrap {
  display: inline-flex;
  align-items: stretch;
  align-self: stretch;
  height: 100%;
}

.header-notice__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 12px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.header-notice__trigger:hover {
  background: #f8f8f9;
}

.header-notice__title {
  padding: 4px 4px 10px;
  font-size: 14px;
  font-weight: 600;
}

.header-notice__footer {
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
  font-size: 13px;
  color: #18a058;
  cursor: pointer;
}
</style>
