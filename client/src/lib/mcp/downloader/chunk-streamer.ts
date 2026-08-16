import fs from "fs";
import path from "path";
import { DownloadState } from "./download-state-manager";
import { verifyDatabaseIntegrity } from "./database-verifier";

/**
 * ⚡ Universal Resilient Chunk & Range Streamer Engine
 * 100% agnostic to any MCP server, database format, or hosting platform.
 * Dynamically streams and resumes from whatever mirrors are declared in the MCP manifest.
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

  let lastError: Error | null = null;
  let consecutiveRetries = 0;
  const maxRetries = 50;

  while (consecutiveRetries < maxRetries) {
    if (controller.signal.aborted) break;

    const currentDownloaded = fs.existsSync(tempPath) ? fs.statSync(tempPath).size : 0;
    const completionThreshold = expectedSizeBytes > 0 ? expectedSizeBytes * 0.98 : 1;
    if (expectedSizeBytes > 0 && currentDownloaded >= completionThreshold) {
      break;
    }

    state.downloadedBytes = currentDownloaded;
    state.progressPercent = expectedSizeBytes > 0 ? Math.min(99, Math.round((currentDownloaded / expectedSizeBytes) * 100)) : 0;

    const mirrorIndex = (Math.floor(consecutiveRetries / 2)) % mirrors.length;
    const url = mirrors[mirrorIndex];

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
        if (expectedSizeBytes > 0 && finalSize >= expectedSizeBytes * 0.95) break;
      }

      if (!response.ok && response.status !== 206 && response.status !== 200) {
        throw new Error(`HTTP ${response.status} ${response.statusText} from mirror ${url}`);
      }

      const isPartial = response.status === 206;
      let downloaded = isPartial ? currentDownloaded : 0;

      // 🛡️ Zero-Corruption: If server returned full file (200), overwrite from byte 0
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
            if (expectedSizeBytes > 0) {
              state.progressPercent = Math.min(99, Math.round((downloaded / expectedSizeBytes) * 100));
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
  if (expectedSizeBytes > 0 && finalSize < expectedSizeBytes * 0.98) {
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

  state.isVerifying = false;
  state.verificationStatus = "Verified OK";
  state.isComplete = true;
  state.isPaused = false;
  state.progressPercent = 100;
  state.downloadedBytes = finalSize;
  state.speedBytesPerSec = 0;
}
