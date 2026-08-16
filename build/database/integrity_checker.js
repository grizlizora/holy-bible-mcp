import fs from "fs";
import sqlite3 from "sqlite3";
export function checkSqliteHeader(filePath) {
    try {
        if (!fs.existsSync(filePath))
            return { valid: false, error: "File not found on disk." };
        const stat = fs.statSync(filePath);
        if (stat.size < 512)
            return { valid: false, error: `File too small to be a database (${stat.size} bytes).` };
        const fd = fs.openSync(filePath, "r");
        const buffer = Buffer.alloc(100);
        fs.readSync(fd, buffer, 0, 100, 0);
        fs.closeSync(fd);
        const header = buffer.toString("utf8", 0, 15);
        if (header !== "SQLite format 3") {
            const preview = buffer.toString("utf8", 0, 80).trim();
            if (preview.startsWith("version https://git-lfs")) {
                return { valid: false, error: "Received Git LFS pointer text instead of database binary." };
            }
            if (preview.startsWith("<!DOCTYPE html") || preview.startsWith("<html")) {
                return { valid: false, error: "Received HTML web page (HTTP 404/403 or CDN blocking page)." };
            }
            if (preview.startsWith("{") && preview.includes("error")) {
                return { valid: false, error: "Received JSON error payload from server." };
            }
            return { valid: false, error: `Invalid SQLite header: "${preview.slice(0, 30)}..."` };
        }
        let pageSize = buffer.readUInt16BE(16);
        if (pageSize === 1)
            pageSize = 65536;
        return { valid: true, pageSize };
    }
    catch (err) {
        return { valid: false, error: `Header read error: ${err.message}` };
    }
}
export async function verifyDatabaseIntegrity(filePath, minSize = 1_000_000) {
    if (!fs.existsSync(filePath))
        return { valid: false, error: "File does not exist." };
    const stat = fs.statSync(filePath);
    if (stat.size < minSize) {
        return { valid: false, error: `File size smaller than minimum valid database threshold (${stat.size} < ${minSize}).` };
    }
    // 1. Check Header
    const headerCheck = checkSqliteHeader(filePath);
    if (!headerCheck.valid)
        return headerCheck;
    // 2. Check Trailing page readability
    try {
        const fd = fs.openSync(filePath, "r");
        const tailBuffer = Buffer.alloc(512);
        const offset = Math.max(0, stat.size - 512);
        fs.readSync(fd, tailBuffer, 0, 512, offset);
        fs.closeSync(fd);
    }
    catch (err) {
        return { valid: false, error: `Truncated or unreadable trailing page: ${err.message}` };
    }
    // 3. Engine-level verification via sqlite3 PRAGMA quick_check
    return new Promise((resolve) => {
        const db = new sqlite3.Database(filePath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                return resolve({ valid: false, error: `Failed to open SQLite database: ${err.message}` });
            }
            db.get("PRAGMA quick_check(1);", (qErr, qRow) => {
                const quickResult = qRow ? Object.values(qRow)[0] : null;
                if (qErr || quickResult !== "ok") {
                    db.close();
                    return resolve({ valid: false, error: `PRAGMA quick_check failed: ${quickResult || qErr?.message}` });
                }
                db.get("SELECT count(*) as cnt FROM sqlite_master WHERE type='table';", (tErr, tRow) => {
                    const tableCount = tRow?.cnt || 0;
                    if (tableCount === 0) {
                        db.close();
                        return resolve({ valid: false, error: "Database is empty (0 tables in schema)." });
                    }
                    db.get("SELECT count(*) as count FROM verses;", (vErr, vRow) => {
                        const verseCount = vRow?.count || 0;
                        db.close();
                        resolve({
                            valid: true,
                            pageSize: headerCheck.pageSize,
                            tableCount,
                            verseCount,
                            quickCheck: "ok"
                        });
                    });
                });
            });
        });
    });
}
