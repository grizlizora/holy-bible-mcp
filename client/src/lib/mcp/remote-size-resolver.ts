export const remoteCodeSizeCache = new Map<string, { sizeBytes: number; expiresAt: number }>();
export const remoteManifestCache = new Map<string, any>();
export const remoteDbSizeCache = new Map<string, number>();

/**
 * 🌐 Smart Multi-Source Remote Size Resolver
 * Queries NPM Registry, GitHub raw manifests, GitHub API, and CDN headers
 * to predict exact pre-download payload sizes for any MCP server.
 */
export function fetchRemoteCodeSizeAsync(githubRepo?: string, npmPackage?: string): void {
  const key = githubRepo || npmPackage || '';
  if (!key) return;

  const cached = remoteCodeSizeCache.get(key);
  if (cached && Date.now() < cached.expiresAt) return;

  (async () => {
    try {
      // 1. Try resolving via NPM Registry first (most accurate for NPX packages)
      if (npmPackage) {
        try {
          const cleanPkg = npmPackage.replace(/@[^/]+$/, '').replace(/^npx\s+/, '').trim();
          const npmRes = await fetch(
            `https://registry.npmjs.org/${encodeURIComponent(cleanPkg)}/latest`,
            { signal: AbortSignal.timeout(3500) }
          );
          if (npmRes.ok) {
            const npmData = await npmRes.json();
            if (npmData?.dist?.unpackedSize && Number(npmData.dist.unpackedSize) > 0) {
              const unpacked = Number(npmData.dist.unpackedSize);
              remoteCodeSizeCache.set(key, { sizeBytes: unpacked, expiresAt: Date.now() + 3600_000 });
              if (npmPackage) remoteCodeSizeCache.set(npmPackage, { sizeBytes: unpacked, expiresAt: Date.now() + 3600_000 });
              return;
            }
          }
        } catch (_) {}
      }

      // 2. Try resolving via GitHub Manifest or GitHub Repo Size
      if (githubRepo) {
        const repoPath = githubRepo
          .replace('https://github.com/', '')
          .replace(/\/$/, '');

        // 2a. Check GitHub raw manifest
        const branches = ['main', 'master'];
        for (const branch of branches) {
          try {
            const res = await fetch(
              `https://raw.githubusercontent.com/${repoPath}/${branch}/mcp-manifest.json`,
              { signal: AbortSignal.timeout(3000) }
            );
            if (res.ok) {
              const manifest = await res.json();
              remoteManifestCache.set(key, manifest);
              remoteManifestCache.set(repoPath, manifest);
              if (manifest?.code?.sizeBytes) {
                const manifestSize = Number(manifest.code.sizeBytes);
                remoteCodeSizeCache.set(key, { sizeBytes: manifestSize, expiresAt: Date.now() + 3600_000 });
                return;
              }
            }
          } catch (_) {}
        }

        // 2b. Check GitHub API repo size
        try {
          const ghApiRes = await fetch(`https://api.github.com/repos/${repoPath}`, {
            headers: { 'User-Agent': 'MCP-Hub-Client' },
            signal: AbortSignal.timeout(4000)
          });
          if (ghApiRes.ok) {
            const repoData = await ghApiRes.json();
            if (repoData.size) {
              remoteCodeSizeCache.set(key, { sizeBytes: repoData.size * 1024, expiresAt: Date.now() + 3600_000 });
            }
          }
        } catch (_) {}
      }
    } catch (_) {}
  })();
}

/**
 * ⚡ Probes remote mirrors to determine true database sizes via HTTP HEAD Content-Length.
 */
export function fetchRemoteDbSizeAsync(mirrors: string[]): void {
  for (const url of (mirrors || [])) {
    if (!url || remoteDbSizeCache.has(url)) continue;
    (async () => {
      try {
        const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
        const cl = res.headers.get('content-length');
        if (cl && Number(cl) > 0) {
          remoteDbSizeCache.set(url, Number(cl));
        }
      } catch (_) {}
    })();
  }
}
