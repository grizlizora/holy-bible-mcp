#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerToolHandlers } from "./tools_registry.js";
import { registerPromptHandlers } from "./prompts_repository.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import http from "http";
const server = new Server({ name: "holy-bible-mcp", version: "1.0.0" }, { capabilities: { tools: {}, prompts: {} } });
registerToolHandlers(server);
registerPromptHandlers(server);
async function main() {
    const isSseMode = process.argv.includes("--sse") || Boolean(process.env.PORT);
    const port = parseInt(process.env.PORT || "3001", 10);
    if (isSseMode) {
        let sseTransport = null;
        const httpServer = http.createServer(async (req, res) => {
            if (req.url === "/sse") {
                sseTransport = new SSEServerTransport("/messages", res);
                await server.connect(sseTransport);
            }
            else if (req.url?.startsWith("/messages") && sseTransport) {
                await sseTransport.handlePostMessage(req, res);
            }
            else {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ name: "holy-bible-mcp", status: "online", transport: "sse", port }));
            }
        });
        httpServer.listen(port, () => {
            console.error(`[MCP SERVER] 🌐 Remote SSE HTTP Transport active on http://0.0.0.0:${port}/sse`);
        });
    }
    else {
        const transport = new StdioServerTransport();
        transport.onerror = (error) => {
            console.error("[MCP SERVER STDIO TRANSPORT ERROR]:", error);
        };
        transport.onclose = () => {
            console.error("[MCP SERVER STDIO TRANSPORT CLOSED]");
            process.exit(0);
        };
        await server.connect(transport);
        console.error("[MCP SERVER] ⚡ Stdio Transport active");
    }
}
main().catch((error) => {
    console.error("Fatal error starting Holy Bible MCP Server:", error);
    process.exit(1);
});
