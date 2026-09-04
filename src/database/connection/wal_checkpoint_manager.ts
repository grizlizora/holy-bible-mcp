/**
 * 🔄 WalCheckpointManager — Handles hot-mounting real database files and running WAL checkpoints
 */

import fs from 'fs';
import { resolveDbPath, isValidDb } from '../database_downloader.js';

export class WalCheckpointManager {
  private lastCheckTime = 0;

  public checkRealDbPath(): { valid: boolean; dbPath: string } {
    const dbPath = resolveDbPath();
    try {
      if (isValidDb(dbPath)) {
        fs.accessSync(dbPath, fs.constants.R_OK);
        return { valid: true, dbPath };
      }
    } catch (_) {}
    return { valid: false, dbPath };
  }

  public shouldAttemptHotMount(): boolean {
    const now = Date.now();
    if (now - this.lastCheckTime < 2500) return false;
    this.lastCheckTime = now;
    return this.checkRealDbPath().valid;
  }

  /**
   * 🧹 Executes PRAGMA wal_checkpoint on an active SQLite connection
   * @param dbInstance better-sqlite3 database instance
   * @param mode 'PASSIVE' | 'TRUNCATE' | 'RESTART'
   */
  public executeWalCheckpoint(dbInstance: any, mode: 'PASSIVE' | 'TRUNCATE' | 'RESTART' = 'PASSIVE'): { busy: number; log: number; checkpointed: number } | null {
    if (!dbInstance || typeof dbInstance.pragma !== 'function') return null;
    try {
      const res = dbInstance.pragma(`wal_checkpoint(${mode})`, { simple: false });
      return res && res[0] ? res[0] : null;
    } catch (err: any) {
      console.warn(`[WAL-CHECKPOINT] Warning during checkpoint (${mode}):`, err?.message || err);
      return null;
    }
  }
}
