import { contextBridge, ipcRenderer } from 'electron';
import { INVOKE_CHANNELS, ON_CHANNELS, SEND_CHANNELS } from './ipc/channels';

function assertInvokeChannel(channel: string) {
  if (!INVOKE_CHANNELS.has(channel as never)) {
    throw new Error(`IPC invoke channel "${channel}" is not allowed`);
  }
}

function assertSendChannel(channel: string) {
  if (!SEND_CHANNELS.has(channel as never)) {
    throw new Error(`IPC send channel "${channel}" is not allowed`);
  }
}

function assertOnChannel(channel: string) {
  if (!ON_CHANNELS.has(channel as never)) {
    throw new Error(`IPC on channel "${channel}" is not allowed`);
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
    assertInvokeChannel(channel);
    return ipcRenderer.invoke(channel, ...args);
  },
  send(channel: string, ...args: unknown[]) {
    assertSendChannel(channel);
    ipcRenderer.send(channel, ...args);
  },
  on(channel: string, listener: (...args: unknown[]) => void) {
    assertOnChannel(channel);
    const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
      listener(...args);
    };
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
});
