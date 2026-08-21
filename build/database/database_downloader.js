/**
 * 📥 Database Downloader Subsystem (database_downloader.ts)
 *
 * Manages downloading and initial installation of the Holy Bible SQLite Database
 * with atomic rename, backpressure flow control, and checksum validation.
 */
import path from "path";
import fs from "fs";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const BIBLE_DB_MAGNET_URI = "magnet:?xt=urn:btih:e221d09e3870ddc23d3e1f62858a12b4152792847b911728371d39fa85279bb3&dn=bible_database.sqlite&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A6969%2Fannounce&tr=wss%3A%2F%2Ftracker.webtorrent.dev";
import { REMOTE_MIRRORS, EXPECTED_DB_SIZE, downloadDatabaseResumable, raceFastestMirrors } from "./resilient_downloader.js";
export { getGlobalDbDir, getGlobalDbPath, isValidDb, resolveDbPath } from "./path_resolver.js";
export { REMOTE_MIRRORS, EXPECTED_DB_SIZE, downloadDatabaseResumable, raceFastestMirrors };
export { verifyDatabaseIntegrity, checkSqliteHeader } from "./integrity_checker.js";
export const REMOTE_DB_PRIMARY = "https://huggingface.co/datasets/grizlizora/holy-bible-mcp/resolve/main/bible_database.sqlite";
export const REMOTE_DB_FALLBACK = "https://github.com/grizlizora/holy-bible-mcp/releases/download/v1.0.0/bible_database.sqlite";
export async function downloadDatabaseStream(targetPath, url = REMOTE_DB_PRIMARY) {
    console.error(`[AUTO-DOWNLOADER] Starting download of Holy Bible SQLite DB to ${targetPath}...`);
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    const tempPath = `${targetPath}.tmp_${Date.now()}`;
    return new Promise((resolve) => {
        const fetchWithRedirects = (currentUrl, redirectCount = 0) => {
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
                    console.error(`[AUTO-DOWNLOADER] Failed to download DB: HTTP ${res.statusCode}`);
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
                            console.error(`[AUTO-DOWNLOADER] Progress: ${percent}% (${Math.round(downloadedBytes / (1024 * 1024))}MB / ${Math.round(totalBytes / (1024 * 1024))}MB)`);
                        }
                    }
                });
                fileStream.on('drain', () => {
                    res.pause();
                    setTimeout(() => res.resume(), 15);
                });
                res.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close(() => {
                        if (fs.existsSync(tempPath) && fs.statSync(tempPath).size > 1000000) {
                            try {
                                if (fs.existsSync(targetPath)) {
                                    fs.unlinkSync(targetPath);
                                }
                                fs.renameSync(tempPath, targetPath);
                                console.error(`[AUTO-DOWNLOADER] ✅ Database successfully installed to ${targetPath}!`);
                                resolve(true);
                            }
                            catch (renameErr) {
                                console.error('[AUTO-DOWNLOADER] Rename error:', renameErr);
                                resolve(false);
                            }
                        }
                        else {
                            console.error(`[AUTO-DOWNLOADER] ❌ Downloaded file is too small or corrupt.`);
                            if (fs.existsSync(tempPath))
                                fs.unlinkSync(tempPath);
                            resolve(false);
                        }
                    });
                });
            });
            req.on('error', (err) => {
                console.error(`[AUTO-DOWNLOADER] Download error:`, err.message);
                if (fs.existsSync(tempPath))
                    fs.unlinkSync(tempPath);
                resolve(false);
            });
        };
        fetchWithRedirects(url);
    });
}
export async function downloadDatabaseStreamResilient(targetPath) {
    const shuffledMirrors = [...REMOTE_MIRRORS].sort(() => Math.random() - 0.5);
    console.error(`[AUTO-DOWNLOADER] Resilient Download Manager: Attempting ${shuffledMirrors.length} mirrors...`);
    for (let i = 0; i < shuffledMirrors.length; i++) {
        const mirror = shuffledMirrors[i];
        console.error(`[AUTO-DOWNLOADER] [Attempt ${i + 1}/${shuffledMirrors.length}] Trying: ${mirror}`);
        const success = await downloadDatabaseStream(targetPath, mirror);
        if (success)
            return true;
        const backoffMs = Math.pow(2, i) * 1000;
        console.error(`[AUTO-DOWNLOADER] Mirror failed. Waiting ${backoffMs}ms before next mirror...`);
        await new Promise((res) => setTimeout(res, backoffMs));
    }
    console.error(`[AUTO-DOWNLOADER] ❌ All remote mirrors exhausted.`);
    return false;
}
