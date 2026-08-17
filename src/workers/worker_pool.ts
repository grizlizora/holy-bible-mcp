import { Worker } from 'worker_threads';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { WorkerTask, WorkerProgress, WorkerResult } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveWorkerPath(): string | null {
  const candidates = [
    path.resolve(__dirname, './integrity_worker.js'),
    path.resolve(__dirname, './integrity_worker.mjs'),
    path.resolve(process.cwd(), 'build/workers/integrity_worker.js'),
    path.resolve(process.cwd(), 'src/workers/integrity_worker.ts'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

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

  private initWorker(): boolean {
    if (this.worker) return true;

    const workerPath = resolveWorkerPath();
    if (!workerPath || workerPath.endsWith('.ts')) {
      // In TypeScript dev environment without compiled worker JS, use in-process fallback
      return false;
    }

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
      return true;
    } catch (err) {
      console.warn('[INTEGRITY WORKER POOL] Worker spawn failed, falling back to in-process execution:', err);
      this.worker = null;
      return false;
    }
  }

  public async computeFileSha256(filePath: string, onProgress?: (p: WorkerProgress) => void): Promise<string> {
    const hasWorker = this.initWorker();

    if (hasWorker && this.worker) {
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

    // Direct In-Process Streaming Fallback
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stat = fs.statSync(filePath);
      const totalBytes = stat.size || 1;
      let bytesProcessed = 0;
      let lastReportedPercent = 0;
      const startTime = performance.now();

      const stream = fs.createReadStream(filePath, { highWaterMark: 4 * 1024 * 1024 });

      stream.on('data', (chunk) => {
        hash.update(chunk);
        bytesProcessed += chunk.length;
        const percent = Math.floor((bytesProcessed / totalBytes) * 100);
        if (percent >= lastReportedPercent + 10) {
          lastReportedPercent = percent;
          const elapsed = Math.max(0.001, (performance.now() - startTime) / 1000);
          onProgress?.({
            taskId: 'local',
            type: 'PROGRESS',
            bytesProcessed,
            totalBytes,
            percent,
            mbPerSec: Math.round((bytesProcessed / (1024 * 1024)) / elapsed)
          });
        }
      });

      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  public async verifyMerkleRoot(
    filePath: string,
    expectedRoot?: string,
    onProgress?: (p: WorkerProgress) => void
  ): Promise<{ matches: boolean; merkleRoot: string; elapsedMs: number }> {
    const hasWorker = this.initWorker();

    if (hasWorker && this.worker) {
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

    // Direct In-Process Merkle Tree Computation Fallback
    const startTime = performance.now();
    const chunkSize = 4 * 1024 * 1024;
    const chunkHashes: string[] = [];
    const stat = fs.statSync(filePath);
    const totalChunks = Math.ceil((stat.size || 1) / chunkSize);
    const buffer = Buffer.alloc(chunkSize);
    const fd = fs.openSync(filePath, 'r');

    try {
      for (let i = 0; i < totalChunks; i++) {
        const bytesRead = fs.readSync(fd, buffer, 0, chunkSize, i * chunkSize);
        const chunkData = bytesRead === chunkSize ? buffer : buffer.subarray(0, bytesRead);
        const chunkHash = crypto.createHash('sha256').update(chunkData).digest('hex');
        chunkHashes.push(chunkHash);
      }
    } finally {
      fs.closeSync(fd);
    }

    let currentLevel = chunkHashes;
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          const combined = crypto.createHash('sha256').update(currentLevel[i] + currentLevel[i + 1]).digest('hex');
          nextLevel.push(combined);
        } else {
          nextLevel.push(currentLevel[i]);
        }
      }
      currentLevel = nextLevel;
    }

    const calculatedMerkleRoot = currentLevel[0] || '';
    const elapsedMs = Math.round(performance.now() - startTime);

    return {
      matches: expectedRoot ? calculatedMerkleRoot.toLowerCase() === expectedRoot.toLowerCase() : true,
      merkleRoot: calculatedMerkleRoot,
      elapsedMs
    };
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
