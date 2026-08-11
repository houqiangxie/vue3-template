import { BrowserWindow, app, shell, type IpcMainInvokeEvent } from 'electron';
import type { NotificationService } from '../notification';
import type { ShowNotificationOptions } from '../notification/types';
import {
  checkForUpdates,
  downloadUpdate,
  getUpdateStatus,
  quitAndInstall,
} from '../updater';
import type { TrayFlashOptions, TrayManager } from '../tray';
import type { WindowManager } from '../window/manager';
import type { OpenWindowOptions } from '../window/types';
import { IPC_CHANNELS, type IpcChannel } from './channels';

export interface IpcHandlerContext {
  getMainWindow: () => BrowserWindow | null;
  windowManager: WindowManager;
  notificationService: NotificationService;
  trayManager: TrayManager;
  broadcastToAllWindows: (channel: string, ...args: unknown[]) => void;
}

type IpcHandler = (
  ctx: IpcHandlerContext,
  event: IpcMainInvokeEvent,
  ...args: any[]
) => unknown;

/** Prefer the window that sent the IPC (child title bars), fall back to main. */
function resolveTargetWindow(
  event: IpcMainInvokeEvent,
  getMainWindow: () => BrowserWindow | null,
): BrowserWindow | null {
  const fromSender = BrowserWindow.fromWebContents(event.sender);
  if (fromSender && !fromSender.isDestroyed()) {
    return fromSender;
  }
  return getMainWindow();
}

/**
 * IPC handler registry — add new channels here only.
 * Registration and preload whitelist are derived automatically.
 */
export function createIpcHandlers(ctx: IpcHandlerContext): Record<IpcChannel, IpcHandler> {
  return {
    [IPC_CHANNELS.PING]: (_ctx, _event, message?: string) => ({
      ok: true,
      message: message ?? 'pong',
      timestamp: Date.now(),
    }),

    [IPC_CHANNELS.GET_APP_VERSION]: () => app.getVersion(),

    [IPC_CHANNELS.GET_PLATFORM]: () => process.platform,

    [IPC_CHANNELS.OPEN_EXTERNAL]: (_ctx, _event, url: string) => {
      if (!/^https?:\/\//i.test(url)) {
        throw new Error('Only http(s) URLs are allowed');
      }
      return shell.openExternal(url);
    },

    [IPC_CHANNELS.WINDOW_MINIMIZE]: ({ getMainWindow }, event) => {
      resolveTargetWindow(event, getMainWindow)?.minimize();
    },

    [IPC_CHANNELS.WINDOW_MAXIMIZE]: ({ getMainWindow }, event) => {
      const win = resolveTargetWindow(event, getMainWindow);
      if (!win) {
        return;
      }
      if (win.isMaximized()) {
        win.unmaximize();
      }
      else {
        win.maximize();
      }
    },

    [IPC_CHANNELS.WINDOW_CLOSE]: ({ getMainWindow }, event) => {
      resolveTargetWindow(event, getMainWindow)?.close();
    },

    [IPC_CHANNELS.WINDOW_OPEN]: ({ windowManager }, _event, options: OpenWindowOptions) => {
      return windowManager.open(options);
    },

    [IPC_CHANNELS.WINDOW_CLOSE_CHILD]: ({ windowManager }, _event, windowId: string) => {
      return windowManager.close(windowId);
    },

    [IPC_CHANNELS.WINDOW_CLOSE_ALL]: ({ windowManager }) => {
      windowManager.closeAll();
      return { ok: true };
    },

    [IPC_CHANNELS.WINDOW_GET_INIT_DATA]: ({ windowManager }, _event, windowId: string) => {
      return windowManager.getPendingData(windowId) ?? null;
    },

    [IPC_CHANNELS.NOTIFICATION_SHOW]: ({ notificationService }, _event, options: ShowNotificationOptions) => {
      const { delay, ...rest } = options;
      if (delay && delay > 0) {
        return { ok: notificationService.schedule({ ...rest, id: options.id }, delay), scheduled: true };
      }
      return { ok: notificationService.show(options) };
    },

    [IPC_CHANNELS.TRAY_SET_TOOLTIP]: ({ trayManager }, _event, tooltip: string) => {
      trayManager.setTooltip(tooltip);
    },

    [IPC_CHANNELS.TRAY_FLASH_START]: ({ trayManager }, _event, options?: TrayFlashOptions) => {
      trayManager.startFlashing(options);
      return { ok: true };
    },

    [IPC_CHANNELS.TRAY_FLASH_STOP]: ({ trayManager }) => {
      trayManager.stopFlashing();
      return { ok: true };
    },

    [IPC_CHANNELS.UPDATE_CHECK]: async () => checkForUpdates(),

    [IPC_CHANNELS.UPDATE_DOWNLOAD]: async () => downloadUpdate(),

    [IPC_CHANNELS.UPDATE_INSTALL]: () => quitAndInstall(),

    [IPC_CHANNELS.UPDATE_GET_STATUS]: () => getUpdateStatus(),
  };
}

export type { IpcChannel };
