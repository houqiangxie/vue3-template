import { ipcMain } from 'electron';
import type { IpcHandlerContext } from './handlers';
import { createIpcHandlers } from './handlers';

/** Register all handlers from the central registry. */
export function registerIpcHandlers(ctx: IpcHandlerContext) {
  const handlers = createIpcHandlers(ctx);

  for (const [channel, handler] of Object.entries(handlers)) {
    ipcMain.handle(channel, (event, ...args) => handler(ctx, event, ...args));
  }
}
