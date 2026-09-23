<script lang="ts" setup>
import { NButton } from 'naive-ui'
import { Icon } from '@/components/Icon'

defineOptions({ name: 'XButton' })

const props = withDefaults(defineProps<{
  loading?: boolean
  preIcon?: string
  postIcon?: string
  title?: string
  type?: '' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'error' | 'default' | 'tertiary'
  link?: boolean
  circle?: boolean
  round?: boolean
  plain?: boolean
  disabled?: boolean
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'mini' | 'default'
  onClick?: ((...args: unknown[]) => unknown) | null
}>(), {
  loading: false,
  preIcon: '',
  postIcon: '',
  title: '',
  type: '',
  link: false,
  circle: false,
  round: false,
  plain: false,
  disabled: false,
  size: 'medium',
  onClick: null,
})

const naiveType = computed(() => {
  const t = props.type
  if (!t || t === 'default' || t === 'info')
    return props.link ? 'primary' : 'default'
  if (t === 'danger')
    return 'error'
  return t as 'primary' | 'success' | 'warning' | 'error' | 'tertiary' | 'default'
})

const naiveSize = computed(() => {
  if (props.size === 'mini')
    return 'tiny'
  if (props.size === 'default')
    return 'medium'
  return props.size
})

const attrs = useAttrs()
</script>

<template>
  <NButton
    v-bind="attrs"
    :loading="loading"
    :disabled="disabled"
    :type="naiveType"
    :size="naiveSize"
    :circle="circle"
    :round="round"
    :quaternary="plain || link"
    :text="link"
    @click="onClick?.($event)"
  >
    <Icon v-if="preIcon" :icon="preIcon" class="mr-1px" />
    {{ title }}
    <Icon v-if="postIcon" :icon="postIcon" class="mr-1px" />
    <slot />
  </NButton>
</template>
