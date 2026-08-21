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

export class BetterSqlitePool extends SqliteConnectionPool {
  constructor(initialPath: string) {
    super(initialPath);
  }
}

export const sqlitePool = new BetterSqlitePool(canOpenRealDb ? DB_PATH : ':memory:');

const queryCache = new Map<string, { data: any; expiresAt: number }>();
const MAX_CACHE_SIZE = 5000;
const DEFAULT_CACHE_TTL_MS = 600000;

export function getFromCache(key: string): any | undefined {
  const entry = queryCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    queryCache.delete(key);
    return undefined;
  }
  queryCache.delete(key);
  queryCache.set(key, entry);
  return entry.data;
}

export function saveToCache(key: string, data: any): void {
  if (queryCache.has(key)) {
    queryCache.delete(key);
  } else if (queryCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = queryCache.keys().next().value;
    if (oldestKey) queryCache.delete(oldestKey);
  }
  queryCache.set(key, { data, expiresAt: Date.now() + DEFAULT_CACHE_TTL_MS });
}

export function isDbReady(): boolean {
  if (sqlitePool.hasVerses()) return true;
  return sqlitePool.checkAndHotMount();
}

export function checkAndHotMountDb(): boolean {
  return sqlitePool.checkAndHotMount();
}
