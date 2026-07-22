import path from 'node:path';
import { Notification, type BrowserWindow } from 'electron';
import type { NotificationClickPayload, ShowNotificationOptions } from './types';

export interface AttentionOptions {
  flashTaskbar?: boolean;
}

export interface NotificationServiceOptions {
  getMainWindow: () => BrowserWindow | null;
  onNotificationClick?: (payload: NotificationClickPayload) => void;
  /** Trigger tray/taskbar attention (WeChat-like blink). */
  requestAttention?: (options?: AttentionOptions) => void;
  clearAttention?: () => void;
}

function shouldRequestAttention(getMainWindow: () => BrowserWindow | null): boolean {
  const mainWindow = getMainWindow();
  if (!mainWindow || mainWindow.isDestroyed()) {
    return true;
  }
  return !mainWindow.isVisible() || !mainWindow.isFocused() || mainWindow.isMinimized();
}

export class NotificationService {
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(private readonly options: NotificationServiceOptions) {}

  schedule(options: ShowNotificationOptions, delayMs: number): boolean {
    if (!Notification.isSupported() || delayMs <= 0) {
      return false;
    }

    const { delay: _delay, ...showOptions } = options;
    const key = showOptions.id ?? `scheduled-${Date.now()}`;

    const existing = this.timers.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      this.timers.delete(key);
      this.show(showOptions);
    }, delayMs);

    this.timers.set(key, timer);
    return true;
  }

  show(options: ShowNotificationOptions): boolean {
    if (!Notification.isSupported()) {
      return false;
    }

    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: options.icon ? path.resolve(options.icon) : undefined,
      silent: options.silent,
    });

    notification.on('click', () => {
      this.options.clearAttention?.();

      if (options.focusMainWindow !== false) {
        const mainWindow = this.options.getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          mainWindow.show();
          mainWindow.focus();
        }
      }
      this.options.onNotificationClick?.({ id: options.id });
    });

    notification.show();

    const flashTray = options.flashTray !== false;
    const flashTaskbar = options.flashTaskbar !== false;
    if (flashTray && shouldRequestAttention(this.options.getMainWindow)) {
      this.options.requestAttention?.({ flashTaskbar });
    }

    return true;
  }
}
