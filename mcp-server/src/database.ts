import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";

import https from "https";
import http from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ENV_DB = process.env.BIBLE_DB_PATH ? path.resolve(process.env.BIBLE_DB_PATH) : null;
const LOCAL_DB = path.resolve(__dirname, "../../data/processed/bible_database.sqlite");
const GLOBAL_DIR = path.join(os.homedir(), ".bible-mcp");
const GLOBAL_DB = path.join(GLOBAL_DIR, "bible_database.sqlite");
const REMOTE_MIRRORS = [
  process.env.REMOTE_BIBLE_DB_URL,
  "https://huggingface.co/datasets/grizlizora/holy-bible-mcp/resolve/main/bible_database.sqlite",
  "https://github.com/grizlizora/holy-bible-mcp/releases/download/v1.0.0/bible_database.sqlite",
  "https://cdn.jsdelivr.net/gh/grizlizora/holy-bible-mcp@main/data/processed/bible_database.sqlite"
].filter(Boolean) as string[];

export const BIBLE_DB_MAGNET_URI = 
  "magnet:?xt=urn:btih:e221d09e3870ddc23d3e1f62858a12b4152792847b911728371d39fa85279bb3&dn=bible_database.sqlite&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A6969%2Fannounce&tr=wss%3A%2F%2Ftracker.webtorrent.dev";

const REMOTE_DB_PRIMARY = REMOTE_MIRRORS[0];
const REMOTE_DB_FALLBACK = REMOTE_MIRRORS[1] || REMOTE_MIRRORS[0];

function isValidDb(dbPath: string | null): boolean {
  if (!dbPath) return false;
  try {
    return fs.existsSync(dbPath) && fs.statSync(dbPath).size > 1000000;
  } catch (e) {
    return false;
  }
}

export async function downloadDatabaseStream(targetPath: string, url: string = REMOTE_DB_PRIMARY): Promise<boolean> {
  console.error(`[AUTO-DOWNLOADER] Starting automatic download of Holy Bible SQLite DB to ${targetPath}...`);
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const tempPath = `${targetPath}.tmp`;

  return new Promise((resolve) => {
    const fetchWithRedirects = (currentUrl: string, redirectCount = 0) => {
      if (redirectCount > 5) {
        console.error(`[AUTO-DOWNLOADER] Error: Too many HTTP redirects.`);
        resolve(false);
        return;
      }

      const client = currentUrl.startsWith("https") ? https : http;
      const req = client.get(currentUrl, { timeout: 15000 }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchWithRedirects(res.headers.location, redirectCount + 1);
          return;
        }

        if (res.statusCode !== 200) {
          console.error(`[AUTO-DOWNLOADER] HTTP ${res.statusCode} error fetching remote DB.`);
          resolve(false);
          return;
        }

        const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
        let downloadedBytes = 0;
        let lastReportedPercent = 0;

        const fileStream = fs.createWriteStream(tempPath);
        res.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          if (totalBytes > 0) {
            const percent = Math.floor((downloadedBytes / totalBytes) * 100);
            if (percent >= lastReportedPercent + 25) {
              lastReportedPercent = percent;
              console.error(`[AUTO-DOWNLOADER] Progress: ${percent}% (${Math.round(downloadedBytes / (1024*1024))}MB / ${Math.round(totalBytes / (1024*1024))}MB)`);
            }
          }
        });

        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close(() => {
            if (fs.existsSync(tempPath) && fs.statSync(tempPath).size > 1000000) {
              fs.renameSync(tempPath, targetPath);
              console.error(`[AUTO-DOWNLOADER] ✅ Database successfully downloaded and verified at ${targetPath}`);
              resolve(true);
            } else {
              console.error(`[AUTO-DOWNLOADER] Warning: Downloaded file is incomplete.`);
              if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
              resolve(false);
            }
          });
        });
      });

      req.on('error', (err) => {
        console.error(`[AUTO-DOWNLOADER] Network offline or restricted during download: ${err.message}`);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        resolve(false);
      });
    };

    fetchWithRedirects(url);
  });
}

function resolveDbPath(): string {
  if (isValidDb(ENV_DB)) return ENV_DB!;
  if (isValidDb(LOCAL_DB)) return LOCAL_DB;
  if (isValidDb(GLOBAL_DB)) return GLOBAL_DB;
  
  if (!fs.existsSync(GLOBAL_DIR)) {
    fs.mkdirSync(GLOBAL_DIR, { recursive: true });
  }
  
  console.error(`[INFO] Bible Database not found locally at ${LOCAL_DB} or ${GLOBAL_DB}.`);
  console.error(`[INFO] Triggering Level 2 Load-Balanced Background Auto-Downloader to ${GLOBAL_DB}...`);
  
  // Trigger background auto-download if missing with randomized CDN mirror load distribution
  downloadDatabaseStreamResilient(GLOBAL_DB).catch((err) => {
    console.error(`[CDN LOAD BALANCER] Background download error:`, err);
  });

  return GLOBAL_DB;
}

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
} else if (totalRamGB >= 16) {
  cacheSizeKb = -512000; // 512MB RAM cache on high RAM systems (16GB-32GB)
  mmapSizeBytes = 2147483648; // 2GB Memory-Mapped I/O
} else if (totalRamGB < 8) {
  cacheSizeKb = -32000; // 32MB RAM cache on low memory devices (<8GB)
  mmapSizeBytes = 0; // Disable MMAP to protect low RAM devices
}

console.log(`[HARDWARE ENGINE] OS: ${process.platform} (${arch}), CPU Cores: ${cpuCores}, RAM: ${totalRamGB}GB. Scaled RAM Cache: ${Math.abs(cacheSizeKb)/1000}MB, MMAP I/O: ${mmapSizeBytes / (1024*1024)}MB`);

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

  db.get("SELECT COUNT(*) as cnt FROM commentaries", (err, row: any) => {
    if (!err && row && row.cnt === 0) {
      db.run(`INSERT INTO commentaries (book, chapter, verse, author, commentary_text) VALUES 
      ('JN', 3, 16, 'John Chrysostom', 'God so loved the world that He gave His only begotten Son. This is the supreme demonstration of sacrificial covenantal love (Agape).'),
      ('JN', 3, 16, 'Matthew Henry', 'Faith in Christ is the single divine means of salvation from eternal ruin and receiving everlasting life.'),
      ('PS', 23, 1, 'Ivan Ohiyenko', 'The Pastoral Psalm expresses absolute trust in God as the Caring Shepherd during times of testing.');`);
    }
  });

  db.get("SELECT COUNT(*) as cnt FROM semantic_concepts", (err, row: any) => {
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
const queryCache = new Map<string, { data: any; expiresAt: number }>();
const MAX_CACHE_SIZE = 500;
const DEFAULT_CACHE_TTL_MS = 300000;

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
  if (queryCache.has(key)) queryCache.delete(key);
  else if (queryCache.size >= MAX_CACHE_SIZE) {
    const now = Date.now();
    for (const [k, v] of queryCache.entries()) {
      if (now > v.expiresAt) {
        queryCache.delete(k);
      }
    }
    if (queryCache.size >= MAX_CACHE_SIZE) {
      const firstKey = queryCache.keys().next().value;
      if (firstKey) queryCache.delete(firstKey);
    }
  }
  queryCache.set(key, { data, expiresAt: Date.now() + DEFAULT_CACHE_TTL_MS });
}

export function queryDb(sql: string, params: any[] = []): Promise<any[]> {
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
      } else {
        saveToCache(cacheKey, rows || []);
        resolve(rows || []);
      }
    });
  });
}
