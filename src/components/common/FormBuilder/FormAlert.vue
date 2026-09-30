<script setup lang="ts">
/**
 * 表单布局：提示条（无业务值）
 */
withDefaults(defineProps<{
  value?: unknown
  title?: string
  content?: string
  type?: 'default' | 'info' | 'success' | 'warning' | 'error'
  bordered?: boolean
  closable?: boolean
}>(), {
  type: 'info',
  bordered: true,
})

defineEmits<{ 'update:value': [unknown] }>()
</script>

<template>
  <n-alert
    class="form-layout-alert"
    :title="title"
    :type="type"
    :bordered="bordered"
    :closable="closable"
  >
    {{ content }}
  </n-alert>
</template>

<style scoped>
.form-layout-alert {
  width: 100%;
}
</style>
