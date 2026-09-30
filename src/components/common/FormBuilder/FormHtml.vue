<script setup lang="ts">
import { sanitizeHtml } from '@/utils/sanitizeHtml'

/**
 * 表单布局：静态 HTML / 说明文字（无业务值）
 */
const props = withDefaults(defineProps<{
  value?: unknown
  /** 原始 HTML；优先于 content */
  html?: string
  content?: string
}>(), {
  html: '',
  content: '',
})

defineEmits<{ 'update:value': [unknown] }>()

const safeHtml = computed(() => sanitizeHtml(props.html || props.content || ''))
</script>

<template>
  <div class="form-layout-html" v-html="safeHtml" />
</template>

<style scoped>
.form-layout-html {
  width: 100%;
  line-height: 1.6;
  color: var(--n-text-color);
  word-break: break-word;
}
</style>
