/**
 * 🔄 WalCheckpointManager — Handles hot-mounting real database files and running WAL checkpoints
 */
import fs from 'fs';
import { resolveDbPath, isValidDb } from '../database_downloader.js';
export class WalCheckpointManager {
    lastCheckTime = 0;
    checkRealDbPath() {
        const dbPath = resolveDbPath();
        try {
            if (isValidDb(dbPath)) {
                fs.accessSync(dbPath, fs.constants.R_OK);
                return { valid: true, dbPath };
            }
        }
        catch (_) { }
        return { valid: false, dbPath };
    }
    shouldAttemptHotMount() {
        const now = Date.now();
        if (now - this.lastCheckTime < 2500)
            return false;
        this.lastCheckTime = now;
        return this.checkRealDbPath().valid;
    }
    /**
     * 🧹 Executes PRAGMA wal_checkpoint on an active SQLite connection
     * @param dbInstance better-sqlite3 database instance
     * @param mode 'PASSIVE' | 'TRUNCATE' | 'RESTART'
     */
    executeWalCheckpoint(dbInstance, mode = 'PASSIVE') {
        if (!dbInstance || typeof dbInstance.pragma !== 'function')
            return null;
        try {
            const res = dbInstance.pragma(`wal_checkpoint(${mode})`, { simple: false });
            return res && res[0] ? res[0] : null;
        }
        catch (err) {
            console.warn(`[WAL-CHECKPOINT] Warning during checkpoint (${mode}):`, err?.message || err);
            return null;
        }
    }
}
