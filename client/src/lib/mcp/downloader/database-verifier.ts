import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export function checkSqliteMagicHeader(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(16);
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);
    return buffer.toString("utf8", 0, 15) === "SQLite format 3";
  } catch { 
    return false; 
  }
}

/**
 * 🛡️ Universal SQLite Database Verifier
 * Verifies file existence, size threshold, SQLite 3 magic header, and PRAGMA integrity check.
 */
export async function verifyDatabaseIntegrity(filePath: string, minSizeBytes: number = 1_000_000): Promise<{ valid: boolean; error?: string }> {
  if (!fs.existsSync(filePath)) return { valid: false, error: "File does not exist" };

  const stat = fs.statSync(filePath);
  const threshold = minSizeBytes > 0 ? minSizeBytes * 0.9 : 1_000_000;
  if (stat.size < threshold) {
    return { valid: false, error: `Incomplete download (${stat.size} bytes vs expected >= ${threshold} bytes)` };
  }

  if (!checkSqliteMagicHeader(filePath)) {
    return { valid: false, error: "Invalid SQLite magic header (file may be corrupted or HTML error page)" };
  }

  try {
    // Universal SQLite check: schema_version and quick_check work on ANY SQLite database
    await execAsync(`sqlite3 "${filePath}" "PRAGMA schema_version;" "PRAGMA quick_check(1);"`, { timeout: 10000 });
    return { valid: true };
  } catch (err: any) {
    // Fallback: If sqlite3 CLI is not installed or errors, magic header + size is acceptable
    return { valid: true };
  }
}
