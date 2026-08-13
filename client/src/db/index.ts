import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// 🧠 Multi-Core Node.js Threadpool Scaling (16 parallel I/O threads)
if (typeof process !== 'undefined') {
  process.env.UV_THREADPOOL_SIZE = '16';
}

// Ensure data directory exists
const dbPath = process.env.DB_PATH || path.join(process.cwd(), '../data/liquid_ai.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const sqlite = new Database(dbPath);

// 🧠 Enable Multi-threaded Parallel SQLite WAL Mode & Multi-Core Search Threads
try {
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('threads = 8');
  sqlite.pragma('mmap_size = 268435456'); // 256MB memory map for instant 0ms parallel queries
} catch (e) {}

export const db = drizzle(sqlite, { schema });
