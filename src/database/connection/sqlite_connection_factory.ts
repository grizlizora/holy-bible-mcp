/**
 * 🏭 SqliteConnectionFactory — Initializes and configures high-performance SQLite instances
 */

import Database from 'better-sqlite3';
import fs from 'fs';

export class SqliteConnectionFactory {
  public static configurePragmas(instance: Database.Database, isReadOnly: boolean): void {
    try {
      instance.pragma('busy_timeout = 5000');
      instance.pragma('temp_store = MEMORY');
      instance.pragma('cache_size = -64000'); // 64 MB
      instance.pragma('mmap_size = 2147483648'); // 2 GB Zero-Copy Memory-Mapped I/O
      instance.pragma('threads = 4');
      instance.pragma('synchronous = NORMAL');
      instance.pragma('read_uncommitted = 1');
      if (isReadOnly) {
        instance.pragma('query_only = ON');
      }
    } catch (err: any) {
      console.error('[DATABASE FACTORY] Warning applying pragmas:', err.message);
    }
  }

  public static createInstance(dbPath: string): { instance: Database.Database; hasVerses: boolean } {
    const fileExists = dbPath !== ':memory:' && fs.existsSync(dbPath);
    let instance: Database.Database;
    let hasVerses = false;

    try {
      if (fileExists) {
        instance = new Database(dbPath, { readonly: true, fileMustExist: false });
        this.configurePragmas(instance, true);
        try {
          const row = instance.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='verses'").get();
          hasVerses = !!row;
        } catch {
          hasVerses = false;
        }
      } else {
        instance = new Database(':memory:');
        this.configurePragmas(instance, false);
      }
    } catch (err: any) {
      console.error(`[DATABASE FACTORY] Error opening ${dbPath}:`, err.message);
      instance = new Database(':memory:');
      this.configurePragmas(instance, false);
    }

    return { instance, hasVerses };
  }
}
