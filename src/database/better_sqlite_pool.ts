/**
 * ⚡ BetterSqlitePool — Clean modular facade delegating to Connection Pool, Factory & Aux Manager
 */

import { resolveDbPath, isValidDb } from './database_downloader.js';
import { SqliteConnectionFactory } from './connection/sqlite_connection_factory.js';
import { SqliteConnectionPool } from './connection/sqlite_connection_pool.js';
import { AuxDatabaseManager } from './auxiliary/aux_database_manager.js';
import fs from 'fs';

export let DB_PATH = resolveDbPath();

export function checkRealDbPath(): boolean {
  DB_PATH = resolveDbPath();
  try {
    if (isValidDb(DB_PATH)) {
      fs.accessSync(DB_PATH, fs.constants.R_OK);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

const canOpenRealDb = checkRealDbPath();

export const auxDbInstance = AuxDatabaseManager.getAuxDb();

export function configureBetterPragmas(instance: any, isReadOnly: boolean): void {
  SqliteConnectionFactory.configurePragmas(instance, isReadOnly);
}

export function createBetterDbInstance(dbPath: string): any {
  return SqliteConnectionFactory.createInstance(dbPath).instance;
}

import { LRUCache } from 'lru-cache';

export class BetterSqlitePool extends SqliteConnectionPool {
  constructor(initialPath: string) {
    super(initialPath);
  }
}

export const sqlitePool = new BetterSqlitePool(canOpenRealDb ? DB_PATH : ':memory:');

const queryCache = new LRUCache<string, any>({
  max: 3000,
  maxSize: 64 * 1024 * 1024, // 64 MB maximum cache footprint
  sizeCalculation: (value) => {
    if (Array.isArray(value)) {
      return value.length * 256;
    }
    return 1024;
  },
  ttl: 600000 // 10 minutes
});

export function getFromCache(key: string): any | undefined {
  return queryCache.get(key);
}

export function saveToCache(key: string, data: any): void {
  // Never cache empty arrays (prevents caching temporary lock/busy failures)
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return;
  }
  queryCache.set(key, data);
}

export function clearQueryCache(): void {
  queryCache.clear();
}

export function isDbReady(): boolean {
  if (sqlitePool.hasVerses()) return true;
  return sqlitePool.checkAndHotMount();
}

export function checkAndHotMountDb(): boolean {
  return sqlitePool.checkAndHotMount();
}

export function onDatabaseMounted(cb: (dbPath: string) => void): () => void {
  return SqliteConnectionPool.onMounted(cb);
}

export function offDatabaseMounted(cb: (dbPath: string) => void): void {
  SqliteConnectionPool.offMounted(cb);
}

