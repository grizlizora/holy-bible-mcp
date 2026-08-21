/**
 * 🏊 SqliteConnectionPool (sqlite_connection_pool.ts)
 * 
 * Connection pooling & statement dispatching for SQLite.
 * Features multi-connection read pool support with GenericSqlitePool, statement compiling,
 * and hot-mount capabilities for runtime database swap.
 */

import Database from 'better-sqlite3';
import { SqliteConnectionFactory } from './sqlite_connection_factory.js';
import { StatementCompiler } from './statement_compiler.js';
import { AuxDatabaseManager } from '../auxiliary/aux_database_manager.js';
import { WalCheckpointManager } from './wal_checkpoint_manager.js';
import { GenericSqlitePool } from './generic_sqlite_pool.js';

export class SqliteConnectionPool {
  private mainDb: Database.Database;
  private hasVersesTable = false;
  private compiler = new StatementCompiler();
  private walManager = new WalCheckpointManager();
  private activeQueries = 0;
  private currentDbPath: string;
  private readPool: GenericSqlitePool;

  constructor(initialPath: string) {
    this.currentDbPath = initialPath;
    const { instance, hasVerses } = SqliteConnectionFactory.createInstance(initialPath);
    this.mainDb = instance;
    this.hasVersesTable = hasVerses;
    this.readPool = new GenericSqlitePool(initialPath, { min: 2, max: 8 });
  }

  public getRawDb(): Database.Database {
    return this.mainDb;
  }

  public getReadPool(): GenericSqlitePool {
    return this.readPool;
  }

  public hasVerses(): boolean {
    return this.hasVersesTable;
  }

  public prepare(sql: string, isAux = false): Database.Statement {
    const targetDb = isAux ? AuxDatabaseManager.getAuxDb() : this.mainDb;
    return this.compiler.getOrCompile(targetDb, sql, isAux ? 'aux' : 'main');
  }

  /**
   * Synchronous query with statement caching
   */
  public query<T = any>(sql: string, params: any[] = []): T[] {
    const isAux = sql.includes('commentaries') || sql.includes('semantic_concepts');
    if (!isAux && !this.hasVerses() && (sql.includes('FROM verses') || sql.includes('verses_fts'))) {
      this.checkAndHotMount();
      if (!this.hasVerses()) return [];
    }

    this.activeQueries++;
    try {
      const stmt = this.prepare(sql, isAux);
      return stmt.all(...params) as T[];
    } catch (err: any) {
      if (err.message?.includes('no such table')) return [];
      console.error('[DATABASE ENGINE] Query error:', err.message);
      return [];
    } finally {
      this.activeQueries = Math.max(0, this.activeQueries - 1);
    }
  }

  /**
   * Synchronous single-row fetch with statement caching
   */
  public get<T = any>(sql: string, params: any[] = []): T | undefined {
    const isAux = sql.includes('commentaries') || sql.includes('semantic_concepts');
    if (!isAux && !this.hasVerses() && (sql.includes('FROM verses') || sql.includes('verses_fts'))) {
      this.checkAndHotMount();
      if (!this.hasVerses()) return undefined;
    }

    this.activeQueries++;
    try {
      const stmt = this.prepare(sql, isAux);
      return stmt.get(...params) as T | undefined;
    } catch (err: any) {
      if (err.message?.includes('no such table')) return undefined;
      console.error('[DATABASE ENGINE] Get error:', err.message);
      return undefined;
    } finally {
      this.activeQueries = Math.max(0, this.activeQueries - 1);
    }
  }

  /**
   * Asynchronous pool query using multi-connection reader
   */
  public async queryPool<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return this.readPool.withReadConnection((_db, prepare) => {
      const stmt = prepare(sql);
      return stmt.all(...params) as T[];
    });
  }

  /**
   * Asynchronous pool get using multi-connection reader
   */
  public async getPool<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return this.readPool.withReadConnection((_db, prepare) => {
      const stmt = prepare(sql);
      return stmt.get(...params) as T | undefined;
    });
  }

  public checkAndHotMount(): boolean {
    if (this.hasVersesTable) return true;
    if (this.walManager.shouldAttemptHotMount()) {
      try {
        const { valid, dbPath } = this.walManager.checkRealDbPath();
        if (valid) {
          const oldDb = this.mainDb;
          const { instance, hasVerses } = SqliteConnectionFactory.createInstance(dbPath);
          this.mainDb = instance;
          this.hasVersesTable = hasVerses;
          this.currentDbPath = dbPath;
          this.compiler.clear();
          this.readPool.updatePath(dbPath);

          if (oldDb && typeof oldDb.close === 'function') {
            setTimeout(() => {
              try { oldDb.close(); } catch (_) {}
            }, 1000).unref?.();
          }
          return true;
        }
      } catch (err: any) {
        console.error('[DATABASE ENGINE] Hot-mount error:', err.message);
      }
    }
    return false;
  }

  public async drainAndClose(timeoutMs = 3000): Promise<void> {
    const start = Date.now();
    while (this.activeQueries > 0 && Date.now() - start < timeoutMs) {
      await new Promise(r => setTimeout(r, 20));
    }
    try {
      this.compiler.clear();
      await this.readPool.drainAndClose();
      this.mainDb.close();
    } catch (_) {}
  }
}
