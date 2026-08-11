import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, Menu, nativeImage, screen, Tray } from 'electron';
import { resolveMenuLabels, type AppMenuConfig } from '../menu/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface TrayFlashOptions {
  /** Toggle interval in ms. Default 500 (WeChat-like). */
  interval?: number;
  /** Auto stop after ms. 0 = until user opens app or calls stopFlashing. */
  duration?: number;
}

export interface TrayManagerOptions {
  tooltip?: string;
  showMainWindow: () => void;
  onQuit: () => void;
  /** Reuse app menu locale / label overrides for tray items. */
  menuConfig?: AppMenuConfig;
  /** Called when tray flashing starts (e.g. flash taskbar). */
  onFlashStart?: () => void;
  /** Called when tray flashing stops. */
  onFlashStop?: () => void;
}

function resolveAssetPath(filename: string): string | null {
  const candidates = [
    path.join(__dirname, 'assets', filename),
    path.join(__dirname, '../electron/assets', filename),
    path.join(app.getAppPath(), 'electron/assets', filename),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function loadImageFromAsset(filename: string): Electron.NativeImage | null {
  const assetPath = resolveAssetPath(filename);
  if (!assetPath) {
    return null;
  }

  let image = nativeImage.createFromPath(assetPath);
  if (image.isEmpty()) {
    image = nativeImage.createFromBuffer(readFileSync(assetPath));
  }

  return image.isEmpty() ? null : image;
}

/** Prefer @2x asset on HiDPI, then fall back to the 1x file. */
function loadTrayAsset(baseName: string): Electron.NativeImage | null {
  const scale = (() => {
    try {
      return screen.getPrimaryDisplay().scaleFactor;
    }
    catch {
      return 1;
    }
  })();

  const [name, ext = 'png'] = baseName.split(/\.(?=[^.]+$)/);
  if (scale >= 1.5) {
    const hiDpi = loadImageFromAsset(`${name}@2x.${ext}`);
    if (hiDpi) {
      return hiDpi;
    }
  }
  return loadImageFromAsset(baseName);
}

function normalizeTrayImage(image: Electron.NativeImage): Electron.NativeImage {
  if (process.platform === 'win32') {
    // HiDPI trays look sharper at 32px; 16px is enough on 100% scale.
    const scale = (() => {
      try {
        return screen.getPrimaryDisplay().scaleFactor;
      }
      catch {
        return 1;
      }
    })();
    const size = scale >= 1.5 ? 32 : 16;
    return image.resize({ width: size, height: size });
  }
  if (process.platform === 'darwin') {
    image.setTemplateImage(true);
  }
  return image;
}

function createFallbackIcon(r: number, g: number, b: number): Electron.NativeImage {
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4, 0);
  for (let i = 0; i < size * size; i++) {
    const offset = i * 4;
    canvas[offset] = b;
    canvas[offset + 1] = g;
    canvas[offset + 2] = r;
    canvas[offset + 3] = 255;
  }
  return nativeImage.createFromBuffer(canvas, { width: size, height: size, scaleFactor: 1 });
}

function createBlankIcon(): Electron.NativeImage {
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4, 0);
  return nativeImage.createFromBuffer(canvas, { width: size, height: size, scaleFactor: 1 });
}

function loadTrayImages() {
  const normal = loadTrayAsset('tray-icon.png') ?? createFallbackIcon(64, 158, 255);
  const alert = loadTrayAsset('tray-icon-alert.png') ?? createFallbackIcon(255, 140, 0);
  const blank = createBlankIcon();

  return {
    normal: normalizeTrayImage(normal),
    alert: normalizeTrayImage(alert),
    blank: normalizeTrayImage(blank),
  };
}

export class TrayManager {
  private tray: Tray | null = null;
  private images: ReturnType<typeof loadTrayImages> | null = null;
  private flashTimer: ReturnType<typeof setInterval> | null = null;
  private flashStopTimer: ReturnType<typeof setTimeout> | null = null;
  private flashPhase = false;
  private flashing = false;

  constructor(private readonly options: TrayManagerOptions) {}

  init() {
    if (this.tray) {
      return;
    }

    try {
      this.images = loadTrayImages();
      const labels = resolveMenuLabels(this.options.menuConfig);
      this.tray = new Tray(this.images.normal);
      this.tray.setToolTip(this.options.tooltip ?? app.getName());

      const contextMenu = Menu.buildFromTemplate([
        {
          label: labels.showMainWindow,
          click: () => this.handleUserActivate(),
        },
        { type: 'separator' },
        {
          label: labels.quit,
          click: () => this.options.onQuit(),
        },
      ]);

      this.tray.setContextMenu(contextMenu);
      this.tray.on('double-click', () => this.handleUserActivate());
      this.tray.on('click', () => this.handleUserActivate());

      console.info('[tray] System tray initialized.');
    }
    catch (error) {
      console.error('[tray] Failed to initialize system tray:', error);
    }
  }

  /** WeChat-style tray blink: alternate highlight icon and blank. */
  startFlashing(options: TrayFlashOptions = {}) {
    if (!this.tray || !this.images) {
      return;
    }

    const interval = options.interval ?? 500;
    this.stopFlashingTimers();

    this.flashing = true;
    this.flashPhase = true;
    this.tray.setImage(this.images.alert);
    this.options.onFlashStart?.();

    this.flashTimer = setInterval(() => {
      if (!this.tray || !this.images) {
        return;
      }
      this.flashPhase = !this.flashPhase;
      this.tray.setImage(this.flashPhase ? this.images.alert : this.images.blank);
    }, interval);

    const duration = options.duration ?? 0;
    if (duration > 0) {
      this.flashStopTimer = setTimeout(() => this.stopFlashing(), duration);
    }
  }

  stopFlashing() {
    if (!this.flashing && !this.flashTimer && !this.flashStopTimer) {
      return;
    }

    this.stopFlashingTimers();
    this.flashing = false;
    this.flashPhase = false;
    if (this.images) {
      this.tray?.setImage(this.images.normal);
    }
    this.options.onFlashStop?.();
  }

  isFlashing() {
    return this.flashing;
  }

  destroy() {
    this.stopFlashing();
    this.tray?.destroy();
    this.tray = null;
    this.images = null;
  }

  setTooltip(tooltip: string) {
    this.tray?.setToolTip(tooltip);
  }

  private handleUserActivate() {
    this.stopFlashing();
    this.options.showMainWindow();
  }

  private stopFlashingTimers() {
    if (this.flashTimer) {
      clearInterval(this.flashTimer);
      this.flashTimer = null;
    }
    if (this.flashStopTimer) {
      clearTimeout(this.flashStopTimer);
      this.flashStopTimer = null;
    }
  }
}
