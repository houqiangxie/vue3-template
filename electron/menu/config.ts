/** Application menu labels — extend or replace for i18n. */
export interface AppMenuLabels {
  file: string;
  hideToTray: string;
  quit: string;
  edit: string;
  undo: string;
  redo: string;
  cut: string;
  copy: string;
  paste: string;
  selectAll: string;
  view: string;
  reload: string;
  devTools: string;
  resetZoom: string;
  zoomIn: string;
  zoomOut: string;
  toggleFullscreen: string;
  window: string;
  minimize: string;
  close: string;
  help: string;
  about: string;
}

export const MENU_LABELS_ZH_CN: AppMenuLabels = {
  file: '文件',
  hideToTray: '隐藏到托盘',
  quit: '退出',
  edit: '编辑',
  undo: '撤销',
  redo: '重做',
  cut: '剪切',
  copy: '复制',
  paste: '粘贴',
  selectAll: '全选',
  view: '视图',
  reload: '重新加载',
  devTools: '开发者工具',
  resetZoom: '重置缩放',
  zoomIn: '放大',
  zoomOut: '缩小',
  toggleFullscreen: '切换全屏',
  window: '窗口',
  minimize: '最小化',
  close: '关闭',
  help: '帮助',
  about: '关于',
};

export interface AppMenuConfig {
  /** Menu text locale. Default zh-CN. */
  locale?: 'zh-CN';
  /** Override individual labels. */
  labels?: Partial<AppMenuLabels>;
  /** Show DevTools item (default: same as isDev). */
  showDevTools?: boolean;
}

export function resolveMenuLabels(config: AppMenuConfig = {}): AppMenuLabels {
  const base = config.locale === 'zh-CN' || !config.locale ? MENU_LABELS_ZH_CN : MENU_LABELS_ZH_CN;
  return { ...base, ...config.labels };
}
