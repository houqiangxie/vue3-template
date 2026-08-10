<template>
  <div class="system-page person-info">
    <n-card title="个人信息" :bordered="false" class="person-info__card">
      <n-spin :show="loading">
        <n-alert v-if="error" type="error" :title="error" class="person-info__alert" />
        <n-descriptions v-else bordered :column="1" label-placement="left" size="medium">
          <n-descriptions-item label="用户编号">
            {{ user?.userId ?? '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="登录账号">
            {{ user?.userName ?? '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="用户昵称">
            {{ user?.nickName ?? '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="角色">
            {{ rolesText }}
          </n-descriptions-item>
        </n-descriptions>
      </n-spin>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { getInfo, type UserInfo } from '@/api/system/auth'

const loading = ref(false)
const error = ref('')
const user = ref<UserInfo | null>(null)
const roles = ref<string[]>([])

const rolesText = computed(() => {
  if (!roles.value.length)
    return '-'
  return roles.value.join('、')
})

async function loadProfile() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await getInfo()
    user.value = data?.user ?? null
    roles.value = data?.roles ?? []
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : '加载用户信息失败'
    user.value = null
    roles.value = []
  }
  finally {
    loading.value = false
  }
}

onMounted(loadProfile)
</script>

<style scoped>
.person-info {
  padding: 16px;
  overflow: auto;
  background: #f5f7fa;
}

.person-info__card {
  max-width: 560px;
}

.person-info__alert {
  margin-bottom: 12px;
}
</style>
