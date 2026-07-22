/** Options for opening an Electron child window (renderer -> main). */
export interface OpenWindowOptions {
  /** Unique id — reuse focuses existing window instead of creating another. */
  id?: string;
  /** Route hash/path, full in-app URL, or absolute http(s) URL. */
  url: string;
  title?: string;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  modal?: boolean;
  resizable?: boolean;
  maximizable?: boolean;
  minimizable?: boolean;
  center?: boolean;
  /** Opaque payload forwarded to the child window on load. */
  data?: Record<string, unknown>;
}

export interface WindowActionResult {
  ok: boolean;
  windowId?: string;
  error?: string;
}

export interface WindowClosedPayload {
  windowId: string;
}
