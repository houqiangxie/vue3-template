import type { WebPreferences } from 'electron';

/** Shared renderer security defaults for main + child windows. */
export function createWebPreferences(
  preloadPath: string,
  overrides: Partial<WebPreferences> = {},
): WebPreferences {
  return {
    preload: preloadPath,
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    ...overrides,
  };
}
