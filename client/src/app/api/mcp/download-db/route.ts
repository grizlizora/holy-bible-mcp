import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

interface DownloadState {
  isDownloading: boolean;
  progressPercent: number;
  downloadedBytes: number;
  totalBytes: number;
  speedBytesPerSec: number;
  isComplete: boolean;
  error: string | null;
}

let globalState: DownloadState = {
  isDownloading: false,
  progressPercent: 0,
  downloadedBytes: 0,
  totalBytes: 5881192448,
  speedBytesPerSec: 0,
  isComplete: false,
  error: null
};

const getDbPath = () => {
  const userHome = os.homedir();
  const dir = path.join(userHome, ".bible-mcp");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "bible_database.sqlite");
};

export async function GET() {
  const targetPath = getDbPath();
  const exists = fs.existsSync(targetPath);
  const size = exists ? fs.statSync(targetPath).size : 0;
  const isComplete = size >= 5800000000;

  if (isComplete && !globalState.isDownloading) {
    globalState.progressPercent = 100;
    globalState.downloadedBytes = size;
    globalState.isComplete = true;
  } else if (!globalState.isDownloading) {
    globalState.progressPercent = Math.min(100, Math.round((size / 5881192448) * 100));
    globalState.downloadedBytes = size;
    globalState.isComplete = isComplete;
  }

  return NextResponse.json({
    ...globalState,
    dbPath: targetPath,
    exists
  });
}

export async function POST() {
  if (globalState.isDownloading) {
    return NextResponse.json({ message: "Download already in progress", ...globalState });
  }

  const targetPath = getDbPath();
  const exists = fs.existsSync(targetPath);
  const size = exists ? fs.statSync(targetPath).size : 0;

  if (size >= 5800000000) {
    globalState.isComplete = true;
    globalState.progressPercent = 100;
    globalState.downloadedBytes = size;
    return NextResponse.json({ message: "Database already downloaded", ...globalState });
  }

  globalState.isDownloading = true;
  globalState.error = null;
  globalState.isComplete = false;

  // Background download task
  (async () => {
    const url = "https://huggingface.co/datasets/grizlizora/holy-bible-mcp/resolve/main/bible_database.sqlite";
    try {
      const response = await fetch(url, { headers: { "User-Agent": "HolyBibleMCP-Turbo/2.0" } });
      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const total = Number(response.headers.get("content-length")) || 5881192448;
      globalState.totalBytes = total;

      const fileStream = fs.createWriteStream(targetPath, { flags: "w" });
      const reader = (response.body as any).getReader();
      let downloaded = 0;
      let lastTime = Date.now();
      let lastBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          downloaded += value.length;
          fileStream.write(Buffer.from(value));

          const now = Date.now();
          const elapsed = (now - lastTime) / 1000;
          if (elapsed >= 0.5) {
            const speed = (downloaded - lastBytes) / elapsed;
            globalState.speedBytesPerSec = speed;
            globalState.downloadedBytes = downloaded;
            globalState.progressPercent = Math.min(100, Math.round((downloaded / total) * 100));
            lastTime = now;
            lastBytes = downloaded;
          }
        }
      }

      fileStream.end();
      globalState.isDownloading = false;
      globalState.isComplete = true;
      globalState.progressPercent = 100;
      globalState.downloadedBytes = total;
    } catch (err: any) {
      console.error("[DB DOWNLOAD ERROR]:", err);
      globalState.isDownloading = false;
      globalState.error = err.message || "Download failed";
    }
  })();

  return NextResponse.json({ message: "Download started", ...globalState });
}
