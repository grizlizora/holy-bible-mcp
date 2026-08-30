import { downloadDatabaseResumable } from "../../database/resilient_downloader.js";
export async function handleDownloadDb(args) {
    const force = args.includes("--force") || args.includes("-f");
    const checksum = args.includes("--checksum") || args.includes("--deep") || args.includes("-c");
    let customMirror;
    let targetPath;
    let profile = "full";
    for (let i = 0; i < args.length; i++) {
        if ((args[i] === "--mirror" || args[i] === "-m") && args[i + 1]) {
            customMirror = args[i + 1];
            i++;
        }
        else if (args[i].startsWith("--mirror=")) {
            customMirror = args[i].split("=")[1];
        }
        else if ((args[i] === "--dir" || args[i] === "-d") && args[i + 1]) {
            const rawDir = args[i + 1];
            targetPath = rawDir.endsWith(".sqlite") ? rawDir : `${rawDir.replace(/\/$/, "")}/bible_database.sqlite`;
            i++;
        }
        else if (args[i].startsWith("--dir=")) {
            const rawDir = args[i].split("=")[1];
            targetPath = rawDir.endsWith(".sqlite") ? rawDir : `${rawDir.replace(/\/$/, "")}/bible_database.sqlite`;
        }
        else if ((args[i] === "--profile" || args[i] === "-p") && args[i + 1]) {
            profile = args[i + 1].toLowerCase() === "lite" ? "lite" : "full";
            i++;
        }
        else if (args[i].startsWith("--profile=")) {
            profile = args[i].split("=")[1].toLowerCase() === "lite" ? "lite" : "full";
        }
    }
    console.log("================================================================");
    console.log(`📥 HOLY BIBLE MCP 2.0 - RESILIENT DATABASE DOWNLOADER [Profile: ${profile.toUpperCase()}]`);
    console.log("================================================================");
    const success = await downloadDatabaseResumable({
        force,
        customMirror,
        targetPath,
        profile,
        checksum
    });
    return success ? 0 : 1;
}
