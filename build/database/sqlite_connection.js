import sqlite3 from "sqlite3";
import fs from "fs";
import os from "os";
import { resolveDbPath, isValidDb } from "./database_downloader.js";
export const DB_PATH = resolveDbPath();
// 🧠 Hardware-Aware CPU/RAM/VRAM Optimization Engine (Calibrated for 5.88 GB Database)
const totalRamGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));
const cpuCores = os.cpus().length || 4;
const arch = os.arch();
let cacheSizeKb = -256000; // 256MB RAM cache default
let mmapSizeBytes = 1073741824; // 1GB Memory-Mapped I/O default
if (totalRamGB >= 32) {
    cacheSizeKb = -1024000; // 1GB RAM cache on ultra-high RAM systems (>=32GB)
    mmapSizeBytes = 4294967296; // 4GB Memory-Mapped I/O
}
else if (totalRamGB >= 16) {
    cacheSizeKb = -512000; // 512MB RAM cache on high RAM systems (16GB-32GB)
    mmapSizeBytes = 2147483648; // 2GB Memory-Mapped I/O
}
else if (totalRamGB < 8) {
    cacheSizeKb = -32000; // 32MB RAM cache on low memory devices (<8GB)
    mmapSizeBytes = 0; // Disable MMAP to protect low RAM devices
}
let canOpenRealDb = false;
try {
    if (isValidDb(DB_PATH)) {
        fs.accessSync(DB_PATH, fs.constants.R_OK);
        canOpenRealDb = true;
    }
}
catch {
    canOpenRealDb = false;
}
let dbHasVersesTable = false;
function initDb() {
    let instance;
    try {
        instance = new sqlite3.Database(canOpenRealDb ? DB_PATH : ':memory:', (err) => {
            if (err) {
                console.error("[DATABASE ENGINE] Warning: SQLite connection error:", err.message);
                dbHasVersesTable = false;
                return;
            }
            if (canOpenRealDb) {
                instance.get("SELECT name FROM sqlite_master WHERE type='table' AND name='verses'", (e, row) => {
                    if (!e && row) {
                        dbHasVersesTable = true;
                    }
                    else {
                        dbHasVersesTable = false;
                    }
                });
            }
        });
    }
    catch {
        instance = new sqlite3.Database(':memory:');
        dbHasVersesTable = false;
    }
    instance.serialize(() => {
        try {
            instance.run("PRAGMA busy_timeout = 5000;");
            instance.run("PRAGMA journal_mode = WAL;");
            instance.run("PRAGMA synchronous = NORMAL;");
            instance.run(`PRAGMA cache_size = ${cacheSizeKb};`);
            instance.run(`PRAGMA mmap_size = ${mmapSizeBytes};`);
            instance.run("PRAGMA temp_store = MEMORY;");
            instance.run("PRAGMA threads = 4;");
            instance.run(`CREATE TABLE IF NOT EXISTS commentaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book TEXT,
        chapter INTEGER,
        verse INTEGER,
        author TEXT,
        commentary_text TEXT
      );`);
            instance.run(`CREATE TABLE IF NOT EXISTS semantic_concepts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        concept_name TEXT,
        keywords TEXT,
        book TEXT,
        chapter INTEGER,
        verse INTEGER,
        theological_principle TEXT
      );`);
            instance.get("SELECT COUNT(*) as cnt FROM commentaries", (err, row) => {
                if (!err && row && row.cnt === 0) {
                    instance.run(`INSERT INTO commentaries (book, chapter, verse, author, commentary_text) VALUES 
          ('JN', 3, 16, 'John Chrysostom', 'God so loved the world that He gave His only begotten Son. This is the supreme demonstration of sacrificial covenantal love (Agape).'),
          ('JN', 3, 16, 'Matthew Henry', 'Faith in Christ is the single divine means of salvation from eternal ruin and receiving everlasting life.'),
          ('PS', 23, 1, 'Ivan Ohiyenko', 'The Pastoral Psalm expresses absolute trust in God as the Caring Shepherd during times of testing.');`);
                }
            });
            instance.get("SELECT COUNT(*) as cnt FROM semantic_concepts", (err, row) => {
                if (!err && row && row.cnt === 0) {
                    instance.run(`INSERT INTO semantic_concepts (concept_name, keywords, book, chapter, verse, theological_principle) VALUES 
          ('anxiety', 'anxiety fear worry care distress', 'PHP', 4, 6, 'Be anxious for nothing, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.'),
          ('loneliness', 'lonely abandoned isolated alone', 'PS', 27, 10, 'When my father and my mother forsake me, then the Lord will take me up.'),
          ('financial trials', 'money debt poverty scarcity risk', 'PROV', 13, 11, 'Wealth gained hastily will dwindle, but whoever gathers little by little will increase it.'),
          ('forgiveness', 'offense anger forgive enemy grudge', 'EPH', 4, 32, 'Be kind to one another, tenderhearted, forgiving one another, even as God in Christ forgave you.');`);
                }
            });
        }
        catch { }
    });
    return instance;
}
export const db = initDb();
// Fast In-Memory Bounded O(1) QuickLRU Cache with 10-minute TTL (Up to 5,000 cached queries)
const queryCache = new Map();
const MAX_CACHE_SIZE = 5000;
const DEFAULT_CACHE_TTL_MS = 600000;
export function getFromCache(key) {
    const entry = queryCache.get(key);
    if (!entry)
        return undefined;
    if (Date.now() > entry.expiresAt) {
        queryCache.delete(key);
        return undefined;
    }
    queryCache.delete(key);
    queryCache.set(key, entry);
    return entry.data;
}
export function saveToCache(key, data) {
    if (queryCache.has(key)) {
        queryCache.delete(key);
    }
    else if (queryCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = queryCache.keys().next().value;
        if (oldestKey)
            queryCache.delete(oldestKey);
    }
    queryCache.set(key, { data, expiresAt: Date.now() + DEFAULT_CACHE_TTL_MS });
}
export function isDbReady() {
    return dbHasVersesTable;
}
export async function queryDb(sql, params = [], maxRetries = 3) {
    if (!dbHasVersesTable && (sql.includes('FROM verses') || sql.includes('verses_fts'))) {
        return [];
    }
    const cacheKey = `${sql}::${JSON.stringify(params)}`;
    const cached = getFromCache(cacheKey);
    if (cached !== undefined) {
        return cached;
    }
    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            const rows = await new Promise((resolve, reject) => {
                db.all(sql, params, (err, rows) => {
                    if (err)
                        return reject(err);
                    resolve(rows || []);
                });
            });
            saveToCache(cacheKey, rows);
            return rows;
        }
        catch (err) {
            const isLocked = err.message?.includes('SQLITE_BUSY') || err.message?.includes('database is locked') || err.message?.includes('SQLITE_LOCKED');
            if (isLocked && attempt < maxRetries) {
                attempt++;
                const backoffMs = Math.pow(2, attempt) * 40 + Math.floor(Math.random() * 20);
                await new Promise((r) => setTimeout(r, backoffMs));
            }
            else if (err.message?.includes('no such table')) {
                dbHasVersesTable = false;
                return [];
            }
            else {
                return [];
            }
        }
    }
    return [];
}
