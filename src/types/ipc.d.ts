import type { IpcChannel } from '../../../electron/ipc/channels';
import type { ShowNotificationOptions } from '../../../electron/notification/types';
import type { UpdateActionResult, UpdateStatusPayload } from '../../../electron/updater/types';
import type { OpenWindowOptions, WindowActionResult } from '../../../electron/window/types';

/** Typed IPC contracts — optional, only for TypeScript hints in the renderer. */
export interface IpcInvokeMap {
  'app:ping': {
    args: [message?: string];
    result: { ok: boolean; message: string; timestamp: number };
  };
  'app:get-version': {
    args: [];
    result: string;
  };
  'app:get-platform': {
    args: [];
    result: NodeJS.Platform;
  };
  'app:open-external': {
    args: [url: string];
    result: void;
  };
  'window:minimize': {
    args: [];
    result: void;
  };
  'window:maximize': {
    args: [];
    result: void;
  };
  'window:close': {
    args: [];
    result: void;
  };
  'window:open': {
    args: [options: OpenWindowOptions];
    result: WindowActionResult;
  };
  'window:close-child': {
    args: [windowId: string];
    result: WindowActionResult;
  };
  'window:close-all': {
    args: [];
    result: { ok: boolean };
  };
  'window:get-init-data': {
    args: [windowId: string];
    result: Record<string, unknown> | null;
  };
  'notification:show': {
    args: [options: ShowNotificationOptions];
    result: { ok: boolean; scheduled?: boolean };
  };
  'tray:set-tooltip': {
    args: [tooltip: string];
    result: void;
  };
  'tray:flash-start': {
    args: [options?: { interval?: number; duration?: number }];
    result: { ok: boolean };
  };
  'tray:flash-stop': {
    args: [];
    result: { ok: boolean };
  };
  'update:check': {
    args: [];
    result: UpdateActionResult;
  };
  'update:download': {
    args: [];
    result: UpdateActionResult;
  };
  'update:install': {
    args: [];
    result: UpdateActionResult;
  };
  'update:get-status': {
    args: [];
    result: UpdateStatusPayload;
  };
}

export type TypedIpcChannel = keyof IpcInvokeMap & IpcChannel;

export type {
  OpenWindowOptions,
  ShowNotificationOptions,
  UpdateActionResult,
  UpdateStatusPayload,
  WindowActionResult,
};
