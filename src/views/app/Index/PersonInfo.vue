<template>
  <div class="page">
    <h2 class="title">个人信息</h2>
    <p v-if="loading" class="hint">加载中...</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <ul v-else class="list">
      <li class="item">
        <div class="name">{{ user?.nickName || user?.userName || '-' }}</div>
        <div class="meta">账号：{{ user?.userName || '-' }}</div>
        <div class="meta">编号：{{ user?.userId ?? '-' }}</div>
        <div class="meta">角色：{{ rolesText }}</div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
/**
 * App 端个人信息：只读展示，复用 getInfo；完整资料编辑请使用 Web 端。
 */
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

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await getInfo()
    user.value = data?.user ?? null
    roles.value = data?.roles ?? []
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  }
  finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page {
  padding: 16px;
}

.title {
  margin: 0 0 16px;
  font-size: 18px;
}

.hint,
.meta {
  color: #999;
}

.error {
  color: #e34d59;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.item {
  padding: 12px 0;
}

.name {
  font-size: 15px;
  color: #333;
}

.meta {
  margin-top: 4px;
  font-size: 13px;
}
</style>
