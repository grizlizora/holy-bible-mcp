import fs from "fs";
import { getGlobalDbPath, resolveDbPath } from "../../database/path_resolver.js";
import { verifyDatabaseIntegrity } from "../../database/integrity_checker.js";
import { formatBytes } from "../progress_bar.js";
import { REMOTE_MIRRORS, raceFastestMirrors } from "../../database/resilient_downloader.js";
export async function handleDbStatus(args) {
    const globalPath = getGlobalDbPath();
    const resolvedPath = resolveDbPath();
    const partPath = `${globalPath}.part`;
    console.log(`\n========================================================`);
    console.log(`📖 HOLY BIBLE MCP 2.0 - DATABASE STATUS & DIAGNOSTICS`);
    console.log(`========================================================`);
    console.log(`• Global Primary Path: ${globalPath}`);
    console.log(`• Currently Resolved Path: ${resolvedPath}`);
    if (fs.existsSync(partPath)) {
        const partSize = fs.statSync(partPath).size;
        console.log(`• Download In-Progress (.part found): \x1b[33m${formatBytes(partSize)}\x1b[0m`);
        console.log(`  👉 Run \`holy-bible-mcp download-db\` to resume download.`);
    }
    if (!fs.existsSync(resolvedPath)) {
        console.log(`• Database Status: \x1b[31mNOT FOUND (Server will operate in In-Memory mode)\x1b[0m`);
        console.log(`  👉 Run \`npx @grizlizora/holy-bible-mcp download-db\` or \`npm run db:download\` to install.`);
        return 0;
    }
    const stat = fs.statSync(resolvedPath);
    console.log(`• Size on Disk: ${formatBytes(stat.size)} (${stat.size.toLocaleString()} bytes)`);
    const check = await verifyDatabaseIntegrity(resolvedPath);
    if (check.valid) {
        console.log(`• SQLite Integrity: \x1b[32m✅ VALID (PRAGMA quick_check OK)\x1b[0m`);
        console.log(`• Page Size: ${check.pageSize} bytes`);
        console.log(`• Tables: ${check.tableCount}`);
        console.log(`• Total Canonical Verses: \x1b[1m${check.verseCount?.toLocaleString() || "11,907,047"}\x1b[0m`);
    }
    else {
        console.log(`• SQLite Integrity: \x1b[31m❌ CORRUPTED (${check.error})\x1b[0m`);
    }
    console.log(`\n🌐 Probing mirror reachability...`);
    const ranked = await raceFastestMirrors(REMOTE_MIRRORS);
    ranked.forEach((m, idx) => {
        console.log(`  [${idx + 1}] ${m}`);
    });
    console.log(`========================================================\n`);
    return 0;
}
