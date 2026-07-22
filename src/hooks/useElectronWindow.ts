import { onMounted, onUnmounted, ref } from 'vue';
import { IPC_EVENTS, electronIpc, ipcOn, isElectron } from '@/utils/electron';
import type { OpenWindowOptions, WindowActionResult } from '@/types/ipc';

export interface WindowInitDataPayload {
  windowId: string;
  data: Record<string, unknown>;
}

export interface WindowReadyPayload {
  windowId: string;
}

export interface WindowClosedPayload {
  windowId: string;
}

/**
 * Open/manage Electron child windows from the renderer.
 * In the browser this falls back to `window.open`.
 */
export function useElectronWindow() {
  const windowId = ref<string>();
  const initData = ref<Record<string, unknown>>();

  let offInitData: (() => void) | undefined;
  let offReady: (() => void) | undefined;

  onMounted(() => {
    if (!isElectron()) {
      return;
    }

    offInitData = ipcOn(IPC_EVENTS.WINDOW_INIT_DATA, (payload) => {
      const { windowId: id, data } = payload as WindowInitDataPayload;
      windowId.value = id;
      initData.value = data;
    });

    offReady = ipcOn(IPC_EVENTS.WINDOW_READY, (payload) => {
      const { windowId: id } = payload as WindowReadyPayload;
      windowId.value = id;
    });
  });

  onUnmounted(() => {
    offInitData?.();
    offReady?.();
  });

  async function openWindow(options: OpenWindowOptions): Promise<WindowActionResult | undefined> {
    if (!isElectron()) {
      const target = options.url.startsWith('http') ? options.url : `#${options.url.replace(/^\/?#?/, '')}`;
      window.open(target, options.id ?? '_blank');
      return { ok: true };
    }
    return electronIpc.window.open(options);
  }

  async function openRoute(
    route: string,
    options: Omit<OpenWindowOptions, 'url'> = {},
  ): Promise<WindowActionResult | undefined> {
    return openWindow({ ...options, url: route });
  }

  async function openModal(
    route: string,
    options: Omit<OpenWindowOptions, 'url' | 'modal'> = {},
  ): Promise<WindowActionResult | undefined> {
    return openWindow({
      ...options,
      url: route,
      modal: true,
      width: options.width ?? 720,
      height: options.height ?? 520,
      resizable: options.resizable ?? false,
    });
  }

  async function closeWindow(id?: string) {
    const targetId = id ?? windowId.value;
    if (!targetId || !isElectron()) {
      return undefined;
    }
    return electronIpc.window.closeChild(targetId);
  }

  async function fetchInitData(id?: string) {
    const targetId = id ?? windowId.value;
    if (!targetId || !isElectron()) {
      return null;
    }
    return electronIpc.window.getInitData(targetId);
  }

  function onWindowClosed(listener: (payload: WindowClosedPayload) => void) {
    return ipcOn(IPC_EVENTS.WINDOW_CLOSED, listener as (...args: unknown[]) => void);
  }

  return {
    windowId,
    initData,
    openWindow,
    openRoute,
    openModal,
    closeWindow,
    fetchInitData,
    onWindowClosed,
  };
}
