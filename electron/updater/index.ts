import { BrowserWindow, app } from 'electron';
import { autoUpdater } from 'electron-updater';
import { IPC_EVENTS } from '../ipc/channels';
import { getUpdateConfig, isUpdateEnabled } from './config';
import type { UpdateActionResult, UpdateProgress, UpdateStatusPayload } from './types';

type BroadcastFn = (channel: string, ...args: unknown[]) => void;

let status: UpdateStatusPayload = { phase: 'idle' };
let initialized = false;
let broadcastRef: BroadcastFn = (channel, ...args) => {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, ...args);
    }
  }
};
let checkIntervalId: ReturnType<typeof setInterval> | null = null;

function canUseUpdater(): boolean {
  return app.isPackaged && isUpdateEnabled();
}

function emitStatus(patch: Partial<UpdateStatusPayload>) {
  status = { ...status, ...patch };
  broadcastRef(IPC_EVENTS.UPDATE_STATUS, status);
}

function toProgress(progress: {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
}): UpdateProgress {
  return {
    percent: progress.percent,
    transferred: progress.transferred,
    total: progress.total,
    bytesPerSecond: progress.bytesPerSecond,
  };
}

function unavailable(reason: string): UpdateActionResult {
  return { ok: false, reason };
}

export function getUpdateStatus(): UpdateStatusPayload {
  return { ...status };
}

export function initAppUpdater(options?: { broadcast?: BroadcastFn }) {
  if (options?.broadcast) {
    broadcastRef = options.broadcast;
  }

  if (!canUseUpdater()) {
    status = {
      phase: 'idle',
      currentVersion: app.getVersion(),
    };
    return;
  }

  if (initialized) {
    return;
  }
  initialized = true;

  const config = getUpdateConfig();

  autoUpdater.autoDownload = config.autoDownload;
  autoUpdater.autoInstallOnAppQuit = config.autoInstallOnAppQuit;
  autoUpdater.allowDowngrade = false;

  if (config.feedUrl) {
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: config.feedUrl,
    });
  }

  status = {
    phase: 'idle',
    currentVersion: app.getVersion(),
  };

  autoUpdater.on('checking-for-update', () => {
    emitStatus({ phase: 'checking', error: undefined });
  });

  autoUpdater.on('update-available', (info) => {
    emitStatus({
      phase: 'available',
      version: info.version,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : null,
      error: undefined,
    });

    if (config.autoDownload) {
      void autoUpdater.downloadUpdate();
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    emitStatus({
      phase: 'not-available',
      version: info.version,
      error: undefined,
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    emitStatus({
      phase: 'downloading',
      progress: toProgress(progress),
      error: undefined,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    emitStatus({
      phase: 'downloaded',
      version: info.version,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : null,
      error: undefined,
    });
  });

  autoUpdater.on('error', (error) => {
    emitStatus({
      phase: 'error',
      error: error.message,
    });
  });
}

export async function checkForUpdates(options?: { silent?: boolean }): Promise<UpdateActionResult> {
  if (!canUseUpdater()) {
    return unavailable('Updates are disabled in development or by configuration.');
  }

  try {
    emitStatus({ phase: 'checking', error: undefined });
    await autoUpdater.checkForUpdates();
    return { ok: true };
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emitStatus({ phase: 'error', error: message });
    if (options?.silent) {
      return unavailable(message);
    }
    throw error;
  }
}

export async function downloadUpdate(): Promise<UpdateActionResult> {
  if (!canUseUpdater()) {
    return unavailable('Updates are disabled in development or by configuration.');
  }

  if (status.phase !== 'available' && status.phase !== 'error') {
    return unavailable(`Cannot download while status is "${status.phase}".`);
  }

  try {
    emitStatus({ phase: 'downloading', error: undefined });
    await autoUpdater.downloadUpdate();
    return { ok: true };
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emitStatus({ phase: 'error', error: message });
    return unavailable(message);
  }
}

export function quitAndInstall(): UpdateActionResult {
  if (!canUseUpdater()) {
    return unavailable('Updates are disabled in development or by configuration.');
  }

  if (status.phase !== 'downloaded') {
    return unavailable(`Cannot install while status is "${status.phase}".`);
  }

  autoUpdater.quitAndInstall(false, true);
  return { ok: true };
}

export function scheduleStartupUpdateCheck() {
  const config = getUpdateConfig();
  if (!canUseUpdater()) {
    return;
  }

  if (config.checkOnStartup) {
    setTimeout(() => {
      void checkForUpdates({ silent: true });
    }, 3000);
  }

  const intervalMs = config.checkIntervalMs ?? 0;
  if (intervalMs > 0 && !checkIntervalId) {
    checkIntervalId = setInterval(() => {
      void checkForUpdates({ silent: true });
    }, intervalMs);
  }
}

export function stopUpdateChecks() {
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
  }
}
