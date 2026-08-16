import fs from "fs";
import path from "path";
import os from "os";

export const MCP_HUB_DIR = path.join(os.homedir(), '.mcp-hub');

export function getServerDir(serverNameOrId: string): string {
  const safe = (serverNameOrId || 'mcp-server').replace(/[^a-zA-Z0-9_-]/g, '_').trim();
  return path.join(MCP_HUB_DIR, 'servers', safe);
}

const diskUsageCache = new Map<string, { size: number; expiresAt: number }>();

export function invalidateDiskUsageCache(targetPath?: string) {
  if (targetPath) diskUsageCache.delete(targetPath);
  else diskUsageCache.clear();
}

/**
 * ⚡ Accurately measures the physical disk footprint of any file or directory.
 * Cycle-safe, traverses symlinks/junctions, and caches results for 2.5s for fast reactivity.
 */
export function getExactDiskUsage(
  targetPath: string, 
  skipDirs: string[] = ['.git', '.DS_Store', '.next'],
  visited: Set<string> = new Set()
): number {
  if (!targetPath || !fs.existsSync(targetPath)) return 0;

  // Resolve real path to avoid recursive symlink cycles
  let realPath = targetPath;
  try {
    realPath = fs.realpathSync(targetPath);
  } catch {
    realPath = targetPath;
  }

  if (visited.has(realPath)) return 0;
  visited.add(realPath);

  const cached = diskUsageCache.get(targetPath);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.size;
  }

  try {
    const stats = fs.statSync(targetPath);
    if (stats.isFile()) {
      diskUsageCache.set(targetPath, { size: stats.size, expiresAt: Date.now() + 2500 });
      return stats.size;
    }
    if (stats.isDirectory()) {
      let total = 0;
      let entries: string[] = [];
      try { 
        entries = fs.readdirSync(targetPath); 
      } catch { 
        return 0; 
      }
      for (const file of entries) {
        if (skipDirs.includes(file)) continue;
        const fullChild = path.join(targetPath, file);
        total += getExactDiskUsage(fullChild, skipDirs, visited);
      }
      diskUsageCache.set(targetPath, { size: total, expiresAt: Date.now() + 2500 });
      return total;
    }
  } catch { 
    return 0; 
  }
  return 0;
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1000;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return (i >= 3 ? val.toFixed(2) : (i >= 1 ? val.toFixed(1) : val.toFixed(0))) + ' ' + sizes[i];
}
