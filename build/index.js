#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { registerToolHandlers } from "./tools_registry.js";
import { registerResourceHandlers } from "./resources_repository.js";
import { registerPromptHandlers } from "./prompts_repository.js";
import { DirectiveStore } from "./directives/directive_store.js";
import { TransportManager } from "./transport_manager.js";
import { isCliCommand, runCli } from "./cli/index.js";
// Global process exception boundaries
process.on("unhandledRejection", (reason) => {
    console.error("[MCP PROCESS SAFEGUARD] Unhandled Promise Rejection:", reason);
});
process.on("uncaughtException", (error) => {
    console.error("[MCP PROCESS SAFEGUARD] Uncaught Exception:", error);
});
import { onDatabaseMounted, sqlitePool, clearQueryCache } from "./database.js";
import { ResourcePoolManager } from "./resources_repository.js";
export function createServerInstance() {
    const server = new Server({
        name: "holy-bible-mcp",
        version: "2.0.0"
    }, {
        capabilities: {
            tools: {
                listChanged: true
            },
            resources: {
                subscribe: true,
                listChanged: true
            },
            prompts: {
                listChanged: true
            },
            logging: {}
        }
    });
    registerToolHandlers(server);
    registerResourceHandlers(server);
    registerPromptHandlers(server);
    const unregisterMount = onDatabaseMounted(async () => {
        try {
            ResourcePoolManager.clearCache();
            clearQueryCache();
            await server.notification({ method: "notifications/resources/list_changed" });
            await server.notification({ method: "notifications/tools/list_changed" });
            // Emit updated notification for all active resource subscriptions
            const subscribedUris = ResourcePoolManager.getSubscribedUris();
            for (const uri of subscribedUris) {
                try {
                    await server.notification({
                        method: "notifications/resources/updated",
                        params: { uri }
                    });
                }
                catch (_) { }
            }
        }
        catch (_) { }
    });
    const origClose = server.close.bind(server);
    server.close = async () => {
        unregisterMount();
        return origClose();
    };
    return server;
}
async function main() {
    const cliArgs = process.argv.slice(2);
    // 🚀 1. Check if invoked as CLI command (e.g. download-db, delete-db, db-status, --help)
    if (isCliCommand(cliArgs)) {
        const exitCode = await runCli(cliArgs);
        process.exit(exitCode);
    }
    // 🚀 2. Boot MCP Server Mode (stdio / sse / dual)
    console.error("[MCP SERVER] 🚀 Booting Holy Bible MCP v2.0.0...");
    await DirectiveStore.getInstance().loadDirectives();
    const isSseExplicit = process.argv.includes("--sse") || process.env.MCP_TRANSPORT === "sse" || process.env.ENABLE_SSE === "true";
    const isDualExplicit = process.argv.includes("--dual") || process.env.MCP_TRANSPORT === "dual";
    const port = parseInt(process.env.MCP_PORT || process.env.PORT || "3001", 10);
    const host = process.env.MCP_HOST || "0.0.0.0";
    const mode = isDualExplicit ? "dual" : (isSseExplicit ? "sse" : "stdio");
    const transportManager = new TransportManager(createServerInstance);
    await transportManager.start({ mode, port, host });
    const handleSignal = async (signal) => {
        console.error(`[MCP SERVER] Received ${signal}. Initiating graceful shutdown...`);
        try {
            await transportManager.shutdown();
            await sqlitePool.drainAndClose(2000);
            const { PiscinaWorkerPool } = await import("./workers/piscina_worker_pool.js");
            await PiscinaWorkerPool.getInstance().destroy();
        }
        catch (_) { }
        process.exit(0);
    };
    process.on("SIGINT", () => handleSignal("SIGINT"));
    process.on("SIGTERM", () => handleSignal("SIGTERM"));
}
main().catch((error) => {
    console.error("[MCP SERVER FATAL ERROR]:", error);
    process.exit(1);
});
