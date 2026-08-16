import fs from "fs";
import path from "path";
import os from "os";
import { DownloadState } from "./download-state-manager";
import { verifyDatabaseIntegrity } from "./database-verifier";

export const DEFAULT_BIBLE_MIRRORS = [
  "https://huggingface.co/datasets/grizlizora/holy-bible-mcp/resolve/main/bible_database.sqlite",
  "https://github.com/grizlizora/holy-bible-mcp/releases/download/v1.0.0/bible_database.sqlite",
  "https://cdn.jsdelivr.net/gh/grizlizora/holy-bible-mcp@main/data/processed/bible_database.sqlite"
];

/**
 * ⚡ Resilient Chunk & Range Streamer Engine
 * Supports seamless resume (HTTP 206 Partial Content), intelligent multi-mirror fallback,
 * adaptive exponential backoff, and post-download SQLite integrity validation.
 */
export async function executeResilientChunkDownload(
  mcpId: string,
  tempPath: string,
  targetPath: string,
  expectedSizeBytes: number,
  state: DownloadState,
  controller: AbortController,
  mirrors: string[] = DEFAULT_BIBLE_MIRRORS
): Promise<void> {
  const userHome = os.homedir();
  let lastError: Error | null = null;
  let consecutiveRetries = 0;
  const maxRetries = 50;

  const validMirrors = (mirrors && mirrors.length > 0) ? mirrors : DEFAULT_BIBLE_MIRRORS;

  while (consecutiveRetries < maxRetries) {
    if (controller.signal.aborted) break;

    const currentDownloaded = fs.existsSync(tempPath) ? fs.statSync(tempPath).size : 0;
    if (currentDownloaded >= expectedSizeBytes * 0.98) {
      break;
    }

    state.downloadedBytes = currentDownloaded;
    state.progressPercent = Math.min(99, Math.round((currentDownloaded / expectedSizeBytes) * 100));

    const mirrorIndex = (Math.floor(consecutiveRetries / 2)) % validMirrors.length;
    const url = validMirrors[mirrorIndex];

    try {
      const headers: Record<string, string> = {
        "User-Agent": "UniversalMcpDownloader/2.0",
        "Accept-Encoding": "identity"
      };
      if (currentDownloaded > 0) {
        headers["Range"] = `bytes=${currentDownloaded}-`;
      }

      const response = await fetch(url, {
        headers,
        redirect: "follow",
        signal: controller.signal
      });

      if (response.status === 416) {
        const finalSize = fs.existsSync(tempPath) ? fs.statSync(tempPath).size : 0;
        if (finalSize >= expectedSizeBytes * 0.95) break;
      }

      if (!response.ok && response.status !== 206 && response.status !== 200) {
        throw new Error(`HTTP ${response.status} ${response.statusText} from mirror ${url}`);
      }

      const isPartial = response.status === 206;
      let downloaded = isPartial ? currentDownloaded : 0;

      // 🛡️ Zero-Corruption: If server ignored Range and returned full file (200), overwrite from byte 0
      const fileStream = fs.createWriteStream(tempPath, { flags: isPartial ? "a" : "w" });
      const reader = (response.body as any).getReader();
      
      let lastTime = Date.now();
      let lastBytes = downloaded;
      let receivedAnyBytes = false;

      while (true) {
        if (controller.signal.aborted) {
          fileStream.close();
          reader.cancel();
          return;
        }

        const { done, value } = await reader.read();
        if (done) break;
        if (value && value.length > 0) {
          receivedAnyBytes = true;
          downloaded += value.length;
          fileStream.write(Buffer.from(value));

          const now = Date.now();
          const elapsed = (now - lastTime) / 1000;
          if (elapsed >= 0.3) {
            state.speedBytesPerSec = Math.max(0, (downloaded - lastBytes) / elapsed);
            state.downloadedBytes = downloaded;
            state.progressPercent = Math.min(99, Math.round((downloaded / expectedSizeBytes) * 100));
            lastTime = now;
            lastBytes = downloaded;
          }
        }
      }

      fileStream.end();
      await new Promise<void>((resolve, reject) => {
        fileStream.on("finish", resolve);
        fileStream.on("error", reject);
      });

      const newSize = fs.existsSync(tempPath) ? fs.statSync(tempPath).size : 0;
      state.downloadedBytes = newSize;
      state.progressPercent = Math.min(99, Math.round((newSize / expectedSizeBytes) * 100));

      if (newSize >= expectedSizeBytes * 0.98) {
        break;
      }

      if (receivedAnyBytes) {
        consecutiveRetries = 0;
        await new Promise(r => setTimeout(r, 400));
      } else {
        consecutiveRetries++;
        await new Promise(r => setTimeout(r, Math.min(4000, 1000 * consecutiveRetries)));
      }

    } catch (err: any) {
      if (controller.signal.aborted) {
        return;
      }
      lastError = err;
      consecutiveRetries++;
      await new Promise(r => setTimeout(r, Math.min(5000, 1000 * consecutiveRetries)));
    }
  }

  if (controller.signal.aborted) return;

  const finalSize = fs.existsSync(tempPath) ? fs.statSync(tempPath).size : 0;
  if (finalSize < expectedSizeBytes * 0.98) {
    state.isDownloading = false;
    state.isPaused = true;
    state.isVerifying = false;
    state.isComplete = false;
    state.speedBytesPerSec = 0;
    state.error = lastError?.message || `Download paused at ${Math.round(finalSize / (1024*1024))}MB. Click Play to resume.`;
    return;
  }

  state.isDownloading = false;
  state.isVerifying = true;
  state.verificationStatus = "Verifying SQLite integrity...";

  const verified = await verifyDatabaseIntegrity(tempPath, expectedSizeBytes);
  if (!verified.valid) {
    state.isVerifying = false;
    state.isDownloading = false;
    state.isComplete = false;
    state.error = `Integrity check failed: ${verified.error}`;
    return;
  }

  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  if (fs.existsSync(targetPath)) { 
    try { fs.unlinkSync(targetPath); } catch {} 
  }
  fs.renameSync(tempPath, targetPath);

  // Auto-seed global directory for zero-latency shared MCP usage if primary Bible DB
  if (mcpId === 'holy-bible-mcp' || targetPath.includes('bible_database')) {
    const globalDir = path.join(userHome, ".bible-mcp");
    if (!fs.existsSync(globalDir)) fs.mkdirSync(globalDir, { recursive: true });
    const globalDb = path.join(globalDir, "bible_database.sqlite");
    try {
      if (!fs.existsSync(globalDb)) {
        fs.copyFileSync(targetPath, globalDb);
      }
    } catch {}
  }

  state.isVerifying = false;
  state.verificationStatus = "Verified OK";
  state.isComplete = true;
  state.isPaused = false;
  state.progressPercent = 100;
  state.downloadedBytes = finalSize;
  state.speedBytesPerSec = 0;
}
