import { Piscina } from "piscina";
import os from "os";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { computeFileSha256Task, verifyMerkleRootTask } from "./integrity_tasks.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function resolveWorkerPath() {
    const candidates = [
        path.resolve(__dirname, "./integrity_worker.js"),
        path.resolve(__dirname, "./integrity_worker.mjs"),
        path.resolve(process.cwd(), "build/workers/integrity_worker.js"),
        path.resolve(process.cwd(), "src/workers/integrity_worker.js"),
    ];
    for (const c of candidates) {
        if (fs.existsSync(c))
            return c;
    }
    return null;
}
export class PiscinaWorkerPool {
    static instance = null;
    piscina = null;
    constructor() {
        const workerPath = resolveWorkerPath();
        if (workerPath && !workerPath.endsWith(".ts")) {
            try {
                this.piscina = new Piscina({
                    filename: workerPath,
                    minThreads: 0, // Lazy thread allocation: 0 threads when idle to save RAM
                    maxThreads: Math.max(2, Math.min(os.availableParallelism ? os.availableParallelism() : os.cpus().length, 8)),
                    idleTimeout: 15000
                });
            }
            catch (err) {
                console.error("[PISCINA POOL] Warning initializing thread pool:", err.message);
                this.piscina = null;
            }
        }
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new PiscinaWorkerPool();
        }
        return this.instance;
    }
    async computeFileSha256(filePath, onProgress) {
        if (this.piscina) {
            try {
                const taskId = `sha_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                const res = await this.piscina.run({ id: taskId, type: "CALCULATE_SHA256", filePath });
                if (res && res.sha256) {
                    return res.sha256;
                }
            }
            catch (_) {
                // Fallback to task function
            }
        }
        return computeFileSha256Task(filePath);
    }
    async verifyMerkleRoot(filePath, expectedRoot, onProgress) {
        if (this.piscina) {
            try {
                const taskId = `merkle_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                const res = await this.piscina.run({
                    id: taskId,
                    type: "VERIFY_MERKLE",
                    filePath,
                    expectedHash: expectedRoot
                });
                if (res && res.success) {
                    return {
                        matches: Boolean(res.matches),
                        merkleRoot: res.merkleRoot || "",
                        elapsedMs: res.elapsedMs || 0
                    };
                }
            }
            catch (_) {
                // Fallback to task function
            }
        }
        return verifyMerkleRootTask(filePath, expectedRoot);
    }
    async destroy() {
        if (this.piscina) {
            await this.piscina.destroy();
            this.piscina = null;
        }
        PiscinaWorkerPool.instance = null;
    }
}
