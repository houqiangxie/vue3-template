<script lang="ts" setup>
import { NIcon } from 'naive-ui'
import type { Component } from 'vue'
import {
  AddOutline,
  ArrowBackOutline,
  ArrowDownOutline,
  ArrowForwardOutline,
  ArrowUpOutline,
  CalendarOutline,
  CheckmarkCircleOutline,
  CheckmarkOutline,
  ChevronForwardOutline,
  CloseCircle,
  CloseOutline,
  CloudDownloadOutline,
  CloudUploadOutline,
  ConstructOutline,
  CreateOutline,
  DocumentTextOutline,
  HelpCircle,
  HelpCircleOutline,
  InformationCircle,
  LinkOutline,
  ListOutline,
  MenuOutline,
  NotificationsOutline,
  PencilOutline,
  RocketOutline,
  SettingsOutline,
  TimeOutline,
  TrashOutline,
} from '@vicons/ionicons5'

defineOptions({ name: 'Icon' })

const props = withDefaults(defineProps<{
  icon?: string
  color?: string
  size?: number
  svgClass?: string
}>(), {
  size: 16,
  svgClass: '',
})

/** Element Plus 风格 icon 名 → ionicons 组件 */
const ICON_MAP: Record<string, Component> = {
  'arrow-left': ArrowBackOutline,
  'arrow-left-bold': ArrowBackOutline,
  'arrow-right': ArrowForwardOutline,
  'arrow-right-bold': ChevronForwardOutline,
  'arrow-up': ArrowUpOutline,
  'arrow-down': ArrowDownOutline,
  'question': HelpCircleOutline,
  'question-filled': HelpCircle,
  'help': HelpCircleOutline,
  'help-filled': HelpCircle,
  'info': InformationCircle,
  'info-filled': InformationCircle,
  'plus': AddOutline,
  'circle-plus': AddOutline,
  'circle-plus-filled': AddOutline,
  'close': CloseOutline,
  'close-bold': CloseOutline,
  'circle-close': CloseCircle,
  'circle-close-filled': CloseCircle,
  'delete': TrashOutline,
  'delete-filled': TrashOutline,
  'edit': CreateOutline,
  'edit-pen': PencilOutline,
  'download': CloudDownloadOutline,
  'upload': CloudUploadOutline,
  'menu': MenuOutline,
  'list': ListOutline,
  'checked': CheckmarkOutline,
  'circle-check': CheckmarkCircleOutline,
  'circle-check-filled': CheckmarkCircleOutline,
  'bell': NotificationsOutline,
  'bell-filled': NotificationsOutline,
  'timer': TimeOutline,
  'calendar': CalendarOutline,
  'setting': SettingsOutline,
  'tools': ConstructOutline,
  'link': LinkOutline,
  'memo': DocumentTextOutline,
  'comment': DocumentTextOutline,
  'promotion': RocketOutline,
}

function resolveName(raw?: string) {
  if (!raw)
    return ''
  const name = raw.includes(':') ? raw.split(':').pop()! : raw
  return name.trim().toLowerCase()
}

const iconComp = computed(() => ICON_MAP[resolveName(props.icon)] || HelpCircleOutline)

const style = computed(() => ({
  color: props.color,
  display: 'inline-flex',
  alignItems: 'center',
  lineHeight: '1',
  cursor: 'pointer',
  verticalAlign: 'middle',
}))
</script>

<template>
  <n-icon
    class="bpm-icon"
    :class="svgClass"
    :size="size"
    :component="iconComp"
    :style="style"
  />
</template>
