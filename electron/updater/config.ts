/** Updater defaults — override via env or electron-builder publish config. */
export interface UpdateConfig {
  enabled: boolean;
  autoDownload: boolean;
  autoInstallOnAppQuit: boolean;
  checkOnStartup: boolean;
  /** Optional runtime override for generic update server URL. */
  feedUrl?: string;
}

export function getUpdateConfig(): UpdateConfig {
  return {
    enabled: process.env.ELECTRON_UPDATE_ENABLED !== 'false',
    autoDownload: process.env.ELECTRON_UPDATE_AUTO_DOWNLOAD === 'true',
    autoInstallOnAppQuit: process.env.ELECTRON_UPDATE_AUTO_INSTALL !== 'false',
    checkOnStartup: process.env.ELECTRON_UPDATE_CHECK_ON_STARTUP !== 'false',
    feedUrl: process.env.ELECTRON_UPDATE_URL || undefined,
  };
}

export function isUpdateEnabled(): boolean {
  return getUpdateConfig().enabled;
}
