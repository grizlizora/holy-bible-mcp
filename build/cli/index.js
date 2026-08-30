import { handleDownloadDb } from "./commands/download_db.js";
import { handleDeleteDb } from "./commands/delete_db.js";
import { handleDbStatus } from "./commands/status_db.js";
import { handleVerifyDb } from "./commands/verify_db.js";
const CLI_COMMANDS = new Set([
    "download-db", "download", "fetch-db", "get-db",
    "delete-db", "clean-db", "clean", "purge-db", "rm-db",
    "db-status", "status", "info", "doctor",
    "verify-db", "verify", "check-db",
    "--help", "-h", "help",
    "--version", "-v"
]);
export function isCliCommand(args) {
    if (args.length === 0)
        return false;
    return args.some(arg => CLI_COMMANDS.has(arg.toLowerCase()));
}
export function printHelp() {
    console.log(`
📖 Holy Bible MCP 2.0 CLI Database Manager

USAGE:
  holy-bible-mcp <command> [options]
  npx @grizlizora/holy-bible-mcp <command> [options]

COMMANDS:
  download-db, download    Завантажити базу даних (~5.88 GB) з резюмуванням (Range)
  delete-db, clean         Безпечно видалити базу (.sqlite, -wal, -shm, .part)
  db-status, status        Перевірити статус бази, цілісність, розмір та дзеркала
  verify-db, verify        Повна перевірка цілісності SQLite (PRAGMA quick_check)
  --help, -h               Показати цю довідку
  --version, -v            Показати версію

OPTIONS:
  --force, -f              Примусове завантаження або перезапис
  --checksum, --deep       Глибока багатопотокова валідація SHA-256 (Piscina Worker Pool)
  --profile <full|lite>    Профіль бази даних (full: 800+ мов ~5.88GB, lite: базові мови)
  --dir <path>             Вказати кастомну директорію бази (default: ~/.bible-mcp)
  --mirror <url>           Вказати пряме дзеркало для завантаження
  --yes, -y                Автоматично підтвердити видалення

EXAMPLES:
  $ npx @grizlizora/holy-bible-mcp download-db
  $ npx @grizlizora/holy-bible-mcp delete-db --yes
  $ npx @grizlizora/holy-bible-mcp db-status
  $ npm run db:download
`);
}
export async function runCli(args) {
    // Find command token anywhere in arguments
    const cmdIndex = args.findIndex(a => CLI_COMMANDS.has(a.toLowerCase()));
    if (cmdIndex === -1) {
        console.error(`❌ Unknown command: ${args[0]}. Use --help for usage.`);
        return 1;
    }
    const cmd = args[cmdIndex].toLowerCase();
    const rest = args.filter((_, idx) => idx !== cmdIndex);
    if (cmd === "--help" || cmd === "-h" || cmd === "help") {
        printHelp();
        return 0;
    }
    if (cmd === "--version" || cmd === "-v") {
        console.log("holy-bible-mcp v2.0.0");
        return 0;
    }
    try {
        switch (cmd) {
            case "download-db":
            case "download":
            case "fetch-db":
            case "get-db":
                return await handleDownloadDb(rest);
            case "delete-db":
            case "clean-db":
            case "clean":
            case "purge-db":
            case "rm-db":
                return await handleDeleteDb(rest);
            case "db-status":
            case "status":
            case "info":
            case "doctor":
                return await handleDbStatus(rest);
            case "verify-db":
            case "verify":
            case "check-db":
                return await handleVerifyDb(rest);
            default:
                console.error(`❌ Unknown command: ${cmd}. Use --help for usage.`);
                return 1;
        }
    }
    catch (err) {
        console.error(`\n❌ CLI execution error:`, err.message || err);
        return 1;
    }
}
