/**
 * 🛡️ SqliteDatabaseIntegrityChecker (integrity_checker.ts)
 *
 * Verifies SQLite database format, header magic numbers, page boundaries,
 * and PRAGMA quick_check status without loading full files into memory.
 */
import fs from "fs";
import crypto from "crypto";
import Database from "better-sqlite3";
export function checkSqliteHeader(filePath) {
    try {
        if (!fs.existsSync(filePath))
            return { valid: false, error: "File not found on disk." };
        const stat = fs.statSync(filePath);
        if (stat.size < 512)
            return { valid: false, error: `File too small to be a database (${stat.size} bytes).` };
        const fd = fs.openSync(filePath, "r");
        const buffer = Buffer.alloc(100);
        try {
            fs.readSync(fd, buffer, 0, 100, 0);
        }
        finally {
            fs.closeSync(fd);
        }
        const header = buffer.toString("utf8", 0, 15);
        if (header !== "SQLite format 3") {
            const preview = buffer.toString("utf8", 0, 80).trim();
            if (preview.startsWith("version https://git-lfs")) {
                return { valid: false, error: "Database file is a Git LFS pointer text file, not a binary SQLite database." };
            }
            return { valid: false, error: "Invalid SQLite magic header string (expected 'SQLite format 3')." };
        }
        const pageSize = buffer.readUInt16BE(16);
        const effectivePageSize = pageSize === 1 ? 65536 : pageSize;
        if (effectivePageSize < 512 || (effectivePageSize & (effectivePageSize - 1)) !== 0) {
            return { valid: false, error: `Corrupt page size indicated in header: ${effectivePageSize}` };
        }
        return { valid: true, pageSize: effectivePageSize };
    }
    catch (err) {
        return { valid: false, error: `Failed to inspect database header: ${err.message}` };
    }
}
export async function computeFileSha256(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash("sha256");
        const stream = fs.createReadStream(filePath);
        stream.on("data", (chunk) => hash.update(chunk));
        stream.on("end", () => resolve(hash.digest("hex")));
        stream.on("error", (err) => reject(err));
    });
}
export async function verifyDatabaseSha256(filePath, expectedHash) {
    try {
        if (!fs.existsSync(filePath)) {
            return { valid: false, actualSha256: "", error: "File does not exist on disk." };
        }
        const actualSha256 = await computeFileSha256(filePath);
        if (expectedHash && expectedHash.trim()) {
            const match = actualSha256.toLowerCase() === expectedHash.trim().toLowerCase();
            if (!match) {
                return {
                    valid: false,
                    actualSha256,
                    error: `SHA-256 mismatch! Expected ${expectedHash}, but computed ${actualSha256}.`
                };
            }
        }
        return { valid: true, actualSha256 };
    }
    catch (err) {
        return { valid: false, actualSha256: "", error: `SHA-256 computation failed: ${err.message}` };
    }
}
export async function verifySqliteDatabaseIntegrity(filePath, options) {
    // 1. Check Magic Header & Page Size
    const headerCheck = checkSqliteHeader(filePath);
    if (!headerCheck.valid) {
        return headerCheck;
    }
    // 2. Trailing byte boundary inspection
    try {
        const stat = fs.statSync(filePath);
        const pageSize = headerCheck.pageSize || 4096;
        if (stat.size % pageSize !== 0) {
            return { valid: false, error: `Database file size (${stat.size} bytes) is not an exact multiple of page size (${pageSize} bytes). File may be truncated.` };
        }
        const fd = fs.openSync(filePath, "r");
        const testBuf = Buffer.alloc(16);
        try {
            fs.readSync(fd, testBuf, 0, 16, stat.size - 16);
        }
        finally {
            fs.closeSync(fd);
        }
    }
    catch (err) {
        return { valid: false, error: `Truncated or unreadable trailing page: ${err.message}` };
    }
    // 3. Optional SHA-256 Verification
    let sha256;
    if (options?.expectedSha256 || options?.calculateSha256) {
        const shaResult = await verifyDatabaseSha256(filePath, options.expectedSha256);
        if (!shaResult.valid) {
            return { valid: false, error: shaResult.error, sha256: shaResult.actualSha256 };
        }
        sha256 = shaResult.actualSha256;
    }
    // 4. Engine-level verification via better-sqlite3 PRAGMA quick_check
    try {
        const db = new Database(filePath, { readonly: true, fileMustExist: true });
        try {
            const qRow = db.pragma("quick_check(1)", { simple: true });
            if (qRow !== "ok") {
                return { valid: false, error: `PRAGMA quick_check failed: ${qRow}` };
            }
            const tRow = db.prepare("SELECT count(*) as cnt FROM sqlite_master WHERE type='table'").get();
            const tableCount = tRow?.cnt || 0;
            if (tableCount === 0) {
                return { valid: false, error: "Database is empty (0 tables in schema)." };
            }
            let verseCount = 0;
            try {
                const vRow = db.prepare("SELECT count(*) as count FROM verses").get();
                verseCount = vRow?.count || 0;
            }
            catch {
                verseCount = 0;
            }
            return {
                valid: true,
                pageSize: headerCheck.pageSize,
                tableCount,
                verseCount,
                quickCheck: "ok",
                sha256
            };
        }
        finally {
            db.close();
        }
    }
    catch (err) {
        return { valid: false, error: `Failed to open or verify SQLite database: ${err.message}` };
    }
}
export const verifyDatabaseIntegrity = verifySqliteDatabaseIntegrity;
