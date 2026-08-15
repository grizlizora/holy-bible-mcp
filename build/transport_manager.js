import http from "http";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { isDbReady, DB_PATH } from "./database.js";
export class TransportManager {
    serverFactory;
    stdioServer = null;
    sseSessions = new Map();
    httpServer = null;
    heartbeatInterval = null;
    constructor(serverFactory) {
        this.serverFactory = serverFactory;
    }
    async start(config) {
        if (config.mode === "stdio" || config.mode === "dual") {
            await this.startStdio();
        }
        if (config.mode === "sse" || config.mode === "dual") {
            await this.startSse(config.port, config.host);
        }
    }
    async startStdio() {
        this.stdioServer = this.serverFactory();
        const stdioTransport = new StdioServerTransport();
        stdioTransport.onerror = (err) => {
            console.error("[TRANSPORT STDIO ERROR]:", err);
        };
        stdioTransport.onclose = () => {
            console.error("[TRANSPORT STDIO CLOSED]");
            if (!this.httpServer) {
                process.exit(0);
            }
        };
        await this.stdioServer.connect(stdioTransport);
        console.error("[TRANSPORT] ⚡ Local Stdio IPC Transport active and connected.");
    }
    async startSse(port, host) {
        this.httpServer = http.createServer(async (req, res) => {
            // 1. Universal CORS Headers
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-session-id, mcp-session-id, cache-control, last-event-id");
            res.setHeader("Access-Control-Max-Age", "86400");
            if (req.method === "OPTIONS") {
                res.writeHead(204);
                res.end();
                return;
            }
            const urlObj = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
            // 2. Health & Status Check Endpoint
            if (urlObj.pathname === "/health" || urlObj.pathname === "/status") {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    name: "holy-bible-mcp",
                    version: "2.0.0",
                    status: "healthy",
                    protocolVersion: "2025-03-26",
                    databaseReady: isDbReady(),
                    databasePath: DB_PATH,
                    activeSseSessions: this.sseSessions.size,
                    memoryUsage: process.memoryUsage(),
                    uptimeSeconds: Math.floor(process.uptime()),
                    timestamp: new Date().toISOString()
                }, null, 2));
                return;
            }
            // 3. SSE Stream Connection Endpoint (GET /sse)
            if (urlObj.pathname === "/sse" && req.method === "GET") {
                res.setHeader("X-Accel-Buffering", "no"); // Prevents Nginx/reverse proxy buffering
                const sseTransport = new SSEServerTransport("/messages", res);
                const sessionId = sseTransport.sessionId;
                const sessionServer = this.serverFactory();
                this.sseSessions.set(sessionId, { transport: sseTransport, server: sessionServer, res });
                console.error(`[TRANSPORT SSE] 🟢 Client connected. Session ID: ${sessionId} (Active: ${this.sseSessions.size})`);
                const cleanup = () => {
                    if (this.sseSessions.has(sessionId)) {
                        this.sseSessions.delete(sessionId);
                        console.error(`[TRANSPORT SSE] 🔴 Client disconnected. Session ID: ${sessionId} (Active: ${this.sseSessions.size})`);
                    }
                };
                sseTransport.onclose = cleanup;
                res.on("close", cleanup);
                await sessionServer.connect(sseTransport);
                return;
            }
            // 4. Client Message Post Endpoint (POST /messages)
            if (urlObj.pathname.startsWith("/messages") && req.method === "POST") {
                const sessionId = urlObj.searchParams.get("sessionId") ||
                    req.headers["x-session-id"] ||
                    req.headers["mcp-session-id"];
                let targetEntry = sessionId ? this.sseSessions.get(sessionId) : undefined;
                if (!targetEntry && !sessionId && this.sseSessions.size === 1) {
                    targetEntry = this.sseSessions.values().next().value;
                }
                if (!targetEntry) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Session not found or expired. Re-establish GET /sse first." }));
                    return;
                }
                try {
                    await targetEntry.transport.handlePostMessage(req, res);
                }
                catch (err) {
                    console.error("[TRANSPORT SSE POST ERROR]:", err.message);
                    if (!res.headersSent) {
                        res.writeHead(500, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ error: "Failed to process message payload", details: err.message }));
                    }
                }
                return;
            }
            // 5. Default Root Info Response
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                server: "Holy Bible MCP Server v2.0",
                protocolVersion: "2025-03-26",
                capabilities: ["tools", "resources", "prompts", "logging"],
                endpoints: {
                    sseStream: "/sse",
                    messagePost: "/messages",
                    healthCheck: "/health"
                }
            }));
        });
        // 15-second heartbeat keepalive to prevent proxy disconnects
        this.heartbeatInterval = setInterval(() => {
            for (const [id, session] of this.sseSessions.entries()) {
                try {
                    if (session.res.writable) {
                        session.res.write(": keepalive\n\n");
                    }
                }
                catch (_) {
                    this.sseSessions.delete(id);
                }
            }
        }, 15000);
        this.httpServer.listen(port, host, () => {
            console.error(`[TRANSPORT SSE] 🌐 Remote SSE Server listening at http://${host}:${port}/sse`);
        });
    }
    async shutdown() {
        console.error("[TRANSPORT] Shutting down gracefully...");
        if (this.heartbeatInterval)
            clearInterval(this.heartbeatInterval);
        for (const [id, session] of this.sseSessions.entries()) {
            try {
                await session.transport.close();
            }
            catch (_) { }
        }
        this.sseSessions.clear();
        if (this.httpServer) {
            await new Promise((resolve) => this.httpServer.close(() => resolve()));
        }
    }
}
