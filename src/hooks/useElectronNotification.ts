import { onMounted, onUnmounted } from 'vue';
import { IPC_EVENTS, electronIpc, ipcOn, isElectron } from '@/utils/electron';
import type { ShowNotificationOptions } from '@/types/ipc';

export interface NotificationClickPayload {
  id?: string;
}

/**
 * Show system notifications from the renderer.
 * Uses the main-process Notification API when in Electron (works while minimized to tray).
 * Falls back to the Web Notification API in the browser.
 */
export function useElectronNotification() {
  let offClick: (() => void) | undefined;

  onMounted(async () => {
    if (!isElectron() && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  });

  onUnmounted(() => {
    offClick?.();
  });

  async function showNotification(options: ShowNotificationOptions): Promise<boolean> {
    if (isElectron()) {
      const result = await electronIpc.notification.show(options);
      return result?.ok ?? false;
    }

    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return false;
      }
    }
    else if (Notification.permission !== 'granted') {
      return false;
    }

    new Notification(options.title, {
      body: options.body,
      silent: options.silent,
    });
    return true;
  }

  function onNotificationClick(listener: (payload: NotificationClickPayload) => void) {
    offClick?.();
    offClick = ipcOn(IPC_EVENTS.NOTIFICATION_CLICK, listener as (...args: unknown[]) => void);
    return offClick;
  }

  return {
    showNotification,
    onNotificationClick,
  };
}
