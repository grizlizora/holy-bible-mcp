import { downloadDatabaseResumable } from "../../database/resilient_downloader.js";
export async function handleDownloadDb(args) {
    const force = args.includes("--force") || args.includes("-f");
    let customMirror;
    let targetPath;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--mirror" && args[i + 1]) {
            customMirror = args[i + 1];
            i++;
        }
        else if (args[i] === "--dir" && args[i + 1]) {
            const rawDir = args[i + 1];
            targetPath = rawDir.endsWith(".sqlite") ? rawDir : `${rawDir.replace(/\/$/, "")}/bible_database.sqlite`;
            i++;
        }
    }
    console.log("================================================================");
    console.log("📥 HOLY BIBLE MCP 2.0 - RESILIENT DATABASE DOWNLOADER");
    console.log("================================================================");
    const success = await downloadDatabaseResumable({
        force,
        customMirror,
        targetPath
    });
    return success ? 0 : 1;
}
