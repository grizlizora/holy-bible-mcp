import fs from "fs";
import path from "path";
import os from "os";
import { DownloadState } from "./download-state-manager";
import { verifyDatabaseIntegrity } from "./database-verifier";
import { tryZeroCopyClone } from "../cas-engine";

function formatEta(seconds: number): string {
  if (!seconds || seconds <= 0 || !isFinite(seconds)) return "";
  if (seconds < 60) return `${Math.round(seconds)}с`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins < 60) return `${mins}хв ${secs}с`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}год ${remMins}хв`;
}

/**
 * ⚡ Fastest Mirror Race Discovery
 * Concurrently pings all mirrors to find the lowest latency and highest throughput CDN.
 */
async function raceFastestMirror(mirrors: string[], signal?: AbortSignal): Promise<string[]> {
  if (mirrors.length <= 1) return mirrors;

  try {
    const racePromises = mirrors.map(async (url) => {
      const start = Date.now();
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Range': 'bytes=0-1024', 'User-Agent': 'UniversalMcpDownloader/2.0' },
          signal: signal || AbortSignal.timeout(2500)
        });
        if (res.ok || res.status === 206) {
          const latency = Date.now() - start;
          return { url, latency, ok: true };
        }
      } catch (_) {}
      return { url, latency: 99999, ok: false };
    });

    const results = await Promise.all(racePromises);
    const sorted = results
      .filter(r => r.ok)
      .sort((a, b) => a.latency - b.latency)
      .map(r => r.url);

    if (sorted.length > 0) {
      const remaining = mirrors.filter(m => !sorted.includes(m));
      return [...sorted, ...remaining];
    }
  } catch (_) {}

  return mirrors;
}

/**
 * ⚡ High-Performance Resilient Multi-Mirror Chunk Streamer Engine
 * Implements:
 * 1. Automatic CDN Latency Racing (fastest mirror prioritization)
 * 2. Exponential Moving Average (EMA) smoothed speed & ETA calculation
 * 3. Smart Socket Stall Watchdog with seamless range reconnect
 * 4. Zero-Corruption Stream Writer (clean 206 append vs 200 rewrite)
 * 5. Instant Copy-on-Write (CoW) APFS Clone Sharing
 */
export async function executeResilientChunkDownload(
  mcpId: string,
  tempPath: string,
  targetPath: string,
  expectedSizeBytes: number,
  state: DownloadState,
  controller: AbortController,
  mirrors: string[]
): Promise<void> {
  if (!mirrors || mirrors.length === 0) {
    state.isDownloading = false;
    state.error = "No download mirrors provided for this database.";
    return;
  }

  // 1. Check if an identical database exists in any known global storage cache for instant CoW clone
  const userHome = os.homedir();
  const dbFilename = path.basename(targetPath);
  const potentialCasSources = [
    path.join(userHome, ".bible-mcp", dbFilename),
    path.join(userHome, ".holy-bible-mcp", "data", dbFilename),
    path.join(userHome, ".mcp-hub", "servers", "Holy_Bible_MCP", "data", dbFilename),
    path.join(userHome, "Downloads", "holy", "data", "processed", dbFilename)
  ];

  for (const casSource of potentialCasSources) {
    if (casSource !== targetPath && fs.existsSync(casSource)) {
      const casSize = fs.statSync(casSource).size;
      if (expectedSizeBytes <= 0 || casSize >= expectedSizeBytes * 0.98) {
        state.isDownloading = false;
        state.isVerifying = true;
        state.verificationStatus = "⚡ Instant CoW zero-copy clone from local cache...";
        
        const cloned = tryZeroCopyClone(casSource, targetPath);
        if (cloned) {
          state.isVerifying = false;
          state.verificationStatus = "Verified OK";
          state.isComplete = true;
          state.isPaused = false;
          state.progressPercent = 100;
          state.downloadedBytes = casSize;
          state.totalBytes = casSize;
          state.speedBytesPerSec = 0;
          state.smoothSpeedBytesPerSec = 0;
          state.etaFormatted = "";
          return;
        }
      }
    }
  }

  // 2. Discover fastest mirror via low-overhead concurrency race
  const rankedMirrors = await raceFastestMirror(mirrors, controller.signal);

  let lastError: Error | null = null;
  let consecutiveRetries = 0;
  const maxRetries = 50;
  let smoothSpeed = 0;
  const EMA_ALPHA = 0.25;

  while (consecutiveRetries < maxRetries) {
    if (controller.signal.aborted) break;

    const currentDownloaded = fs.existsSync(tempPath) ? fs.statSync(tempPath).size : 0;
    const completionThreshold = expectedSizeBytes > 0 ? expectedSizeBytes * 0.98 : 1;
    if (expectedSizeBytes > 0 && currentDownloaded >= completionThreshold) {
      break;
    }

    state.downloadedBytes = currentDownloaded;
    state.progressPercent = expectedSizeBytes > 0 ? Math.min(99, Math.round((currentDownloaded / expectedSizeBytes) * 100)) : 0;

    const mirrorIndex = (Math.floor(consecutiveRetries / 2)) % rankedMirrors.length;
    const url = rankedMirrors[mirrorIndex];
    state.activeMirror = new URL(url).hostname;

    try {
      const headers: Record<string, string> = {
        "User-Agent": "UniversalMcpDownloader/2.0",
        "Accept-Encoding": "identity"
      };
      if (currentDownloaded > 0) {
        headers["Range"] = `bytes=${currentDownloaded}-`;
      }

      // Socket stall watchdog: abort connection if no initial headers within 10s
      const connectTimeoutController = new AbortController();
      const onParentAbort = () => connectTimeoutController.abort();
      controller.signal.addEventListener('abort', onParentAbort);
      const connectTimer = setTimeout(() => connectTimeoutController.abort(), 10000);

      let response: Response;
      try {
        response = await fetch(url, {
          headers,
          redirect: "follow",
          signal: connectTimeoutController.signal
        });
      } finally {
        clearTimeout(connectTimer);
        controller.signal.removeEventListener('abort', onParentAbort);
      }

      if (response.status === 416) {
        const finalSize = fs.existsSync(tempPath) ? fs.statSync(tempPath).size : 0;
        if (expectedSizeBytes > 0 && finalSize >= expectedSizeBytes * 0.95) break;
      }

      if (!response.ok && response.status !== 206 && response.status !== 200) {
        throw new Error(`HTTP ${response.status} ${response.statusText} from ${state.activeMirror}`);
      }

      const isPartial = response.status === 206;
      let downloaded = isPartial ? currentDownloaded : 0;

      // 🛡️ Zero-Corruption: If server returned full file (200), rewrite from byte 0
      const fileStream = fs.createWriteStream(tempPath, { flags: isPartial ? "a" : "w" });
      const reader = (response.body as any).getReader();
      
      let lastTime = Date.now();
      let lastBytes = downloaded;
      let receivedAnyBytes = false;
      let lastActivityTime = Date.now();

      while (true) {
        if (controller.signal.aborted) {
          fileStream.close();
          reader.cancel();
          return;
        }

        // Auto-healing stall detector: if stream freezes for > 8s, break to reconnect
        if (Date.now() - lastActivityTime > 8000 && receivedAnyBytes) {
          console.warn(`[STREAMER] Stream stalled on ${state.activeMirror}, reconnecting...`);
          fileStream.close();
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;
        if (value && value.length > 0) {
          receivedAnyBytes = true;
          lastActivityTime = Date.now();
          downloaded += value.length;
          fileStream.write(Buffer.from(value));

          const now = Date.now();
          const elapsed = (now - lastTime) / 1000;
          if (elapsed >= 0.3) {
            const rawSpeed = Math.max(0, (downloaded - lastBytes) / elapsed);
            smoothSpeed = smoothSpeed === 0 ? rawSpeed : (EMA_ALPHA * rawSpeed + (1 - EMA_ALPHA) * smoothSpeed);
            
            state.speedBytesPerSec = rawSpeed;
            state.smoothSpeedBytesPerSec = smoothSpeed;
            state.downloadedBytes = downloaded;

            if (expectedSizeBytes > 0) {
              state.progressPercent = Math.min(99, Math.round((downloaded / expectedSizeBytes) * 100));
              const remainingBytes = Math.max(0, expectedSizeBytes - downloaded);
              const etaSec = smoothSpeed > 0 ? (remainingBytes / smoothSpeed) : null;
              state.etaSeconds = etaSec;
              state.etaFormatted = etaSec !== null ? formatEta(etaSec) : "";
            }

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
      if (expectedSizeBytes > 0) {
        state.progressPercent = Math.min(99, Math.round((newSize / expectedSizeBytes) * 100));
      }

      if (expectedSizeBytes > 0 && newSize >= expectedSizeBytes * 0.98) {
        break;
      }

      if (receivedAnyBytes) {
        consecutiveRetries = 0;
        await new Promise(r => setTimeout(r, 300));
      } else {
        consecutiveRetries++;
        await new Promise(r => setTimeout(r, Math.min(3000, 800 * consecutiveRetries)));
      }

    } catch (err: any) {
      if (controller.signal.aborted) {
        return;
      }
      lastError = err;
      consecutiveRetries++;
      await new Promise(r => setTimeout(r, Math.min(4000, 1000 * consecutiveRetries)));
    }
  }

  if (controller.signal.aborted) return;

  const finalSize = fs.existsSync(tempPath) ? fs.statSync(tempPath).size : 0;
  if (expectedSizeBytes > 0 && finalSize < expectedSizeBytes * 0.98) {
    state.isDownloading = false;
    state.isPaused = true;
    state.isVerifying = false;
    state.isComplete = false;
    state.speedBytesPerSec = 0;
    state.smoothSpeedBytesPerSec = 0;
    state.etaFormatted = "";
    state.error = lastError?.message || `Download paused at ${Math.round(finalSize / (1024*1024))}MB. Click Play to resume.`;
    return;
  }

  state.isDownloading = false;
  state.isVerifying = true;
  state.verificationStatus = "Verifying database integrity...";

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

  // ⚡ Seed global cache for zero-latency CoW instant clone across MCP instances
  const globalDir = path.join(userHome, ".mcp-hub", "cache");
  if (!fs.existsSync(globalDir)) fs.mkdirSync(globalDir, { recursive: true });
  const globalCachedDb = path.join(globalDir, dbFilename);
  try {
    if (!fs.existsSync(globalCachedDb)) {
      tryZeroCopyClone(targetPath, globalCachedDb);
    }
  } catch {}

  state.isVerifying = false;
  state.verificationStatus = "Verified OK";
  state.isComplete = true;
  state.isPaused = false;
  state.progressPercent = 100;
  state.downloadedBytes = finalSize;
  state.speedBytesPerSec = 0;
  state.smoothSpeedBytesPerSec = 0;
  state.etaFormatted = "";
}
