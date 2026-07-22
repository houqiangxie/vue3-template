export interface ElectronAPI {
  platform: NodeJS.Platform;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
  invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>;
  send: (channel: string, ...args: unknown[]) => void;
  on: (channel: string, listener: (...args: unknown[]) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
