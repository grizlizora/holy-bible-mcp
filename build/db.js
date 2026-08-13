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
    if (isValidDb(LOCAL_DB))
        return LOCAL_DB;
    if (isValidDb(GLOBAL_DB))
        return GLOBAL_DB;
    if (!fs.existsSync(GLOBAL_DIR)) {
        fs.mkdirSync(GLOBAL_DIR, { recursive: true });
    }
    console.error(`[INFO] Bible Database not found at ${LOCAL_DB} or ${GLOBAL_DB}.`);
    return GLOBAL_DB;
}
export const DB_PATH = resolveDbPath();
export const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error("Error connecting to database:", err.message);
    }
});
// Configure SQLite for extreme speed (WAL mode, memory mapping, 64MB cache & busy timeout)
db.run("PRAGMA busy_timeout = 5000;");
db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA cache_size = -64000;");
db.run("PRAGMA mmap_size = 268435456;");
db.run("PRAGMA temp_store = MEMORY;");
// Initialize internal tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS commentaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book TEXT, chapter INTEGER, verse INTEGER,
    author TEXT, commentary_text TEXT
  );`);
    db.run(`CREATE TABLE IF NOT EXISTS semantic_concepts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concept_name TEXT, keywords TEXT,
    book TEXT, chapter INTEGER, verse INTEGER,
    theological_principle TEXT
  );`);
});
// Fast In-Memory True LRU Cache with 5-minute TTL
const queryCache = new Map();
const MAX_CACHE_SIZE = 1000;
const DEFAULT_CACHE_TTL_MS = 300000;
function getFromCache(key) {
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
function saveToCache(key, data) {
    if (queryCache.has(key))
        queryCache.delete(key);
    else if (queryCache.size >= MAX_CACHE_SIZE) {
        const firstKey = queryCache.keys().next().value;
        if (firstKey)
            queryCache.delete(firstKey);
    }
    queryCache.set(key, { data, expiresAt: Date.now() + DEFAULT_CACHE_TTL_MS });
}
export const queryDb = (sql, params) => {
    const cacheKey = `${sql}:${JSON.stringify(params)}`;
    const cached = getFromCache(cacheKey);
    if (cached)
        return Promise.resolve(cached);
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err)
                reject(err);
            else {
                saveToCache(cacheKey, rows);
                resolve(rows);
            }
        });
    });
};
