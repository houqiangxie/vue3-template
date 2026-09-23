<template>
  <span class="bpm-dict-tag">{{ label }}</span>
</template>

<script setup lang="ts">
defineOptions({ name: 'DictTag' })

const props = defineProps<{
  type?: string
  value?: string | number | boolean
}>()

const label = computed(() => {
  if (props.value === undefined || props.value === null || props.value === '')
    return '-'
  return String(props.value)
})
</script>

<style scoped>
.bpm-dict-tag {
  display: inline-block;
  padding: 0 6px;
  font-size: 12px;
  line-height: 20px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #374151;
}
</style>
