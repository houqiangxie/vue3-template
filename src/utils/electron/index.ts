import { IPC_CHANNELS } from '../../../electron/ipc/channels';
import type { ShowNotificationOptions } from '../../../electron/notification/types';
import type { OpenWindowOptions } from '../../../electron/window/types';
import type { IpcInvokeMap, TypedIpcChannel } from '@/types/ipc';

export type { IpcInvokeMap, TypedIpcChannel };
export type { OpenWindowOptions, ShowNotificationOptions };
export { IPC_CHANNELS, IPC_EVENTS } from '../../../electron/ipc/channels';

/** Whether the app is running inside Electron. */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI;
}

/** Safe accessor for the preload-exposed Electron API. */
export function getElectronAPI() {
  if (!isElectron()) {
    return null;
  }
  return window.electronAPI!;
}

/**
 * Generic typed IPC invoke — no per-channel wrapper needed.
 * Add channel in electron/ipc/handlers.ts, then call ipcInvoke here.
 */
export async function ipcInvoke<C extends TypedIpcChannel>(
  channel: C,
  ...args: IpcInvokeMap[C]['args']
): Promise<IpcInvokeMap[C]['result'] | undefined> {
  const api = getElectronAPI();
  if (!api) {
    return undefined;
  }
  return api.invoke<IpcInvokeMap[C]['result']>(channel, ...(args as unknown[]));
}

/** Subscribe to main-process push events. */
export function ipcOn(channel: string, listener: (...args: unknown[]) => void) {
  return getElectronAPI()?.on(channel, listener);
}

/** Fire-and-forget message to the main process. */
export function ipcSend(channel: string, ...args: unknown[]) {
  getElectronAPI()?.send(channel, ...args);
}

/** Convenience helpers — thin aliases, not a third place to maintain logic. */
export const electronIpc = {
  ping: (message?: string) => ipcInvoke(IPC_CHANNELS.PING, message),
  getAppVersion: () => ipcInvoke(IPC_CHANNELS.GET_APP_VERSION),
  getPlatform: () => ipcInvoke(IPC_CHANNELS.GET_PLATFORM),
  openExternal: (url: string) => ipcInvoke(IPC_CHANNELS.OPEN_EXTERNAL, url),
  window: {
    minimize: () => ipcInvoke(IPC_CHANNELS.WINDOW_MINIMIZE),
    maximize: () => ipcInvoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
    close: () => ipcInvoke(IPC_CHANNELS.WINDOW_CLOSE),
    open: (options: OpenWindowOptions) => ipcInvoke(IPC_CHANNELS.WINDOW_OPEN, options),
    closeChild: (windowId: string) => ipcInvoke(IPC_CHANNELS.WINDOW_CLOSE_CHILD, windowId),
    closeAll: () => ipcInvoke(IPC_CHANNELS.WINDOW_CLOSE_ALL),
    getInitData: (windowId: string) => ipcInvoke(IPC_CHANNELS.WINDOW_GET_INIT_DATA, windowId),
  },
  notification: {
    show: (options: ShowNotificationOptions) => ipcInvoke(IPC_CHANNELS.NOTIFICATION_SHOW, options),
  },
  tray: {
    setTooltip: (tooltip: string) => ipcInvoke(IPC_CHANNELS.TRAY_SET_TOOLTIP, tooltip),
    flashStart: (options?: { interval?: number; duration?: number }) =>
      ipcInvoke(IPC_CHANNELS.TRAY_FLASH_START, options),
    flashStop: () => ipcInvoke(IPC_CHANNELS.TRAY_FLASH_STOP),
  },
  update: {
    check: () => ipcInvoke(IPC_CHANNELS.UPDATE_CHECK),
    download: () => ipcInvoke(IPC_CHANNELS.UPDATE_DOWNLOAD),
    install: () => ipcInvoke(IPC_CHANNELS.UPDATE_INSTALL),
    getStatus: () => ipcInvoke(IPC_CHANNELS.UPDATE_GET_STATUS),
  },
};
