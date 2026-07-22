export type UpdatePhase =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error';

export interface UpdateProgress {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
}

export interface UpdateStatusPayload {
  phase: UpdatePhase;
  currentVersion?: string;
  version?: string;
  releaseNotes?: string | null;
  progress?: UpdateProgress;
  error?: string;
}

export interface UpdateActionResult {
  ok: boolean;
  reason?: string;
}
