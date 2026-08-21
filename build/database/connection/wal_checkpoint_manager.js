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
}
