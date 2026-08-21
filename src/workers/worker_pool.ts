/**
 * 🧵 Multi-threaded Integrity Worker Pool
 * 
 * Pre-warmed background worker threads using Piscina for zero-overhead
 * SHA-256 and Merkle Tree verification.
 */

import { WorkerProgress } from './types.js';
import { MerkleVerificationResult } from './integrity_tasks.js';
import { PiscinaWorkerPool } from './piscina_worker_pool.js';

export class IntegrityWorkerPool {
  private static instance: IntegrityWorkerPool | null = null;
  private piscinaPool: PiscinaWorkerPool;

  constructor() {
    this.piscinaPool = PiscinaWorkerPool.getInstance();
  }

  public static getInstance(): IntegrityWorkerPool {
    if (!this.instance) {
      this.instance = new IntegrityWorkerPool();
    }
    return this.instance;
  }

  public async computeFileSha256(filePath: string, onProgress?: (p: WorkerProgress) => void): Promise<string> {
    return this.piscinaPool.computeFileSha256(filePath, onProgress);
  }

  public async verifyMerkleRoot(
    filePath: string,
    expectedRoot?: string,
    onProgress?: (p: WorkerProgress) => void
  ): Promise<MerkleVerificationResult> {
    return this.piscinaPool.verifyMerkleRoot(filePath, expectedRoot, onProgress);
  }

  public terminate(): void {
    this.piscinaPool.destroy().catch(() => {});
  }
}
