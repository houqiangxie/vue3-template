<script setup lang="ts">
/**
 * 表单布局：分割线（无业务值）
 */
defineProps<{
  value?: unknown
  title?: string
  dashed?: boolean
  titlePlacement?: 'left' | 'right' | 'center'
}>()

defineEmits<{ 'update:value': [unknown] }>()
</script>

<template>
  <n-divider
    class="form-layout-divider"
    :dashed="dashed"
    :title-placement="titlePlacement || 'center'"
  >
    {{ title }}
  </n-divider>
</template>

<style scoped>
.form-layout-divider {
  width: 100%;
  margin: 4px 0;
}
</style>
