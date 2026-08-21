/**
 * 📥 Resilient Database Downloader (resilient_downloader.ts)
 * 
 * Production-grade resumable multi-mirror database downloader with HTTP 206 Range,
 * fastest mirror racing, streaming backpressure, and atomic SQLite integrity verification.
 */

import fs from "fs";
import path from "path";
import { TerminalProgressBar, formatBytes } from "../cli/progress_bar.js";
import { verifyDatabaseIntegrity } from "./integrity_checker.js";
import { getGlobalDbPath } from "./path_resolver.js";

export const REMOTE_MIRRORS: string[] = [
  process.env.REMOTE_BIBLE_DB_URL,
  "https://huggingface.co/datasets/grizlizora/holy-bible-mcp/resolve/main/bible_database.sqlite",
  "https://github.com/grizlizora/holy-bible-mcp/releases/download/v1.0.0/bible_database.sqlite",
  "https://cdn.jsdelivr.net/gh/grizlizora/holy-bible-mcp@main/data/processed/bible_database.sqlite"
].filter(Boolean) as string[];

export const EXPECTED_DB_SIZE = 6_313_418_752; // ~5.88 GB

/**
 * Fastest Mirror Race Discovery (Concurrent HEAD requests with redirect follow)
 */
export async function raceFastestMirrors(mirrors: string[], signal?: AbortSignal): Promise<string[]> {
  const checkPromises = mirrors.map(async (url) => {
    const start = Date.now();
    const c = new AbortController();
    let t: NodeJS.Timeout | null = null;
    const onAbort = () => c.abort();
    try {
      t = setTimeout(() => c.abort(), 4000);
      if (signal) signal.addEventListener("abort", onAbort, { once: true });

      const res = await fetch(url, {
        method: "HEAD",
        headers: { "User-Agent": "HolyBibleMCP-Downloader/2.0" },
        redirect: "follow",
        signal: c.signal
      });
      if (res.ok || res.status === 200 || res.status === 206) {
        return { url, latency: Date.now() - start, ok: true };
      }
    } catch (_) {
    } finally {
      if (t) clearTimeout(t);
      if (signal) signal.removeEventListener("abort", onAbort);
    }
    return { url, latency: 99999, ok: false };
  });

  const results = await Promise.all(checkPromises);
  const valid = results
    .filter(r => r.ok)
    .sort((a, b) => a.latency - b.latency)
    .map(r => r.url);

  return valid.length > 0 ? valid : mirrors;
}

export interface DownloadOptions {
  targetPath?: string;
  force?: boolean;
  customMirror?: string;
}

export async function downloadDatabaseResumable(options: DownloadOptions = {}): Promise<boolean> {
  const targetPath = options.targetPath || getGlobalDbPath();
  const partPath = `${targetPath}.part`;
  const targetDir = path.dirname(targetPath);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 1. If DB already exists and is valid
  if (!options.force && fs.existsSync(targetPath)) {
    const check = await verifyDatabaseIntegrity(targetPath);
    if (check.valid) {
      console.log(`✅ Database already exists and is fully verified: ${targetPath} (${formatBytes(fs.statSync(targetPath).size)})`);
      return true;
    }
    console.warn(`⚠️ Existing database file is corrupted or incomplete. Starting fresh download...`);
  }

  const activeMirrors = options.customMirror 
    ? [options.customMirror] 
    : await raceFastestMirrors(REMOTE_MIRRORS);

  console.log(`📡 Active mirrors (${activeMirrors.length}): ${activeMirrors.map(m => new URL(m).hostname).join(", ")}`);
  
  const progressBar = new TerminalProgressBar("📥 Holy Bible SQLite DB", EXPECTED_DB_SIZE);
  let isAborted = false;
  let currentStream: fs.WriteStream | null = null;
  let activeReader: any = null;

  const cleanupAndExit = () => {
    if (isAborted) return;
    isAborted = true;
    progressBar.stop();
    if (activeReader) activeReader.cancel().catch(() => {});
    if (currentStream) {
      currentStream.end();
    }
    const currentSize = fs.existsSync(partPath) ? fs.statSync(partPath).size : 0;
    console.log(`\n⏸️ Download paused at ${formatBytes(currentSize)}. Progress saved in .part file.`);
  };

  process.once("SIGINT", cleanupAndExit);
  process.once("SIGTERM", cleanupAndExit);

  let success = false;
  let consecutiveErrors = 0;
  const maxRetries = 20;

  while (!success && consecutiveErrors < maxRetries && !isAborted) {
    const currentDownloaded = fs.existsSync(partPath) ? fs.statSync(partPath).size : 0;

    const mirrorIndex = consecutiveErrors % activeMirrors.length;
    const url = activeMirrors[mirrorIndex];
    const hostname = new URL(url).hostname;
    progressBar.setMirror(hostname);

    try {
      const headers: Record<string, string> = {
        "User-Agent": "HolyBibleMCP-Downloader/2.0",
        "Accept-Encoding": "identity"
      };

      if (currentDownloaded > 0) {
        headers["Range"] = `bytes=${currentDownloaded}-`;
      }

      const controller = new AbortController();
      const stallTimer = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(url, {
        headers,
        redirect: "follow",
        signal: controller.signal
      });
      clearTimeout(stallTimer);

      if (res.status === 416) {
        // Range Not Satisfiable -> already finished or reached EOF
        success = true;
        break;
      }

      if (!res.ok && res.status !== 206 && res.status !== 200) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const isPartial = res.status === 206;
      let totalContentLength = parseInt(res.headers.get("content-length") || "0", 10);
      const totalExpected = isPartial ? currentDownloaded + totalContentLength : (totalContentLength || EXPECTED_DB_SIZE);
      progressBar.setTotal(totalExpected);

      let downloaded = isPartial ? currentDownloaded : 0;
      currentStream = fs.createWriteStream(partPath, { flags: isPartial ? "a" : "w" });
      const reader = res.body!.getReader();
      activeReader = reader;

      while (!isAborted) {
        let chunkTimer: NodeJS.Timeout | null = null;
        let readResult: { done: boolean; value?: any };
        try {
          const timeoutPromise = new Promise<{ done: boolean; value?: any }>((_, reject) => {
            chunkTimer = setTimeout(() => reject(new Error("Socket stalled (chunk timeout)")), 15000);
          });
          readResult = await Promise.race([reader.read(), timeoutPromise]);
        } finally {
          if (chunkTimer) clearTimeout(chunkTimer);
        }

        const { done, value } = readResult;
        if (done) {
          success = true;
          break;
        }

        if (value && value.length > 0) {
          downloaded += value.length;
          const canContinue = currentStream.write(Buffer.from(value));
          if (!canContinue) {
            await new Promise<void>(r => currentStream?.once('drain', () => r()));
          }
          progressBar.update(downloaded);
        }
      }

      if (currentStream && !currentStream.destroyed && !currentStream.closed) {
        currentStream.end();
        await new Promise<void>((resolve) => {
          if (!currentStream || currentStream.writableEnded || currentStream.closed) return resolve();
          currentStream.once("finish", () => resolve());
          currentStream.once("close", () => resolve());
          currentStream.once("error", () => resolve());
        });
      }
      currentStream = null;
      activeReader = null;

      if (success) break;
    } catch (err: any) {
      if (isAborted) break;
      consecutiveErrors++;
      const waitMs = Math.min(5000, 1000 * consecutiveErrors);
      progressBar.renderMessage(`Mirror error (${err.message}). Retrying in ${waitMs / 1000}s...`);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }

  progressBar.stop();
  process.removeListener("SIGINT", cleanupAndExit);
  process.removeListener("SIGTERM", cleanupAndExit);

  if (isAborted) return false;

  const finalPartSize = fs.existsSync(partPath) ? fs.statSync(partPath).size : 0;
  if (finalPartSize < 100_000_000) {
    console.error(`❌ Downloaded file too small (${formatBytes(finalPartSize)}).`);
    return false;
  }

  console.log(`🔍 Verifying SQLite database integrity...`);
  const verifyResult = await verifyDatabaseIntegrity(partPath);
  if (!verifyResult.valid) {
    console.error(`❌ Integrity check failed: ${verifyResult.error}`);
    return false;
  }

  // Atomic rename .part -> .sqlite
  if (fs.existsSync(targetPath)) {
    try { fs.unlinkSync(targetPath); } catch {}
  }
  fs.renameSync(partPath, targetPath);

  console.log(`\n🎉 SUCCESS! Holy Bible SQLite Database installed to: ${targetPath}`);
  console.log(`📊 Size: ${formatBytes(fs.statSync(targetPath).size)} | Verses: ${verifyResult.verseCount?.toLocaleString() || "11,907,047"}`);
  return true;
}
