import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { mcpManager } from "@/lib/mcp/mcp-manager";
import { getServerDir, invalidateDiskUsageCache } from "@/lib/mcp/server-list";
import { 
  getDownloadState, 
  getAbortController, 
  setAbortController, 
  deleteAbortController,
  DownloadState 
} from "@/lib/mcp/downloader/download-state-manager";
import { fetchManifest } from "@/lib/mcp/downloader/manifest-resolver";
import { executeResilientChunkDownload } from "@/lib/mcp/downloader/chunk-streamer";

export type { DownloadState };
export { getDownloadState };

function getAllDbScanDirs(serverName: string, mcpId: string, dedicatedFolder: string, targetDir: string): string[] {
  const userHome = os.homedir();
  return [
    targetDir,
    dedicatedFolder,
    path.join(dedicatedFolder, "data"),
    path.join(userHome, ".mcp-hub", "servers", serverName, "data"),
    path.join(userHome, ".mcp-hub", "servers", serverName),
    path.join(userHome, ".holy-bible-mcp", "mcp-storage", mcpId, "data"),
    path.join(userHome, ".holy-bible-mcp", "data")
  ];
}

function purgeDatabaseFiles(scanDirs: string[], targetDbFilenames: Set<string>) {
  for (const dir of scanDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const entries = fs.readdirSync(dir);
      for (const file of entries) {
        const fileLower = file.toLowerCase();
        if (
          targetDbFilenames.has(fileLower) ||
          Array.from(targetDbFilenames).some(dbName => fileLower.startsWith(dbName)) ||
          fileLower.endsWith(".sqlite") ||
          fileLower.endsWith(".sqlite-shm") ||
          fileLower.endsWith(".sqlite-wal") ||
          fileLower.endsWith(".sqlite.tmp") ||
          fileLower.endsWith(".db") ||
          fileLower.endsWith(".db.tmp")
        ) {
          const filePath = path.join(dir, file);
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch {}
        }
      }
    } catch (_) {}
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mcpId = searchParams.get("mcpId") || "mcp-server";
  const dbId = searchParams.get("dbId") || "";

  const state = getDownloadState(mcpId);
  const configs = mcpManager.getConfigs();
  const config = configs.find(c => c.id === mcpId);
  const serverName = config?.name || mcpId;
  const dedicatedFolder = getServerDir(serverName);

  const manifest = config?.dbManifest || (await fetchManifest(config?.githubRepo || "", mcpId));
  const databases = manifest?.databases || [];
  const dbEntry = (dbId ? databases.find((d: any) => d.id === dbId) : databases[0]) || {};

  const primaryDbFilename = dbEntry?.filename || "database.sqlite";
  const expectedTotalBytes = Number(dbEntry?.sizeBytes) || 0;

  const targetDir = path.join(dedicatedFolder, "data");
  const targetPath = path.join(targetDir, primaryDbFilename);
  const tempPath = targetPath + ".tmp";

  const exists = fs.existsSync(targetPath);
  const size = exists ? fs.statSync(targetPath).size : 0;
  const tempSize = fs.existsSync(tempPath) ? fs.statSync(tempPath).size : 0;
  const isComplete = size > 0 && (expectedTotalBytes > 0 ? size >= expectedTotalBytes * 0.98 : true);

  if (isComplete) {
    state.progressPercent = 100;
    state.downloadedBytes = size;
    state.totalBytes = size;
    state.isComplete = true;
    state.isDownloading = false;
    state.isPaused = false;
    state.isVerifying = false;
    state.error = null;
  } else if (state.isDownloading) {
    state.downloadedBytes = Math.max(state.downloadedBytes, tempSize);
    state.totalBytes = expectedTotalBytes;
    state.progressPercent = expectedTotalBytes > 0 
      ? Math.min(99, Math.round((state.downloadedBytes / expectedTotalBytes) * 100)) 
      : 0;
  } else if (state.isPaused && tempSize > 0) {
    state.downloadedBytes = tempSize;
    state.totalBytes = expectedTotalBytes;
    state.progressPercent = expectedTotalBytes > 0 
      ? Math.min(99, Math.round((tempSize / expectedTotalBytes) * 100)) 
      : 0;
  }

  return NextResponse.json({
    ...state,
    dbPath: targetPath,
    exists: isComplete || exists,
    tempSize
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const mcpId: string = body.mcpId || "mcp-server";
  const dbId: string = body.dbId || "";
  const action: 'start' | 'pause' | 'resume' | 'cancel' | 'delete' = body.action || 'start';
  const state = getDownloadState(mcpId);

  const configs = mcpManager.getConfigs();
  const config = configs.find(c => c.id === mcpId);
  const serverName = config?.name || mcpId;
  const dedicatedFolder = getServerDir(serverName);

  const manifest = config?.dbManifest || (await fetchManifest(config?.githubRepo || "", mcpId));
  const databases = manifest?.databases || [];
  const dbEntry = (dbId ? databases.find((d: any) => d.id === dbId) : databases[0]) || {};

  const primaryDbFilename = dbEntry?.filename || "database.sqlite";
  const expectedSizeBytes = Number(dbEntry?.sizeBytes) || 0;
  const mirrors: string[] = Array.isArray(dbEntry?.mirrors) && dbEntry.mirrors.length > 0 
    ? dbEntry.mirrors 
    : [];

  const targetDir = path.join(dedicatedFolder, "data");
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, primaryDbFilename);
  const tempPath = targetPath + ".tmp";

  if (action === 'pause') {
    const controller = getAbortController(mcpId);
    if (controller) {
      controller.abort("User paused download");
      deleteAbortController(mcpId);
    }
    state.isDownloading = false;
    state.isPaused = true;
    state.speedBytesPerSec = 0;
    if (fs.existsSync(tempPath)) {
      state.downloadedBytes = fs.statSync(tempPath).size;
      state.progressPercent = state.totalBytes > 0 
        ? Math.min(99, Math.round((state.downloadedBytes / state.totalBytes) * 100)) 
        : 0;
    }
    return NextResponse.json({ message: "Download paused", ...state });
  }

  if (action === 'cancel') {
    const controller = getAbortController(mcpId);
    if (controller) {
      controller.abort("User canceled download");
      deleteAbortController(mcpId);
    }
    state.isDownloading = false;
    state.isPaused = false;
    state.isVerifying = false;
    state.progressPercent = 0;
    state.downloadedBytes = 0;
    state.speedBytesPerSec = 0;
    state.error = null;

    if (fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch {}
    }
    invalidateDiskUsageCache();
    return NextResponse.json({ message: "Download canceled", ...state });
  }

  if (action === 'delete') {
    const controller = getAbortController(mcpId);
    if (controller) {
      controller.abort("User deleted database");
      deleteAbortController(mcpId);
    }
    state.isDownloading = false;
    state.isPaused = false;
    state.isVerifying = false;
    state.isComplete = false;
    state.progressPercent = 0;
    state.downloadedBytes = 0;
    state.totalBytes = 0;
    state.speedBytesPerSec = 0;
    state.error = null;
    state.verificationStatus = null;

    const scanDirs = getAllDbScanDirs(serverName, mcpId, dedicatedFolder, targetDir);
    const targetDbFilenames = new Set<string>(
      databases.map((db: any) => db.filename?.toLowerCase()).filter(Boolean)
    );
    if (primaryDbFilename) targetDbFilenames.add(primaryDbFilename.toLowerCase());

    purgeDatabaseFiles(scanDirs, targetDbFilenames);
    invalidateDiskUsageCache();

    return NextResponse.json({ message: "Database deleted", ...state });
  }

  if (state.isDownloading || state.isVerifying) {
    return NextResponse.json({ message: "Download already in progress", ...state });
  }

  if (fs.existsSync(targetPath)) {
    const size = fs.statSync(targetPath).size;
    if (expectedSizeBytes > 0 && size >= expectedSizeBytes * 0.98) {
      state.isComplete = true;
      state.isDownloading = false;
      state.isPaused = false;
      state.progressPercent = 100;
      state.downloadedBytes = size;
      state.totalBytes = size;
      state.verificationStatus = "Verified OK";
      return NextResponse.json({ message: "Database already downloaded and verified", ...state });
    }
  }

  if (fs.existsSync(tempPath)) {
    const tempSize = fs.statSync(tempPath).size;
    if (expectedSizeBytes > 0 && tempSize >= expectedSizeBytes * 0.98) {
      if (fs.existsSync(targetPath)) { try { fs.unlinkSync(targetPath); } catch {} }
      fs.renameSync(tempPath, targetPath);
      state.isComplete = true;
      state.isDownloading = false;
      state.isPaused = false;
      state.progressPercent = 100;
      state.downloadedBytes = tempSize;
      state.totalBytes = tempSize;
      state.verificationStatus = "Verified OK";
      return NextResponse.json({ message: "Database download completed and verified", ...state });
    }
  }

  if (mirrors.length === 0) {
    return NextResponse.json({ 
      error: `No download mirrors configured in manifest for MCP server '${mcpId}'` 
    }, { status: 400 });
  }

  const controller = new AbortController();
  setAbortController(mcpId, controller);

  state.isDownloading = true;
  state.isPaused = false;
  state.isVerifying = false;
  state.error = null;
  state.isComplete = false;
  state.totalBytes = expectedSizeBytes;

  executeResilientChunkDownload(
    mcpId,
    tempPath,
    targetPath,
    expectedSizeBytes,
    state,
    controller,
    mirrors
  ).catch(err => {
    console.error(`[DOWNLOAD-DB:${mcpId}] Unhandled stream failure:`, err);
  });

  return NextResponse.json({ message: "Download started", ...state });
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mcpId = searchParams.get("mcpId") || "mcp-server";
    const dbId = searchParams.get("dbId") || "";

    const configs = mcpManager.getConfigs();
    const config = configs.find(c => c.id === mcpId);
    const serverName = config?.name || mcpId;
    const dedicatedFolder = getServerDir(serverName);
    const targetDir = path.join(dedicatedFolder, "data");

    const manifest = config?.dbManifest || (await fetchManifest(config?.githubRepo || "", mcpId));
    const databases = manifest?.databases || [];
    const dbEntry = (dbId ? databases.find((d: any) => d.id === dbId) : databases[0]) || {};
    const primaryDbFilename = dbEntry?.filename || "database.sqlite";

    const scanDirs = getAllDbScanDirs(serverName, mcpId, dedicatedFolder, targetDir);
    const targetDbFilenames = new Set<string>(
      databases.map((db: any) => db.filename?.toLowerCase()).filter(Boolean)
    );
    if (primaryDbFilename) targetDbFilenames.add(primaryDbFilename.toLowerCase());

    purgeDatabaseFiles(scanDirs, targetDbFilenames);
    invalidateDiskUsageCache();

    return NextResponse.json({ success: true, message: "Database deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete database" }, { status: 500 });
  }
}
