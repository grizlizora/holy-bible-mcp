import fs from "fs";
import path from "path";
import readline from "readline";
import { getGlobalDbDir, getGlobalDbPath } from "../../database/path_resolver.js";
import { formatBytes } from "../progress_bar.js";
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans.trim());
    }));
}
export async function handleDeleteDb(args) {
    const force = args.includes("--yes") || args.includes("-y") || args.includes("--force") || args.includes("-f");
    const dbPath = getGlobalDbPath();
    const dbDir = getGlobalDbDir();
    const filesToDelete = [
        dbPath,
        `${dbPath}-wal`,
        `${dbPath}-shm`,
        `${dbPath}.part`,
        `${dbPath}.tmp`
    ].filter(p => fs.existsSync(p));
    if (filesToDelete.length === 0) {
        console.log(`ℹ️ No Holy Bible database files found in ${dbDir}.`);
        return 0;
    }
    let totalBytes = 0;
    for (const f of filesToDelete) {
        try {
            totalBytes += fs.statSync(f).size;
        }
        catch { }
    }
    console.log(`\n🔍 Detected Holy Bible database files to remove:`);
    for (const f of filesToDelete) {
        const size = fs.statSync(f).size;
        console.log(`  • ${path.basename(f)} (${formatBytes(size)})`);
    }
    console.log(`📊 Total disk space to free: \x1b[1m${formatBytes(totalBytes)}\x1b[0m\n`);
    if (!force) {
        const answer = await askQuestion(`⚠️ Are you sure you want to delete the Holy Bible SQLite database (${formatBytes(totalBytes)})? [y/N]: `);
        if (!answer.match(/^[yYдД]/)) {
            console.log("🛑 Deletion cancelled.");
            return 0;
        }
    }
    let freedBytes = 0;
    for (const f of filesToDelete) {
        try {
            const size = fs.statSync(f).size;
            fs.unlinkSync(f);
            freedBytes += size;
            console.log(`🗑️ Removed: ${path.basename(f)}`);
        }
        catch (err) {
            console.error(`❌ Error removing ${f}: ${err.message}`);
        }
    }
    console.log(`\n✅ Database cleaned successfully! Disk space freed: \x1b[32m${formatBytes(freedBytes)}\x1b[0m\n`);
    return 0;
}
