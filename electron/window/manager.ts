import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  app,
  BrowserWindow,
  shell,
  type BrowserWindowConstructorOptions,
} from 'electron';
import type { OpenWindowOptions, WindowActionResult } from './types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface WindowManagerOptions {
  isDev: boolean;
  devServerUrl?: string;
  getMainWindow: () => BrowserWindow | null;
  onWindowClosed?: (windowId: string) => void;
}

/** Resolve relative/hash routes to a loadable URL in dev or production. */
export function resolveAppUrl(
  rawUrl: string,
  isDev: boolean,
  devServerUrl?: string,
): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    if (isDev && devServerUrl && trimmed.startsWith(devServerUrl)) {
      return trimmed;
    }
    if (!isDev) {
      const indexPath = path.join(app.getAppPath(), 'dist/index.html').replace(/\\/g, '/');
      const fileBase = `file://${indexPath}`;
      if (trimmed.startsWith(fileBase)) {
        return trimmed;
      }
    }
    return null;
  }

  if (trimmed.startsWith('file://')) {
    const indexPath = path.join(app.getAppPath(), 'dist/index.html').replace(/\\/g, '/');
    if (trimmed.startsWith(`file://${indexPath}`)) {
      return trimmed;
    }
    return null;
  }

  const route = trimmed.startsWith('#')
    ? trimmed
    : trimmed.startsWith('/')
      ? `#${trimmed}`
      : `#/${trimmed}`;

  if (isDev && devServerUrl) {
    return `${devServerUrl.replace(/\/$/, '')}${route}`;
  }

  const indexPath = path.join(app.getAppPath(), 'dist/index.html');
  return `file://${indexPath.replace(/\\/g, '/')}${route}`;
}

function isExternalHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export class WindowManager {
  private readonly windows = new Map<string, BrowserWindow>();
  private readonly pendingData = new Map<string, Record<string, unknown>>();

  constructor(private readonly options: WindowManagerOptions) {}

  /** Electron equivalent of `window.open` / `<a target="_blank">` for in-app navigation. */
  open(options: OpenWindowOptions): WindowActionResult {
    const resolvedUrl = resolveAppUrl(options.url, this.options.isDev, this.options.devServerUrl);

    if (!resolvedUrl) {
      if (isExternalHttpUrl(options.url)) {
        void shell.openExternal(options.url);
        return { ok: true };
      }
      return { ok: false, error: `Unsupported URL: ${options.url}` };
    }

    const windowId = options.id ?? randomUUID();

    const existing = this.windows.get(windowId);
    if (existing && !existing.isDestroyed()) {
      if (options.data) {
        this.pendingData.set(windowId, options.data);
        existing.webContents.send('window:init-data', { windowId, data: options.data });
      }
      if (options.title) {
        existing.setTitle(options.title);
      }
      existing.show();
      existing.focus();
      return { ok: true, windowId };
    }

    const parent = options.modal ? this.options.getMainWindow() ?? undefined : undefined;

    const browserOptions: BrowserWindowConstructorOptions = {
      width: options.width ?? 960,
      height: options.height ?? 640,
      minWidth: options.minWidth ?? 640,
      minHeight: options.minHeight ?? 480,
      title: options.title,
      show: false,
      modal: options.modal,
      parent,
      resizable: options.resizable ?? true,
      maximizable: options.maximizable ?? true,
      minimizable: options.minimizable ?? true,
      center: options.center ?? true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    };

    const win = new BrowserWindow(browserOptions);
    this.windows.set(windowId, win);

    if (options.data) {
      this.pendingData.set(windowId, options.data);
    }

    this.attachWindowHandlers(win, windowId);

    if (resolvedUrl.startsWith('file://')) {
      const hashIndex = resolvedUrl.indexOf('#');
      const filePath = hashIndex >= 0
        ? resolvedUrl.slice('file://'.length, hashIndex)
        : resolvedUrl.slice('file://'.length);
      const hash = hashIndex >= 0 ? resolvedUrl.slice(hashIndex + 1) : '';
      void win.loadFile(filePath, hash ? { hash } : undefined);
    }
    else {
      void win.loadURL(resolvedUrl);
    }

    win.once('ready-to-show', () => {
      win.show();
    });

    return { ok: true, windowId };
  }

  close(windowId: string): WindowActionResult {
    const win = this.windows.get(windowId);
    if (!win || win.isDestroyed()) {
      return { ok: false, error: `Window "${windowId}" not found` };
    }
    win.close();
    return { ok: true, windowId };
  }

  closeAll(): void {
    for (const win of this.windows.values()) {
      if (!win.isDestroyed()) {
        win.close();
      }
    }
  }

  getPendingData(windowId: string): Record<string, unknown> | undefined {
    const data = this.pendingData.get(windowId);
    this.pendingData.delete(windowId);
    return data;
  }

  /** Handle native `window.open` from any webContents. */
  handleWindowOpen(url: string, features?: string): WindowActionResult {
    const modal = /modal=yes/i.test(features ?? '');
    return this.open({ url, modal });
  }

  private attachWindowHandlers(win: BrowserWindow, windowId: string) {
    win.webContents.setWindowOpenHandler(({ url, features }) => {
      this.handleWindowOpen(url, features);
      return { action: 'deny' };
    });

    win.webContents.on('did-finish-load', () => {
      const data = this.pendingData.get(windowId);
      if (data) {
        win.webContents.send('window:init-data', { windowId, data });
        this.pendingData.delete(windowId);
      }
      win.webContents.send('window:ready', { windowId });
    });

    win.on('closed', () => {
      this.windows.delete(windowId);
      this.pendingData.delete(windowId);
      this.options.onWindowClosed?.(windowId);
    });
  }
}
