/** Updater defaults — override via env or electron-builder publish config. */
export interface UpdateConfig {
  enabled: boolean;
  autoDownload: boolean;
  autoInstallOnAppQuit: boolean;
  checkOnStartup: boolean;
  /** Periodic check interval in ms. 0 = disabled. Default 4h when packaged. */
  checkIntervalMs: number;
  /** Optional runtime override for generic update server URL. */
  feedUrl?: string;
}

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

export function getUpdateConfig(): UpdateConfig {
  const intervalRaw = process.env.ELECTRON_UPDATE_CHECK_INTERVAL_MS;
  const parsedInterval = intervalRaw != null && intervalRaw !== ''
    ? Number(intervalRaw)
    : FOUR_HOURS_MS;

  return {
    enabled: process.env.ELECTRON_UPDATE_ENABLED !== 'false',
    autoDownload: process.env.ELECTRON_UPDATE_AUTO_DOWNLOAD === 'true',
    autoInstallOnAppQuit: process.env.ELECTRON_UPDATE_AUTO_INSTALL !== 'false',
    checkOnStartup: process.env.ELECTRON_UPDATE_CHECK_ON_STARTUP !== 'false',
    checkIntervalMs: Number.isFinite(parsedInterval) && parsedInterval >= 0
      ? parsedInterval
      : FOUR_HOURS_MS,
    feedUrl: process.env.ELECTRON_UPDATE_URL || undefined,
  };
}

export function isUpdateEnabled(): boolean {
  return getUpdateConfig().enabled;
}
