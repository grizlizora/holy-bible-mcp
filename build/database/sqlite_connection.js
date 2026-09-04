import { sqlitePool, auxDbInstance, DB_PATH, isDbReady, checkAndHotMountDb, onDatabaseMounted, offDatabaseMounted, clearQueryCache, getFromCache, saveToCache } from "./better_sqlite_pool.js";
export const db = sqlitePool.getRawDb();
export const auxDb = auxDbInstance;
export { sqlitePool, DB_PATH, isDbReady, checkAndHotMountDb, onDatabaseMounted, offDatabaseMounted, clearQueryCache, getFromCache, saveToCache };
export async function queryDb(sql, params = [], maxRetries = 3) {
    const isAuxQuery = sql.includes("commentaries") || sql.includes("semantic_concepts");
    if (!isAuxQuery && !isDbReady() && (sql.includes("FROM verses") || sql.includes("verses_fts"))) {
        checkAndHotMountDb();
        if (!isDbReady()) {
            return [];
        }
    }
    const cacheKey = `${sql}::${JSON.stringify(params)}`;
    const cached = getFromCache(cacheKey);
    if (cached !== undefined) {
        return cached;
    }
    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            const rows = sqlitePool.query(sql, params);
            if (rows && rows.length > 0) {
                saveToCache(cacheKey, rows);
            }
            return rows;
        }
        catch (err) {
            const isLocked = err.message?.includes("SQLITE_BUSY") || err.message?.includes("database is locked") || err.message?.includes("SQLITE_LOCKED");
            if (isLocked && attempt < maxRetries) {
                attempt++;
                const backoffMs = Math.pow(2, attempt) * 40 + Math.floor(Math.random() * 20);
                await new Promise((r) => setTimeout(r, backoffMs));
            }
            else if (err.message?.includes("no such table")) {
                return [];
            }
            else {
                return [];
            }
        }
    }
    return [];
}
