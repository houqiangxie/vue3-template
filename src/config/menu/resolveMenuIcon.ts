import type { Component } from 'vue'
import * as AntdIcons from '@vicons/antd'
import { renderIcon } from './renderIcon'

const iconMap = AntdIcons as Record<string, Component>

/** 根据后台返回的图标名（如 HomeOutlined）解析为 Naive Menu icon */
export function resolveMenuIcon(name?: string) {
  if (!name)
    return undefined
  const icon = iconMap[name]
  return icon ? renderIcon(icon) : undefined
}
