import { BrowserWindow, Menu, app, dialog } from 'electron';
import { checkForUpdates } from '../updater';
import type { AppMenuConfig } from './config';
import { resolveMenuLabels } from './config';

export interface AppMenuContext {
  getMainWindow: () => BrowserWindow | null;
  isDev: boolean;
  onHideToTray: () => void;
  onQuit: () => void;
  config?: AppMenuConfig;
}

export function setupApplicationMenu(ctx: AppMenuContext) {
  const labels = resolveMenuLabels(ctx.config);
  const showDevTools = ctx.config?.showDevTools ?? ctx.isDev;

  const focusedWindow = () => BrowserWindow.getFocusedWindow() ?? ctx.getMainWindow();

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: labels.file,
      submenu: [
        {
          label: labels.hideToTray,
          accelerator: 'CmdOrCtrl+H',
          click: () => ctx.onHideToTray(),
        },
        { type: 'separator' },
        {
          label: labels.quit,
          accelerator: 'CmdOrCtrl+Q',
          click: () => ctx.onQuit(),
        },
      ],
    },
    {
      label: labels.edit,
      submenu: [
        { label: labels.undo, role: 'undo' },
        { label: labels.redo, role: 'redo' },
        { type: 'separator' },
        { label: labels.cut, role: 'cut' },
        { label: labels.copy, role: 'copy' },
        { label: labels.paste, role: 'paste' },
        { type: 'separator' },
        { label: labels.selectAll, role: 'selectAll' },
      ],
    },
    {
      label: labels.view,
      submenu: [
        {
          label: labels.reload,
          accelerator: 'CmdOrCtrl+R',
          click: () => focusedWindow()?.webContents.reload(),
        },
        ...(showDevTools
          ? [{
              label: labels.devTools,
              accelerator: 'F12',
              click: () => focusedWindow()?.webContents.toggleDevTools(),
            } satisfies Electron.MenuItemConstructorOptions]
          : []),
        { type: 'separator' },
        { label: labels.resetZoom, role: 'resetZoom' },
        { label: labels.zoomIn, role: 'zoomIn' },
        { label: labels.zoomOut, role: 'zoomOut' },
        { type: 'separator' },
        { label: labels.toggleFullscreen, role: 'togglefullscreen' },
      ],
    },
    {
      label: labels.window,
      submenu: [
        {
          label: labels.minimize,
          accelerator: 'CmdOrCtrl+M',
          click: () => focusedWindow()?.minimize(),
        },
        {
          label: labels.close,
          accelerator: 'CmdOrCtrl+W',
          click: () => focusedWindow()?.close(),
        },
      ],
    },
    {
      label: labels.help,
      submenu: [
        {
          label: labels.checkForUpdates,
          click: () => {
            void checkForUpdates({ silent: false }).then((result) => {
              if (result.ok) {
                return;
              }
              const win = focusedWindow();
              if (!win) {
                return;
              }
              void dialog.showMessageBox(win, {
                type: 'info',
                title: labels.checkForUpdates,
                message: result.reason ?? '当前无法检查更新',
                buttons: ['确定'],
              });
            }).catch((error: unknown) => {
              const win = focusedWindow();
              if (!win) {
                return;
              }
              const message = error instanceof Error ? error.message : String(error);
              void dialog.showMessageBox(win, {
                type: 'error',
                title: labels.checkForUpdates,
                message,
                buttons: ['确定'],
              });
            });
          },
        },
        {
          label: labels.about,
          click: () => {
            const win = focusedWindow();
            if (!win) {
              return;
            }
            void dialog.showMessageBox(win, {
              type: 'info',
              title: labels.about,
              message: app.getName(),
              detail: `版本 ${app.getVersion()}`,
              buttons: ['确定'],
            });
          },
        },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { label: labels.about, role: 'about' },
        { type: 'separator' },
        { label: labels.hideToTray, role: 'hide' },
        { type: 'separator' },
        { label: labels.quit, role: 'quit' },
      ],
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/** Hide the native menu bar entirely (Windows/Linux). */
export function hideApplicationMenu() {
  Menu.setApplicationMenu(null);
}
