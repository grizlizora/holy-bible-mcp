import fs from "fs";
import path from "path";
import { getServerDir, getExactDiskUsage, formatBytes } from "./disk-analyzer";
import { remoteCodeSizeCache, fetchRemoteCodeSizeAsync } from "./remote-size-resolver";

export function detectInstalledCode(c: any): { installed: boolean; sizeBytes: number; sizeFormatted: string } {
  const serverDir = getServerDir(c.name || c.id);
  const targetManifestSize = c.dbManifest?.code?.sizeBytes ? Number(c.dbManifest.code.sizeBytes) : 0;
  const dedicatedCode = path.join(serverDir, 'code');

  // 1. Check dedicated server code directory (~/.mcp-hub/servers/<id>/code)
  if (fs.existsSync(dedicatedCode)) {
    const hasEntrypoint = fs.existsSync(path.join(dedicatedCode, 'build', 'index.js')) ||
                          fs.existsSync(path.join(dedicatedCode, 'dist', 'index.js')) ||
                          fs.existsSync(path.join(dedicatedCode, 'index.js'));
    const hasModules = fs.existsSync(path.join(dedicatedCode, 'node_modules'));
    const hasPkgJson = fs.existsSync(path.join(dedicatedCode, 'package.json'));

    if (hasEntrypoint || hasModules || hasPkgJson) {
      // ⚡ Dynamically measure real physical disk bytes!
      const realDiskSize = getExactDiskUsage(dedicatedCode);
      const displaySize = realDiskSize > 0 ? realDiskSize : (targetManifestSize > 0 ? targetManifestSize : 0);
      return { 
        installed: true, 
        sizeBytes: displaySize, 
        sizeFormatted: formatBytes(displaySize) 
      };
    }
  }

  // 2. Check local script execution (node/python/bun/etc.)
  if (c.command === 'node' || c.command === 'python3' || c.command === 'python' || c.command === 'bun') {
    const scriptArg = Array.isArray(c.args) ? c.args.find((a: string) => a.match(/\.(js|ts|py|mjs|cjs)$/)) : undefined;
    if (scriptArg && fs.existsSync(scriptArg)) {
      const scriptDir = path.dirname(scriptArg);
      const rootDir = path.resolve(scriptDir, '..');
      const nodeModulesDir = path.join(rootDir, 'node_modules');
      const buildDir = path.join(rootDir, 'build');
      const srcDir = path.join(rootDir, 'src');
      
      const realSize =
        (fs.existsSync(srcDir) ? getExactDiskUsage(srcDir) : 0) +
        (fs.existsSync(buildDir) ? getExactDiskUsage(buildDir) : getExactDiskUsage(scriptDir)) +
        (fs.existsSync(nodeModulesDir) ? getExactDiskUsage(nodeModulesDir) : 0);
        
      if (realSize > 0) {
        return { installed: true, sizeBytes: realSize, sizeFormatted: formatBytes(realSize) };
      }
    }

    const candidateDirs = [
      path.join(serverDir, 'code'),
      path.resolve(process.cwd(), '../mcp-server'),
      path.resolve(process.cwd(), './mcp-server'),
      path.resolve(process.cwd(), '../'),
    ];
    const foundDir = candidateDirs.find(d =>
      fs.existsSync(path.join(d, 'build', 'index.js')) || fs.existsSync(path.join(d, 'src', 'index.ts'))
    );
    if (foundDir) {
      const realSize =
        (fs.existsSync(path.join(foundDir, 'src')) ? getExactDiskUsage(path.join(foundDir, 'src')) : 0) +
        (fs.existsSync(path.join(foundDir, 'build')) ? getExactDiskUsage(path.join(foundDir, 'build')) : 0) +
        (fs.existsSync(path.join(foundDir, 'node_modules')) ? getExactDiskUsage(path.join(foundDir, 'node_modules')) : 0);
      if (realSize > 0) {
        return { installed: true, sizeBytes: realSize, sizeFormatted: formatBytes(realSize) };
      }
    }
  }

  // 3. Fallback: Not installed on disk yet — return expected/unpacked size from manifest or NPM
  if (targetManifestSize > 0) {
    return { installed: false, sizeBytes: targetManifestSize, sizeFormatted: formatBytes(targetManifestSize) };
  }

  if (c.command === 'npx' || c.command === 'uvx') {
    const pkgName = Array.isArray(c.args) ? (c.args.find((a: string) => !a.startsWith('-')) || '') : '';
    const remoteKey = c.githubRepo || pkgName || '';
    const cached = remoteCodeSizeCache.get(remoteKey);
    if (cached && cached.sizeBytes > 0) {
      return { installed: false, sizeBytes: cached.sizeBytes, sizeFormatted: formatBytes(cached.sizeBytes) };
    }
    fetchRemoteCodeSizeAsync(c.githubRepo, pkgName || undefined);
    return { installed: false, sizeBytes: 0, sizeFormatted: '' };
  }

  return { installed: false, sizeBytes: 0, sizeFormatted: '' };
}
