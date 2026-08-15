export interface WorkerTask {
  id: string;
  type: 'CALCULATE_SHA256' | 'VERIFY_MERKLE' | 'SQLITE_INTEGRITY_CHECK';
  filePath: string;
  expectedHash?: string;
  chunkSizeBytes?: number;
}

export interface WorkerProgress {
  taskId: string;
  type: 'PROGRESS';
  bytesProcessed: number;
  totalBytes: number;
  percent: number;
  mbPerSec: number;
}

export interface WorkerResult {
  taskId: string;
  type: 'RESULT';
  success: boolean;
  sha256?: string;
  merkleRoot?: string;
  matches?: boolean;
  elapsedMs: number;
  error?: string;
}
