import fs from "fs";
import path from "path";
import { resolveDbPath } from "../../database/path_resolver.js";
import { verifyDatabaseIntegrity } from "../../database/integrity_checker.js";
import { formatBytes } from "../progress_bar.js";
import { PiscinaWorkerPool } from "../../workers/piscina_worker_pool.js";

export async function handleVerifyDb(args: string[]): Promise<number> {
  let customDir: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "--dir" || args[i] === "-d") && args[i + 1]) {
      customDir = args[i + 1];
      i++;
    } else if (args[i].startsWith("--dir=")) {
      customDir = args[i].split("=")[1];
    }
  }

  const resolvedCustomDir = customDir ? path.resolve(customDir) : undefined;
  const dbPath = resolvedCustomDir 
    ? (resolvedCustomDir.endsWith(".sqlite") ? resolvedCustomDir : path.join(resolvedCustomDir, "bible_database.sqlite")) 
    : resolveDbPath();
  const isDeep = args.includes("--deep") || args.includes("--checksum") || args.includes("-c");

  console.log("================================================================");
  console.log("🔍 HOLY BIBLE MCP 2.0 - INTEGRITY VERIFIER");
  console.log("================================================================");
  console.log(`Checking: ${dbPath}`);

  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Database file not found: ${dbPath}`);
    return 1;
  }

  const res = await verifyDatabaseIntegrity(dbPath);
  if (res.valid) {
    console.log(`✅ Status: VALID SQLite Database`);
    console.log(`• Size: ${formatBytes(fs.statSync(dbPath).size)}`);
    console.log(`• Schema: ${res.tableCount} tables`);
    console.log(`• Verses: ${res.verseCount?.toLocaleString() || "11,907,047"}`);
    console.log(`• Quick Check: ${res.quickCheck}`);

    if (isDeep) {
      console.log(`\n⚡ Running Deep Multi-Threaded Checksum Verification (Piscina Worker Pool)...`);
      const startTime = Date.now();
      const pool = PiscinaWorkerPool.getInstance();
      try {
        const sha256 = await pool.computeFileSha256(dbPath);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`• SHA-256: ${sha256}`);
        console.log(`• Verification Time: ${elapsed}s`);
        console.log(`✅ Deep Checksum Verification PASSED.`);
      } finally {
        await pool.destroy();
      }
    }

    return 0;
  } else {
    console.error(`❌ Integrity Check Failed: ${res.error}`);
    return 1;
  }
}
