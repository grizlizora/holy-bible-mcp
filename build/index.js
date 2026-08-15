#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { registerToolHandlers } from "./tools_registry.js";
import { registerResourceHandlers } from "./resources_repository.js";
import { registerPromptHandlers } from "./prompts_repository.js";
import { DirectiveStore } from "./directives/directive_store.js";
import { TransportManager } from "./transport_manager.js";
// Initialize Master MCP Server with full triad capabilities (Tools, Resources, Prompts)
const server = new Server({
    name: "holy-bible-mcp",
    version: "1.1.0"
}, {
    capabilities: {
        tools: {},
        resources: {
            subscribe: false,
            listChanged: true
        },
        prompts: {
            listChanged: true
        }
    }
});
// Register All Protocol Subsystems
registerToolHandlers(server);
registerResourceHandlers(server);
registerPromptHandlers(server);
async function main() {
    console.error("[MCP SERVER] 🚀 Booting Holy Bible MCP v1.1.0...");
    // 1. Pre-compile in-memory directive tables on boot (0.0ms runtime lookups)
    await DirectiveStore.getInstance().loadDirectives();
    // 2. Resolve Transport Configuration
    const isSseExplicit = process.argv.includes("--sse") || process.env.MCP_TRANSPORT === "sse" || process.env.ENABLE_SSE === "true";
    const isDualExplicit = process.argv.includes("--dual") || process.env.MCP_TRANSPORT === "dual";
    const port = parseInt(process.env.MCP_PORT || process.env.PORT || "3001", 10);
    const host = process.env.MCP_HOST || "0.0.0.0";
    let mode = "stdio";
    if (isDualExplicit) {
        mode = "dual";
    }
    else if (isSseExplicit) {
        mode = "sse";
    }
    const transportManager = new TransportManager(server);
    await transportManager.start({ mode, port, host });
    // 3. Graceful Shutdown Handlers
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
