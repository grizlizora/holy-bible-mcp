import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function resolveDirectivesDbPath(): string {
  const candidatePaths = [
    process.env.DIRECTIVES_DB_PATH ? path.resolve(process.env.DIRECTIVES_DB_PATH) : null,
    process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR, "directives.sqlite") : null,
    path.resolve(process.cwd(), "data/directives.sqlite"),
    path.resolve(process.cwd(), "../data/directives.sqlite"),
    path.resolve(__dirname, "../../data/directives.sqlite"),
    path.resolve(__dirname, "../data/directives.sqlite"),
    path.resolve(__dirname, "data/directives.sqlite"),
    path.join(os.homedir(), ".mcp-hub", "servers", "Holy_Bible_Mcp", "data", "directives.sqlite"),
    path.join(os.homedir(), ".mcp-hub", "servers", "Holy_Bible_MCP", "data", "directives.sqlite"),
    path.join(os.homedir(), ".mcp-hub", "servers", "Holy_Bible_Mcp", "code", "data", "directives.sqlite"),
    path.join(os.homedir(), ".mcp-hub", "servers", "Holy_Bible_MCP", "code", "data", "directives.sqlite"),
    path.join(os.homedir(), ".bible-mcp", "directives.sqlite")
  ].filter(Boolean) as string[];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }

  return path.resolve(__dirname, "../../data/directives.sqlite");
}
