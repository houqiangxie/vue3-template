import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { app, BrowserWindow, session } from 'electron';
import { registerIpcHandlers } from './ipc/register';
import { IPC_EVENTS } from './ipc/channels';
import { NotificationService } from './notification';
import { initAppUpdater, scheduleStartupUpdateCheck, stopUpdateChecks } from './updater';
import { TrayManager } from './tray';
import { setupApplicationMenu } from './menu';
import { WindowManager } from './window/manager';
import { createWebPreferences } from './window/preferences';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}
else {
  bootstrap();
}

function bootstrap() {
  let mainWindow: BrowserWindow | null = null;
  let isQuitting = false;

  const isDev = !!process.env.VITE_DEV_SERVER_URL;
  const menuConfig = {
    locale: 'zh-CN' as const,
    // labels: { file: '文件', quit: '退出' }, // 可逐项覆盖
  };

  const sharedWebPreferences = createWebPreferences(path.join(__dirname, 'preload.cjs'));

  function setupContentSecurityPolicy() {
    if (isDev) {
      return;
    }

    const csp = [
      'default-src \'self\'',
      'script-src \'self\' https://at.alicdn.com',
      'style-src \'self\' \'unsafe-inline\' https://at.alicdn.com',
      'img-src \'self\' data: blob: https:',
      'font-src \'self\' https://at.alicdn.com data:',
      'connect-src \'self\' https: wss:',
    ].join('; ');

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const responseHeaders = { ...details.responseHeaders };
      responseHeaders['Content-Security-Policy'] = [csp];
      callback({ responseHeaders });
    });
  }

  /** Deny risky browser APIs by default (camera/mic/geo, etc.). */
  function setupPermissionDefaults() {
    const allowed = new Set([
      'notifications',
      'fullscreen',
      'clipboard-read',
      'clipboard-sanitized-write',
    ]);
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
      callback(allowed.has(permission));
    });
  }

  function getMainWindow() {
    return mainWindow;
  }

  function showMainWindow() {
    trayManager.stopFlashing();
    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  }

  function broadcastToAllWindows(channel: string, ...args: unknown[]) {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, ...args);
      }
    }
  }

  const windowManager = new WindowManager({
    isDev,
    devServerUrl: process.env.VITE_DEV_SERVER_URL,
    getMainWindow,
    webPreferences: sharedWebPreferences,
    onWindowClosed: (windowId) => {
      broadcastToAllWindows(IPC_EVENTS.WINDOW_CLOSED, { windowId });
    },
  });

  const trayManager = new TrayManager({
    tooltip: app.getName(),
    showMainWindow,
    menuConfig,
    onQuit: () => {
      isQuitting = true;
      app.quit();
    },
    onFlashStart: () => {
      const win = getMainWindow();
      if (win && !win.isDestroyed()) {
        win.flashFrame(true);
      }
    },
    onFlashStop: () => {
      const win = getMainWindow();
      if (win && !win.isDestroyed()) {
        win.flashFrame(false);
      }
    },
  });

  const notificationService = new NotificationService({
    getMainWindow,
    onNotificationClick: (payload) => {
      broadcastToAllWindows(IPC_EVENTS.NOTIFICATION_CLICK, payload);
    },
    requestAttention: () => {
      trayManager.startFlashing();
    },
    clearAttention: () => {
      trayManager.stopFlashing();
    },
  });

  function attachWindowOpenHandler(win: BrowserWindow) {
    win.webContents.setWindowOpenHandler(({ url, features }) => {
      windowManager.handleWindowOpen(url, features);
      return { action: 'deny' };
    });
  }

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 960,
      minHeight: 640,
      show: false,
      webPreferences: sharedWebPreferences,
    });

    mainWindow.once('ready-to-show', () => {
      mainWindow?.show();
    });

    attachWindowOpenHandler(mainWindow);

    mainWindow.on('focus', () => {
      trayManager.stopFlashing();
      mainWindow?.flashFrame(false);
    });

    mainWindow.on('close', (event) => {
      if (!isQuitting && process.platform !== 'darwin') {
        event.preventDefault();
        mainWindow?.hide();
      }
    });

    if (isDev) {
      mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!);
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    else {
      mainWindow.loadFile(path.join(app.getAppPath(), 'dist/index.html'));
    }

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow();
      return;
    }
    showMainWindow();
  });

  app.whenReady().then(() => {
    setupContentSecurityPolicy();
    setupPermissionDefaults();

    registerIpcHandlers({
      getMainWindow,
      windowManager,
      notificationService,
      trayManager,
      broadcastToAllWindows,
    });

    trayManager.init();
    setupApplicationMenu({
      getMainWindow,
      isDev,
      onHideToTray: () => {
        mainWindow?.hide();
      },
      onQuit: () => {
        isQuitting = true;
        app.quit();
      },
      config: menuConfig,
    });
    createWindow();
    initAppUpdater({ broadcast: broadcastToAllWindows });
    scheduleStartupUpdateCheck();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
      else {
        showMainWindow();
      }
    });
  });

  app.on('before-quit', () => {
    isQuitting = true;
    stopUpdateChecks();
    notificationService.destroy();
    trayManager.destroy();
    windowManager.closeAll();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      // Keep running in tray on Windows/Linux until user chooses Quit.
    }
  });
}
