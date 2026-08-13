#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerToolHandlers } from "./tools_registry.js";
import { registerPromptHandlers } from "./prompts_repository.js";
const server = new Server({ name: "bible-mcp", version: "1.0.0" }, { capabilities: { tools: {}, prompts: {} } });
registerToolHandlers(server);
registerPromptHandlers(server);
async function main() {
    const transport = new StdioServerTransport();
    transport.onerror = (error) => {
        console.error("[MCP SERVER STDIO TRANSPORT ERROR]:", error);
    };
    transport.onclose = () => {
        console.error("[MCP SERVER STDIO TRANSPORT CLOSED]");
        process.exit(0);
    };
    await server.connect(transport);
    console.error("Holy Bible MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error starting Holy Bible MCP Server:", error);
    process.exit(1);
});
