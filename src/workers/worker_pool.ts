import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import { WorkerTask, WorkerProgress, WorkerResult } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerPath = path.resolve(__dirname, './integrity_worker.js');

export class IntegrityWorkerPool {
  private static instance: IntegrityWorkerPool | null = null;
  private worker: Worker | null = null;
  private pendingTasks = new Map<string, {
    resolve: (val: any) => void;
    reject: (err: any) => void;
    onProgress?: (p: WorkerProgress) => void;
  }>();

  public static getInstance(): IntegrityWorkerPool {
    if (!this.instance) {
      this.instance = new IntegrityWorkerPool();
    }
    return this.instance;
  }

  private initWorker(): void {
    if (!this.worker) {
      try {
        this.worker = new Worker(workerPath);
        this.worker.on('message', (msg: WorkerProgress | WorkerResult) => {
          const handler = this.pendingTasks.get(msg.taskId);
          if (!handler) return;

          if (msg.type === 'PROGRESS') {
            handler.onProgress?.(msg);
          } else if (msg.type === 'RESULT') {
            this.pendingTasks.delete(msg.taskId);
            if (msg.success) {
              handler.resolve(msg);
            } else {
              handler.reject(new Error(msg.error || 'Worker task failed'));
            }
          }
        });

        this.worker.on('error', (err) => {
          console.error('[INTEGRITY WORKER POOL ERROR]', err);
          for (const [taskId, task] of this.pendingTasks.entries()) {
            task.reject(err);
          }
          this.pendingTasks.clear();
        });

        this.worker.on('exit', (code) => {
          if (code !== 0) {
            console.error(`[INTEGRITY WORKER POOL] Worker exited with code ${code}`);
            const exitErr = new Error(`Worker thread exited unexpectedly with code ${code}`);
            for (const [taskId, task] of this.pendingTasks.entries()) {
              task.reject(exitErr);
            }
            this.pendingTasks.clear();
          }
          this.worker = null;
        });
      } catch (err) {
        console.error('[INTEGRITY WORKER POOL] Failed to spawn worker thread:', err);
      }
    }
  }

  public async computeFileSha256(filePath: string, onProgress?: (p: WorkerProgress) => void): Promise<string> {
    this.initWorker();
    if (!this.worker) throw new Error('Worker thread is not available');

    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    return new Promise((resolve, reject) => {
      this.pendingTasks.set(taskId, {
        resolve: (res: WorkerResult) => resolve(res.sha256 || ''),
        reject,
        onProgress
      });
      this.worker!.postMessage({ id: taskId, type: 'CALCULATE_SHA256', filePath } as WorkerTask);
    });
  }

  public async verifyMerkleRoot(
    filePath: string,
    expectedRoot?: string,
    onProgress?: (p: WorkerProgress) => void
  ): Promise<{ matches: boolean; merkleRoot: string; elapsedMs: number }> {
    this.initWorker();
    if (!this.worker) throw new Error('Worker thread is not available');

    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    return new Promise((resolve, reject) => {
      this.pendingTasks.set(taskId, {
        resolve: (res: WorkerResult) => resolve({
          matches: Boolean(res.matches),
          merkleRoot: res.merkleRoot || '',
          elapsedMs: res.elapsedMs || 0
        }),
        reject,
        onProgress
      });
      this.worker!.postMessage({ id: taskId, type: 'VERIFY_MERKLE', filePath, expectedHash: expectedRoot } as WorkerTask);
    });
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      for (const [taskId, task] of this.pendingTasks.entries()) {
        task.reject(new Error('Worker terminated'));
      }
      this.pendingTasks.clear();
    }
  }
}
