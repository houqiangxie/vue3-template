<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NResult } from 'naive-ui'
import { useT } from '@/hooks/useT'
import { websiteConfig } from '@/config/website.config'

const props = withDefaults(defineProps<{
  status: '403' | '404' | '500'
  title?: string
  description?: string
}>(), {})

const router = useRouter()
const permissionStore = usePermissionStore()
const { t } = useT()

const preset = computed(() => {
  switch (props.status) {
    case '403':
      return {
        status: '403' as const,
        title: props.title || t('error.forbiddenTitle', '403 禁止访问'),
        description: props.description || t('error.forbiddenDesc', '抱歉，您没有权限访问此页面。'),
      }
    case '500':
      return {
        status: '500' as const,
        title: props.title || t('error.serverErrorTitle', '500 服务器错误'),
        description: props.description || t('error.serverErrorDesc', '服务器开小差了，请稍后再试或联系管理员。'),
      }
    default:
      return {
        status: '404' as const,
        title: props.title || t('error.notFoundTitle', '404 页面不存在'),
        description: props.description || t('error.notFoundDesc', '抱歉，您访问的页面不存在或已被移除。'),
      }
  }
})

function goHome() {
  const homeName = permissionStore.defaultRouteName
  if (homeName)
    router.push({ name: homeName }).catch(() => router.push('/'))
  else
    router.push('/')
}

function goBack() {
  if (window.history.length > 1)
    router.back()
  else
    goHome()
}
</script>

<template>
  <div class="error-page">
    <div class="error-page__panel">
      <img :src="websiteConfig.logo" alt="" class="error-page__logo" />
      <NResult
        :status="preset.status"
        :title="preset.title"
        :description="preset.description"
      >
        <template #footer>
          <div class="error-page__actions">
            <NButton type="primary" @click="goHome">
              {{ t('error.backHome', '返回首页') }}
            </NButton>
            <NButton @click="goBack">
              {{ t('error.backPrev', '返回上一页') }}
            </NButton>
          </div>
        </template>
      </NResult>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: var(--app-vh, 100vh);
  min-height: var(--app-dvh, 100dvh);
  padding: 24px;
  background: linear-gradient(160deg, #f0f5ff 0%, #f5f7f9 45%, #eef2f7 100%);
}

:global(html.dark) .error-page {
  background: linear-gradient(160deg, #101014 0%, #18181c 100%);
}

.error-page__panel {
  width: min(520px, 100%);
  padding: 32px 24px 24px;
  border-radius: 12px;
  background: var(--n-color);
  box-shadow: 0 8px 32px rgb(15 23 42 / 8%);
  text-align: center;
}

.error-page__logo {
  width: 48px;
  height: 48px;
  margin-bottom: 8px;
  object-fit: contain;
}

.error-page__actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
