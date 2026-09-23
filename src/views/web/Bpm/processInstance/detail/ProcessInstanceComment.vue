<template>
  <div class="bpm-comment">
    <div class="bpm-comment__editor">
      <n-input
        v-model:value="content"
        type="textarea"
        :rows="3"
        maxlength="500"
        show-count
        placeholder="请输入评论内容"
      />
      <div class="bpm-comment__actions">
        <n-button type="primary" :loading="submitting" :disabled="!content.trim()" @click="submit">
          发表评论
        </n-button>
      </div>
    </div>

    <n-spin :show="loading">
      <n-empty v-if="!loading && !list.length" description="暂无评论" />
      <n-timeline v-else>
        <n-timeline-item
          v-for="item in list"
          :key="item.id"
          :title="item.userNickname || '匿名用户'"
          :time="item.createTime"
        >
          <div class="bpm-comment__content">{{ item.content }}</div>
        </n-timeline-item>
      </n-timeline>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import {
  createProcessInstanceComment,
  getProcessInstanceCommentList,
} from '@/api/bpm/processInstance'

defineOptions({ name: 'ProcessInstanceComment' })

const props = defineProps<{
  processInstanceId: string
}>()

const message = useMessage()
const loading = ref(false)
const submitting = ref(false)
const content = ref('')
const list = ref<any[]>([])

async function loadList() {
  if (!props.processInstanceId)
    return
  loading.value = true
  try {
    const data = await getProcessInstanceCommentList(props.processInstanceId) as any
    list.value = Array.isArray(data) ? data : (data?.list || [])
  }
  catch {
    list.value = []
  }
  finally {
    loading.value = false
  }
}

async function submit() {
  const text = content.value.trim()
  if (!text) {
    message.warning('请输入评论内容')
    return
  }
  submitting.value = true
  try {
    await createProcessInstanceComment({
      processInstanceId: props.processInstanceId,
      content: text,
    })
    content.value = ''
    message.success('评论成功')
    await loadList()
  }
  catch (e: any) {
    message.error(e?.message || '评论失败')
  }
  finally {
    submitting.value = false
  }
}

watch(() => props.processInstanceId, () => loadList(), { immediate: true })

defineExpose({ refresh: loadList })
</script>

<style scoped>
.bpm-comment {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.bpm-comment__editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bpm-comment__actions {
  display: flex;
  justify-content: flex-end;
}
.bpm-comment__content {
  white-space: pre-wrap;
  line-height: 1.6;
}
</style>
