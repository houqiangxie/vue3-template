import type { Component } from 'vue'
import * as AntdIcons from '@vicons/antd'
import { renderIcon } from './renderIcon'

const iconMap = AntdIcons as Record<string, Component>

/** 按名称解析 @vicons/antd 组件（非字符串原样返回） */
export function resolveAntdIcon(name?: unknown) {
  if (!name || typeof name !== 'string')
    return name
  return iconMap[name] ?? name
}

/** 根据后台返回的图标名（如 HomeOutlined）解析为 Naive Menu icon */
export function resolveMenuIcon(name?: string) {
  const icon = resolveAntdIcon(name)
  return icon && typeof icon !== 'string' ? renderIcon(icon as Component) : undefined
}
