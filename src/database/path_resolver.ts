import path from "path";
import os from "os";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getGlobalDbDir(): string {
  return path.join(os.homedir(), ".bible-mcp");
}

export function getGlobalDbPath(): string {
  return path.join(getGlobalDbDir(), "bible_database.sqlite");
}

export function isValidDb(dbPath: string | null | undefined): boolean {
  if (!dbPath) return false;
  try {
    return fs.existsSync(dbPath) && fs.statSync(dbPath).size > 1_000_000;
  } catch {
    return false;
  }
}

export function resolveDbPath(): string {
  const ENV_DB = (process.env.BIBLE_DB_PATH || process.env.MCP_DB_PATH || process.env.DATABASE_PATH)
    ? path.resolve(process.env.BIBLE_DB_PATH || process.env.MCP_DB_PATH || process.env.DATABASE_PATH!)
    : null;

  const GLOBAL_DB = getGlobalDbPath();
  const LOCAL_DEV_DB = path.resolve(__dirname, "../../data/processed/bible_database.sqlite");
  const CWD_DB = path.resolve(process.cwd(), "data/processed/bible_database.sqlite");

  const candidatePaths = [
    ENV_DB,
    GLOBAL_DB,                                    // 🥇 Primary canonical global shared path
    LOCAL_DEV_DB,                                 // 🥈 Local monorepo path if present
    CWD_DB,
    path.join(os.homedir(), ".holy-bible-mcp", "data", "bible_database.sqlite"),
    path.join(os.homedir(), ".mcp-hub", "servers", "Holy_Bible_MCP", "data", "bible_database.sqlite")
  ].filter(Boolean) as string[];

  const found = candidatePaths.find(p => isValidDb(p));
  return found || GLOBAL_DB;
}
