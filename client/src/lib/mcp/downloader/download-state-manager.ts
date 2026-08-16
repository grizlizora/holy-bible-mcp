export interface DownloadState {
  isDownloading: boolean;
  isPaused: boolean;
  isVerifying: boolean;
  verificationStatus: string | null;
  progressPercent: number;
  downloadedBytes: number;
  totalBytes: number;
  speedBytesPerSec: number;
  smoothSpeedBytesPerSec: number;
  etaSeconds: number | null;
  etaFormatted: string;
  activeMirror: string | null;
  isComplete: boolean;
  error: string | null;
}

const downloadStates = new Map<string, DownloadState>();
const abortControllers = new Map<string, AbortController>();

export function getDownloadState(mcpId: string): DownloadState {
  if (!downloadStates.has(mcpId)) {
    downloadStates.set(mcpId, {
      isDownloading: false,
      isPaused: false,
      isVerifying: false,
      verificationStatus: null,
      progressPercent: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      speedBytesPerSec: 0,
      smoothSpeedBytesPerSec: 0,
      etaSeconds: null,
      etaFormatted: '',
      activeMirror: null,
      isComplete: false,
      error: null
    });
  }
  return downloadStates.get(mcpId)!;
}

export function getAbortController(mcpId: string): AbortController | undefined {
  return abortControllers.get(mcpId);
}

export function setAbortController(mcpId: string, controller: AbortController): void {
  abortControllers.set(mcpId, controller);
}

export function deleteAbortController(mcpId: string): void {
  abortControllers.delete(mcpId);
}
