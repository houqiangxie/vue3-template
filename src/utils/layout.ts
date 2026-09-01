import { h } from 'vue';
import { NIcon } from 'naive-ui';

/**
 * 渲染图标（用于 NMenu / NDropdown 等 icon 选项）
 */
export function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

/**
 * 颜色加亮（十六进制）
 */
function addLight(color: string, amount: number) {
  const cc = parseInt(color, 16) + amount;
  const c = cc > 255 ? 255 : cc;
  return c.toString(16).length > 1 ? c.toString(16) : `0${c.toString(16)}`;
}

export function lighten(color: string, amount: number) {
  color = color.indexOf('#') >= 0 ? color.substring(1, color.length) : color;
  amount = Math.trunc((255 * amount) / 100);
  return `#${addLight(color.substring(0, 2), amount)}${addLight(
    color.substring(2, 4),
    amount,
  )}${addLight(color.substring(4, 6), amount)}`;
}

/**
 * 颜色加深（十六进制）
 */
function addDark(color: string, amount: number) {
  const cc = parseInt(color, 16) - amount;
  const c = cc < 0 ? 0 : cc;
  return c.toString(16).length > 1 ? c.toString(16) : `0${c.toString(16)}`;
}

export function darken(color: string, amount: number) {
  color = color.indexOf('#') >= 0 ? color.substring(1, color.length) : color;
  amount = Math.trunc((255 * amount) / 100);
  return `#${addDark(color.substring(0, 2), amount)}${addDark(
    color.substring(2, 4),
    amount,
  )}${addDark(color.substring(4, 6), amount)}`;
}

/** n-color-picker 只在合法颜色字符串时才会渲染色块；统一为 6 位 hex */
export function normalizeHexColor(value: unknown, fallback = '#ffffff'): string {
  if (typeof value !== 'string')
    return fallback;
  const v = value.trim();
  const m = v.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
  if (!m)
    return fallback;
  const hex = m[1];
  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toLowerCase();
  }
  // 8 位带 alpha 时丢弃 alpha，配置面板未开启透明度
  return `#${hex.slice(0, 6)}`.toLowerCase();
}

export function isDefaultWhite(hex: string | null | undefined): boolean {
  if (!hex)
    return true;
  return normalizeHexColor(hex, '#ffffff') === '#ffffff';
}

/** 跟随主题时返回空串；否则返回规范化后的自定义背景色 */
export function resolveCustomBg(
  followTheme: boolean | undefined,
  color: string | null | undefined,
): string {
  if (followTheme !== false)
    return '';
  if (!color)
    return '';
  const normalized = normalizeHexColor(color, '');
  return normalized || '';
}

/** 相对亮度 0–1，用于判断自定义背景上的文字对比色 */
export function hexLuminance(hex: string): number {
  const normalized = normalizeHexColor(hex, '#ffffff').replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}
