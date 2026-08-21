import fs from "fs";
import path from "path";
import os from "os";

function copyDirRecursive(src: string, dest: string): void {
  try {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    const entries: fs.Dirent[] = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDirRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  } catch (_err) {
    // Non-fatal if sandbox blocks access to external user dirs
  }
}

function syncHubRuntime(): void {
  const buildSrc = path.resolve(process.cwd(), "build");
  const directivesSrc = path.resolve(process.cwd(), "data", "directives.sqlite");

  const hubDirs: string[] = [
    path.join(os.homedir(), ".mcp-hub", "servers", "Holy_Bible_MCP"),
    path.join(os.homedir(), ".mcp-hub", "servers", "holy-bible-mcp")
  ];

  for (const hubDir of hubDirs) {
    try {
      if (fs.existsSync(hubDir)) {
        const targetBuild = path.join(hubDir, "code", "build");
        if (fs.existsSync(path.join(hubDir, "code"))) {
          copyDirRecursive(buildSrc, targetBuild);
          console.log("[SYNC] Synced build -> " + targetBuild);
        }
        const targetData = path.join(hubDir, "data");
        fs.mkdirSync(targetData, { recursive: true });
        if (fs.existsSync(directivesSrc)) {
          fs.copyFileSync(directivesSrc, path.join(targetData, "directives.sqlite"));
          console.log("[SYNC] Synced directives.sqlite -> " + targetData);
        }
      }
    } catch (_err) {
      // Non-fatal if sandbox blocks access to external user dirs
    }
  }
}

syncHubRuntime();
