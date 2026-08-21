/**
 * 🧵 Multi-threaded Integrity Worker Pool
 *
 * Pre-warmed background worker threads using Piscina for zero-overhead
 * SHA-256 and Merkle Tree verification.
 */
import { PiscinaWorkerPool } from './piscina_worker_pool.js';
export class IntegrityWorkerPool {
    static instance = null;
    piscinaPool;
    constructor() {
        this.piscinaPool = PiscinaWorkerPool.getInstance();
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new IntegrityWorkerPool();
        }
        return this.instance;
    }
    async computeFileSha256(filePath, onProgress) {
        return this.piscinaPool.computeFileSha256(filePath, onProgress);
    }
    async verifyMerkleRoot(filePath, expectedRoot, onProgress) {
        return this.piscinaPool.verifyMerkleRoot(filePath, expectedRoot, onProgress);
    }
    terminate() {
        this.piscinaPool.destroy().catch(() => { });
    }
}
