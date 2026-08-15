#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { registerToolHandlers } from "./tools_registry.js";
import { registerResourceHandlers } from "./resources_repository.js";
import { registerPromptHandlers } from "./prompts_repository.js";
import { DirectiveStore } from "./directives/directive_store.js";
import { TransportManager } from "./transport_manager.js";
// Global process exception boundaries
process.on("unhandledRejection", (reason) => {
    console.error("[MCP PROCESS SAFEGUARD] Unhandled Promise Rejection:", reason);
});
process.on("uncaughtException", (error) => {
    console.error("[MCP PROCESS SAFEGUARD] Uncaught Exception:", error);
});
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
                subscribe: false,
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
    return server;
}
async function main() {
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
        await transportManager.shutdown();
        process.exit(0);
    };
    process.on("SIGINT", () => handleSignal("SIGINT"));
    process.on("SIGTERM", () => handleSignal("SIGTERM"));
}
main().catch((error) => {
    console.error("[MCP SERVER FATAL ERROR]:", error);
    process.exit(1);
});
