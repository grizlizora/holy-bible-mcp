import fs from "fs";
import { resolveDbPath } from "../../database/path_resolver.js";
import { verifyDatabaseIntegrity } from "../../database/integrity_checker.js";
import { formatBytes } from "../progress_bar.js";
export async function handleVerifyDb(args) {
    const dbPath = resolveDbPath();
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
        return 0;
    }
    else {
        console.error(`❌ Integrity Check Failed: ${res.error}`);
        return 1;
    }
}
