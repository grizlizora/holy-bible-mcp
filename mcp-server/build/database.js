import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_DB = path.resolve(__dirname, "../../data/processed/bible_database.sqlite");
const GLOBAL_DIR = path.join(os.homedir(), ".bible-mcp");
const GLOBAL_DB = path.join(GLOBAL_DIR, "bible_database.sqlite");
function isValidDb(dbPath) {
    try {
        return fs.existsSync(dbPath) && fs.statSync(dbPath).size > 1000000;
    }
    catch (e) {
        return false;
    }
}
function resolveDbPath() {
    if (isValidDb(LOCAL_DB)) {
        return LOCAL_DB;
    }
    if (isValidDb(GLOBAL_DB)) {
        return GLOBAL_DB;
    }
    if (!fs.existsSync(GLOBAL_DIR)) {
        fs.mkdirSync(GLOBAL_DIR, { recursive: true });
    }
    console.error(`[INFO] Bible Database not found at ${LOCAL_DB} or ${GLOBAL_DB}.`);
    console.error(`[INFO] Please place 'bible_database.sqlite' into ${GLOBAL_DB} or download it from HuggingFace.`);
    return GLOBAL_DB;
}
export const DB_PATH = resolveDbPath();
// 🧠 Hardware-Aware CPU/RAM/VRAM Optimization Engine
const totalRamGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));
const cpuCores = os.cpus().length || 4;
const arch = os.arch();
let cacheSizeKb = -64000; // 64MB default
let mmapSizeBytes = 268435456; // 256MB default
if (totalRamGB >= 16) {
    cacheSizeKb = -128000; // 128MB RAM cache on high-RAM systems (>=16GB)
    mmapSizeBytes = 536870912; // 512MB Memory-Mapped I/O
}
else if (totalRamGB < 8) {
    cacheSizeKb = -16000; // 16MB RAM cache on low memory devices (<8GB)
    mmapSizeBytes = 0; // Disable MMAP to protect low RAM devices
}
console.log(`[HARDWARE ENGINE] OS: ${process.platform} (${arch}), CPU Cores: ${cpuCores}, RAM: ${totalRamGB}GB. Scaled Cache: ${Math.abs(cacheSizeKb) / 1000}MB, MMAP: ${mmapSizeBytes / (1024 * 1024)}MB`);
export const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error("[DATABASE ENGINE] Warning: Native SQLite connection error:", err.message);
    }
});
// Configure SQLite for WAL mode and multi-reader speed sequentially inside serialize()
db.serialize(() => {
    db.run("PRAGMA busy_timeout = 5000;");
    db.run("PRAGMA journal_mode = WAL;");
    db.run(`PRAGMA cache_size = ${cacheSizeKb};`);
    db.run(`PRAGMA mmap_size = ${mmapSizeBytes};`);
    db.run("PRAGMA temp_store = MEMORY;");
    db.run(`CREATE TABLE IF NOT EXISTS commentaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book TEXT,
    chapter INTEGER,
    verse INTEGER,
    author TEXT,
    commentary_text TEXT
  );`);
    db.run(`CREATE TABLE IF NOT EXISTS semantic_concepts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concept_name TEXT,
    keywords TEXT,
    book TEXT,
    chapter INTEGER,
    verse INTEGER,
    theological_principle TEXT
  );`);
    db.get("SELECT COUNT(*) as cnt FROM commentaries", (err, row) => {
        if (!err && row && row.cnt === 0) {
            db.run(`INSERT INTO commentaries (book, chapter, verse, author, commentary_text) VALUES 
      ('JN', 3, 16, 'John Chrysostom', 'God so loved the world that He gave His only begotten Son. This is the supreme demonstration of sacrificial covenantal love (Agape).'),
      ('JN', 3, 16, 'Matthew Henry', 'Faith in Christ is the single divine means of salvation from eternal ruin and receiving everlasting life.'),
      ('PS', 23, 1, 'Ivan Ohiyenko', 'The Pastoral Psalm expresses absolute trust in God as the Caring Shepherd during times of testing.');`);
        }
    });
    db.get("SELECT COUNT(*) as cnt FROM semantic_concepts", (err, row) => {
        if (!err && row && row.cnt === 0) {
            db.run(`INSERT INTO semantic_concepts (concept_name, keywords, book, chapter, verse, theological_principle) VALUES 
      ('anxiety', 'anxiety fear worry care distress', 'PHP', 4, 6, 'Be anxious for nothing, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.'),
      ('loneliness', 'lonely abandoned isolated alone', 'PS', 27, 10, 'When my father and my mother forsake me, then the Lord will take me up.'),
      ('financial trials', 'money debt poverty scarcity risk', 'PROV', 13, 11, 'Wealth gained hastily will dwindle, but whoever gathers little by little will increase it.'),
      ('forgiveness', 'offense anger forgive enemy grudge', 'EPH', 4, 32, 'Be kind to one another, tenderhearted, forgiving one another, even as God in Christ forgave you.');`);
        }
    });
});
// Fast In-Memory Bounded LRU Cache with 5-minute TTL
const queryCache = new Map();
const MAX_CACHE_SIZE = 500;
const DEFAULT_CACHE_TTL_MS = 300000;
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
    if (queryCache.has(key))
        queryCache.delete(key);
    else if (queryCache.size >= MAX_CACHE_SIZE) {
        const now = Date.now();
        for (const [k, v] of queryCache.entries()) {
            if (now > v.expiresAt) {
                queryCache.delete(k);
            }
        }
        if (queryCache.size >= MAX_CACHE_SIZE) {
            const firstKey = queryCache.keys().next().value;
            if (firstKey)
                queryCache.delete(firstKey);
        }
    }
    queryCache.set(key, { data, expiresAt: Date.now() + DEFAULT_CACHE_TTL_MS });
}
export function queryDb(sql, params = []) {
    const cacheKey = `${sql}::${JSON.stringify(params)}`;
    const cached = getFromCache(cacheKey);
    if (cached !== undefined) {
        return Promise.resolve(cached);
    }
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error("Database query error:", err.message);
                reject(err);
            }
            else {
                saveToCache(cacheKey, rows || []);
                resolve(rows || []);
            }
        });
    });
}
