import fs from "fs";
import path from "path";
import os from "os";
import { getServerDir, formatBytes } from "./disk-analyzer";
import { remoteManifestCache, remoteDbSizeCache, fetchRemoteDbSizeAsync } from "./remote-size-resolver";

import { resolveServerManifest } from "./code-detector";

export function detectDatabase(c: any): { hasDb: boolean; dbDownloaded: boolean; dbSizeBytes: number; dbSizeFormatted: string } {
  const serverDir = getServerDir(c.name || c.id);
  const manifest = resolveServerManifest(c, serverDir);

  if (!manifest || !manifest.databases || manifest.databases.length === 0) {
    return { hasDb: false, dbDownloaded: false, dbSizeBytes: 0, dbSizeFormatted: '' };
  }

  let totalSizeBytes = 0;
  let allDownloaded = true;
  let anyFound = false;

  for (const dbEntry of manifest.databases) {
    let savePath: string;
    if (dbEntry.savePath) {
      savePath = dbEntry.savePath
        .replace('{mcpId}', c.id)
        .replace('{serverDir}', serverDir)
        .replace('{home}', os.homedir());
      if (!path.isAbsolute(savePath)) {
        savePath = path.join(serverDir, 'data', dbEntry.filename);
      }
    } else {
      savePath = path.join(serverDir, 'data', dbEntry.filename);
    }

    const candidatePaths = [
      savePath,
      path.join(serverDir, 'data', dbEntry.filename),
      path.join(os.homedir(), '.mcp-hub', 'servers', 'Holy_Bible_MCP', 'data', dbEntry.filename),
      path.join(os.homedir(), '.holy-bible-mcp', 'mcp-storage', c.id, 'data', dbEntry.filename),
      path.join(os.homedir(), '.bible-mcp', dbEntry.filename)
    ];

    let foundDbPath = candidatePaths.find(p => fs.existsSync(p) && fs.statSync(p).size >= (dbEntry.sizeBytes ? dbEntry.sizeBytes * 0.9 : 1_000_000));
    if (foundDbPath) {
      const stat = fs.statSync(foundDbPath);
      totalSizeBytes += stat.size;
      anyFound = true;
      continue;
    }
    allDownloaded = false;
  }

  const expectedSize = manifest.databases.reduce((acc: number, db: any) => {
    if (db.sizeBytes) return acc + Number(db.sizeBytes);
    const probed = db.mirrors?.map((m: string) => remoteDbSizeCache.get(m)).find(Boolean);
    if (probed) return acc + Number(probed);
    fetchRemoteDbSizeAsync(db.mirrors || []);
    return acc;
  }, 0);

  const dbSizeFormatted = totalSizeBytes > 0
    ? formatBytes(totalSizeBytes)
    : expectedSize > 0 ? formatBytes(expectedSize) : '';

  return {
    hasDb: true,
    dbDownloaded: anyFound && allDownloaded,
    dbSizeBytes: totalSizeBytes,
    dbSizeFormatted
  };
}
