/** System notification options (main process). */
export interface ShowNotificationOptions {
  id?: string;
  title: string;
  body?: string;
  /** Absolute path or file:// URL to an icon image. */
  icon?: string;
  silent?: boolean;
  /** Bring main window to front when the notification is clicked. */
  focusMainWindow?: boolean;
  /** Flash tray icon when app is in background. Default true. */
  flashTray?: boolean;
  /** Flash taskbar button when app is in background. Default true. */
  flashTaskbar?: boolean;
  /** Delay before showing (ms). Scheduled in main process — works after window is hidden. */
  delay?: number;
}

export interface NotificationClickPayload {
  id?: string;
}
