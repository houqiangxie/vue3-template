/** IPC channel constants — add new invoke channels here only. */
export const IPC_CHANNELS = {
  PING: 'app:ping',
  GET_APP_VERSION: 'app:get-version',
  GET_PLATFORM: 'app:get-platform',
  OPEN_EXTERNAL: 'app:open-external',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_OPEN: 'window:open',
  WINDOW_CLOSE_CHILD: 'window:close-child',
  WINDOW_CLOSE_ALL: 'window:close-all',
  WINDOW_GET_INIT_DATA: 'window:get-init-data',
  NOTIFICATION_SHOW: 'notification:show',
  TRAY_SET_TOOLTIP: 'tray:set-tooltip',
  TRAY_FLASH_START: 'tray:flash-start',
  TRAY_FLASH_STOP: 'tray:flash-stop',
  UPDATE_CHECK: 'update:check',
  UPDATE_DOWNLOAD: 'update:download',
  UPDATE_INSTALL: 'update:install',
  UPDATE_GET_STATUS: 'update:get-status',
} as const;

/** Main -> renderer push events. */
export const IPC_EVENTS = {
  UPDATE_STATUS: 'update:status',
  WINDOW_INIT_DATA: 'window:init-data',
  WINDOW_READY: 'window:ready',
  WINDOW_CLOSED: 'window:closed',
  NOTIFICATION_CLICK: 'notification:click',
} as const;

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
export type IpcEvent = typeof IPC_EVENTS[keyof typeof IPC_EVENTS];

/** Auto-derived from IPC_CHANNELS — preload whitelist stays in sync. */
export const INVOKE_CHANNELS = new Set<string>(Object.values(IPC_CHANNELS));

/** Optional: channels that renderer may push via send/on. Extend when needed. */
export const SEND_CHANNELS = new Set<string>([]);
export const ON_CHANNELS = new Set<string>(Object.values(IPC_EVENTS));
