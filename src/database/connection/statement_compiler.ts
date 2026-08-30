/**
 * ⚡ StatementCompiler — Pre-compiles and caches SQLite prepared statements with LRU eviction
 */

import Database from 'better-sqlite3';

export class StatementCompiler {
  private stmtCache = new Map<string, Database.Statement>();
  private readonly maxCacheSize = 200;

  public getOrCompile(db: Database.Database, sql: string, prefix = 'main'): Database.Statement {
    const key = `${prefix}:${sql}`;
    let stmt = this.stmtCache.get(key);
    if (stmt) {
      this.stmtCache.delete(key);
      this.stmtCache.set(key, stmt);
      return stmt;
    }

    if (this.stmtCache.size >= this.maxCacheSize) {
      const oldestKey = this.stmtCache.keys().next().value;
      if (oldestKey) this.stmtCache.delete(oldestKey);
    }
    stmt = db.prepare(sql);
    this.stmtCache.set(key, stmt);
    return stmt;
  }


  public clear(): void {
    this.stmtCache.clear();
  }
}
