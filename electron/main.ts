import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { app, BrowserWindow, session } from 'electron';
import { registerIpcHandlers } from './ipc/register';
import { IPC_EVENTS } from './ipc/channels';
import { NotificationService } from './notification';
import { initAppUpdater, scheduleStartupUpdateCheck } from './updater';
import { TrayManager } from './tray';
import { setupApplicationMenu } from './menu';
import { WindowManager } from './window/manager';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

const isDev = !!process.env.VITE_DEV_SERVER_URL;

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
  onWindowClosed: (windowId) => {
    broadcastToAllWindows(IPC_EVENTS.WINDOW_CLOSED, { windowId });
  },
});

const trayManager = new TrayManager({
  tooltip: app.getName(),
  showMainWindow,
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
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
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

app.whenReady().then(() => {
  setupContentSecurityPolicy();

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
    config: {
      locale: 'zh-CN',
      // labels: { file: '文件', quit: '退出' }, // 可逐项覆盖
    },
  });
  createWindow();
  initAppUpdater(() => mainWindow);
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
  trayManager.destroy();
  windowManager.closeAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Keep running in tray on Windows/Linux until user chooses Quit.
  }
});
