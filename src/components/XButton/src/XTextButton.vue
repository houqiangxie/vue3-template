<script lang="ts" setup>
import { NButton } from 'naive-ui'
import { Icon } from '@/components/Icon'

defineOptions({ name: 'XTextButton' })

const props = withDefaults(defineProps<{
  loading?: boolean
  preIcon?: string
  postIcon?: string
  title?: string
  type?: '' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'error' | 'default'
  disabled?: boolean
  onClick?: ((...args: unknown[]) => unknown) | null
}>(), {
  loading: false,
  preIcon: '',
  postIcon: '',
  title: '',
  type: 'primary',
  disabled: false,
  onClick: null,
})

const naiveType = computed(() => {
  const t = props.type
  if (!t || t === 'info' || t === 'default')
    return 'primary'
  if (t === 'danger')
    return 'error'
  return t as 'primary' | 'success' | 'warning' | 'error'
})

const attrs = useAttrs()
</script>

<template>
  <NButton
    v-bind="attrs"
    text
    :loading="loading"
    :disabled="disabled"
    :type="naiveType"
    @click="onClick?.($event)"
  >
    <Icon v-if="preIcon" :icon="preIcon" class="mr-1px" />
    {{ title }}
    <Icon v-if="postIcon" :icon="postIcon" class="mr-1px" />
    <slot />
  </NButton>
</template>
