import http from "http";
import crypto from "crypto";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { isDbReady, DB_PATH } from "../database.js";
import { TOOL_DEFINITIONS } from "../tools/definitions.js";
import { executeToolDirectly } from "../tools/index.js";
export class RateLimiter {
    requests = new Map();
    maxRequests;
    windowMs;
    static MAX_TRACKED_IPS = 10000;
    constructor(maxRequests = 120, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }
    check(ip) {
        const now = Date.now();
        // Prevent memory exhaustion attacks via spoofed IP explosion
        if (this.requests.size >= RateLimiter.MAX_TRACKED_IPS) {
            this.cleanup();
            if (this.requests.size >= RateLimiter.MAX_TRACKED_IPS) {
                this.requests.clear();
            }
        }
        let record = this.requests.get(ip);
        if (!record || now > record.resetAt) {
            record = { count: 1, resetAt: now + this.windowMs };
            this.requests.set(ip, record);
            return { limited: false, remaining: this.maxRequests - 1, retryAfter: 0 };
        }
        record.count++;
        if (record.count > this.maxRequests) {
            const retryAfter = Math.ceil((record.resetAt - now) / 1000);
            return { limited: true, remaining: 0, retryAfter };
        }
        return { limited: false, remaining: this.maxRequests - record.count, retryAfter: 0 };
    }
    cleanup() {
        const now = Date.now();
        for (const [ip, record] of this.requests.entries()) {
            if (now > record.resetAt) {
                this.requests.delete(ip);
            }
        }
    }
}
export class HttpHealthServer {
    httpServer = null;
    rateLimiter;
    cleanupInterval = null;
    constructor(maxRequestsPerMinute = 120) {
        this.rateLimiter = new RateLimiter(maxRequestsPerMinute);
    }
    validateAuthToken(req, urlObj) {
        const requiredToken = process.env.MCP_AUTH_TOKEN || process.env.AUTH_TOKEN;
        if (!requiredToken || !requiredToken.trim()) {
            return true; // No auth token configured = open mode
        }
        const trimmedRequired = requiredToken.trim();
        let providedToken = "";
        const authHeader = req.headers["authorization"] || "";
        if (authHeader.startsWith("Bearer ")) {
            providedToken = authHeader.slice(7).trim();
        }
        else {
            const queryToken = urlObj.searchParams.get("token") || urlObj.searchParams.get("auth");
            if (queryToken) {
                providedToken = queryToken.trim();
            }
        }
        if (!providedToken)
            return false;
        const bufProvided = Buffer.from(providedToken);
        const bufRequired = Buffer.from(trimmedRequired);
        if (bufProvided.length !== bufRequired.length)
            return false;
        return crypto.timingSafeEqual(bufProvided, bufRequired);
    }
    createRequestHandler(sessionManager, serverFactory) {
        return async (req, res) => {
            if (typeof res?.on === "function") {
                res.on("error", (err) => {
                    if (err?.code !== "EPIPE" && err?.code !== "ECONNRESET") {
                        console.warn("[TRANSPORT HTTP RES ERROR]:", err?.message || err);
                    }
                });
            }
            if (typeof req?.on === "function") {
                req.on("error", (err) => {
                    if (err?.code !== "ECONNRESET") {
                        console.warn("[TRANSPORT HTTP REQ ERROR]:", err?.message || err);
                    }
                });
            }
            // Universal CORS
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-session-id, mcp-session-id, cache-control, last-event-id");
            res.setHeader("Access-Control-Max-Age", "86400");
            // 🛡️ Enterprise Security Headers
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("X-Frame-Options", "DENY");
            res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
            res.setHeader("Referrer-Policy", "no-referrer");
            res.setHeader("X-XSS-Protection", "1; mode=block");
            if (req.method === "OPTIONS") {
                res.writeHead(204);
                res.end();
                return;
            }
            const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
                req.socket.remoteAddress ||
                "127.0.0.1";
            const urlObj = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
            // 🛡️ 1. Rate Limiting Check (DoS Protection)
            const rateLimitResult = this.rateLimiter.check(clientIp);
            res.setHeader("X-RateLimit-Remaining", rateLimitResult.remaining);
            if (rateLimitResult.limited) {
                res.setHeader("Retry-After", rateLimitResult.retryAfter);
                res.writeHead(429, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    error: "Too Many Requests",
                    message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
                    retryAfterSeconds: rateLimitResult.retryAfter
                }));
                return;
            }
            // Metrics (Prometheus formatted endpoint)
            if (urlObj.pathname === "/metrics") {
                res.writeHead(200, { "Content-Type": "text/plain; version=0.0.4" });
                res.end([
                    "# HELP holy_bible_mcp_uptime_seconds Process uptime in seconds",
                    "# TYPE holy_bible_mcp_uptime_seconds gauge",
                    `holy_bible_mcp_uptime_seconds ${Math.floor(process.uptime())}`,
                    "# HELP holy_bible_mcp_requests_total Total number of HTTP requests",
                    "# TYPE holy_bible_mcp_requests_total counter",
                    `holy_bible_mcp_requests_total ${Math.max(1, 100 - rateLimitResult.remaining)}`,
                    "# HELP holy_bible_mcp_sse_active_sessions Active SSE clients connected",
                    "# TYPE holy_bible_mcp_sse_active_sessions gauge",
                    `holy_bible_mcp_sse_active_sessions ${sessionManager.size}`
                ].join("\n") + "\n");
                return;
            }
            // Smithery / Well-Known Server Card Endpoint
            if (urlObj.pathname.endsWith("server-card.json") || urlObj.pathname.includes("server-card")) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    serverInfo: {
                        name: "holy-bible",
                        version: "2.0.0"
                    },
                    authentication: {
                        required: false
                    },
                    tools: TOOL_DEFINITIONS,
                    resources: [
                        {
                            uri: "bible://versions",
                            name: "Available Bible Versions",
                            description: "Lists all installed and available biblical translation versions.",
                            mimeType: "application/json"
                        }
                    ],
                    prompts: [
                        {
                            name: "theological_exegesis",
                            description: "Generates an in-depth Historical-Grammatical & Canonical Exegesis on a scripture passage or doctrinal topic."
                        }
                    ]
                }, null, 2));
                return;
            }
            // Health / Status (Public unauthenticated diagnostic endpoint)
            if (urlObj.pathname === "/health" || urlObj.pathname === "/status") {
                const authConfigured = Boolean(process.env.MCP_AUTH_TOKEN || process.env.AUTH_TOKEN);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    name: "holy-bible",
                    version: "2.0.0",
                    status: "healthy",
                    protocolVersion: "2025-03-26",
                    databaseReady: isDbReady(),
                    databasePath: DB_PATH,
                    activeSseSessions: sessionManager.size,
                    authEnabled: authConfigured,
                    rateLimitRemaining: rateLimitResult.remaining,
                    memoryUsage: process.memoryUsage(),
                    uptimeSeconds: Math.floor(process.uptime()),
                    timestamp: new Date().toISOString()
                }, null, 2));
                return;
            }
            // 🔒 2. Bearer Authentication Check for SSE and Messages
            const isMcpPath = urlObj.pathname === "/sse" ||
                urlObj.pathname === "/" ||
                urlObj.pathname === "/mcp" ||
                urlObj.pathname.startsWith("/messages");
            if (isMcpPath) {
                if (!this.validateAuthToken(req, urlObj)) {
                    res.writeHead(401, { "Content-Type": "application/json", "WWW-Authenticate": "Bearer" });
                    res.end(JSON.stringify({
                        error: "Unauthorized",
                        message: "Missing or invalid Bearer token in Authorization header or '?token=' query parameter."
                    }));
                    return;
                }
            }
            // SSE Stream (GET /sse or GET / with event-stream or GET /mcp)
            const wantsSse = urlObj.pathname === "/sse" ||
                urlObj.pathname === "/mcp" ||
                (urlObj.pathname === "/" && (req.headers.accept?.includes("text/event-stream") || req.headers["x-smithery-client"] || !req.headers.accept?.includes("text/html")));
            if (wantsSse && req.method === "GET") {
                res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
                res.setHeader("Cache-Control", "no-cache, no-transform");
                res.setHeader("Connection", "keep-alive");
                res.setHeader("X-Accel-Buffering", "no");
                const sseTransport = new SSEServerTransport("/messages", res);
                const sessionId = sseTransport.sessionId;
                const sessionServer = serverFactory();
                sessionManager.register(sessionId, { transport: sseTransport, server: sessionServer, res });
                console.error(`[TRANSPORT SSE] 🟢 Client connected. Session ID: ${sessionId} (Active: ${sessionManager.size})`);
                let cleanedUp = false;
                let disconnectTimer = null;
                const cleanup = async () => {
                    if (cleanedUp)
                        return;
                    cleanedUp = true;
                    if (disconnectTimer) {
                        clearTimeout(disconnectTimer);
                        disconnectTimer = null;
                    }
                    console.error(`[TRANSPORT SSE] 🔴 Client stream terminated. Session ID: ${sessionId}`);
                    sessionManager.remove(sessionId);
                    try {
                        await sseTransport.close();
                    }
                    catch (_) { }
                    try {
                        await sessionServer.close();
                    }
                    catch (_) { }
                };
                const onStreamPause = () => {
                    console.error(`[TRANSPORT SSE] 🟡 Client stream paused/disconnected. Session ID: ${sessionId} (Grace period: 30s)`);
                    if (!disconnectTimer && !cleanedUp) {
                        disconnectTimer = setTimeout(() => {
                            cleanup();
                        }, 30000);
                    }
                };
                sseTransport.onclose = cleanup;
                res.on("close", onStreamPause);
                res.on("error", onStreamPause);
                req.on("close", onStreamPause);
                req.on("error", onStreamPause);
                try {
                    await sessionServer.connect(sseTransport);
                }
                catch (connErr) {
                    console.error(`[TRANSPORT SSE CONNECT ERROR]:`, connErr?.message || connErr);
                    await cleanup();
                }
                return;
            }
            // POST Messages (Streamable HTTP & SSE transport)
            const isMessagePost = (urlObj.pathname.startsWith("/messages") ||
                urlObj.pathname === "/" ||
                urlObj.pathname === "/sse" ||
                urlObj.pathname === "/mcp") && req.method === "POST";
            if (isMessagePost) {
                // 1. Buffer incoming payload with size limit (4MB DoS protection)
                const MAX_BODY_SIZE_BYTES = 4 * 1024 * 1024;
                let receivedBytes = 0;
                const chunks = [];
                for await (const chunk of req) {
                    const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
                    receivedBytes += buf.length;
                    if (receivedBytes > MAX_BODY_SIZE_BYTES) {
                        res.writeHead(413, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ error: "Payload Too Large", message: "Request body exceeds maximum allowed size (4MB)" }));
                        req.destroy();
                        return;
                    }
                    chunks.push(buf);
                }
                const rawBody = Buffer.concat(chunks).toString("utf-8");
                let jsonBody = null;
                try {
                    if (rawBody.trim().length > 0) {
                        jsonBody = JSON.parse(rawBody);
                    }
                }
                catch (_) { }
                // 🚀 Direct JSON-RPC / Streamable HTTP support for Glama, ChatGPT, and standalone callers
                if (jsonBody && jsonBody.jsonrpc === "2.0") {
                    const id = jsonBody.id;
                    const method = jsonBody.method;
                    // Handshake: initialize
                    if (method === "initialize") {
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({
                            jsonrpc: "2.0",
                            id,
                            result: {
                                protocolVersion: "2024-11-05",
                                capabilities: {
                                    tools: { listChanged: true },
                                    resources: { subscribe: true, listChanged: true },
                                    prompts: { listChanged: true },
                                    logging: {}
                                },
                                serverInfo: {
                                    name: "holy-bible-mcp",
                                    version: "2.0.0"
                                }
                            }
                        }));
                        return;
                    }
                    // Initialized notification
                    if (method === "notifications/initialized") {
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ jsonrpc: "2.0" }));
                        return;
                    }
                    // Ping
                    if (method === "ping") {
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ jsonrpc: "2.0", id, result: {} }));
                        return;
                    }
                    // Tools list
                    if (method === "tools/list") {
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({
                            jsonrpc: "2.0",
                            id,
                            result: {
                                tools: TOOL_DEFINITIONS
                            }
                        }));
                        return;
                    }
                    // Resources list
                    if (method === "resources/list") {
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({
                            jsonrpc: "2.0",
                            id,
                            result: {
                                resources: [
                                    {
                                        uri: "bible://versions",
                                        name: "Available Bible Versions",
                                        description: "Lists all installed biblical translation versions.",
                                        mimeType: "application/json"
                                    }
                                ]
                            }
                        }));
                        return;
                    }
                    // Prompts list
                    if (method === "prompts/list") {
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({
                            jsonrpc: "2.0",
                            id,
                            result: {
                                prompts: [
                                    {
                                        name: "theological_exegesis",
                                        description: "Generates an in-depth Historical-Grammatical & Canonical Exegesis on a scripture passage or doctrinal topic."
                                    }
                                ]
                            }
                        }));
                        return;
                    }
                    // Direct Tool Call via JSON-RPC
                    if (method === "tools/call") {
                        const toolName = jsonBody.params?.name;
                        const toolArgs = jsonBody.params?.arguments || {};
                        try {
                            const toolResult = await executeToolDirectly(toolName, toolArgs);
                            res.writeHead(200, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({
                                jsonrpc: "2.0",
                                id,
                                result: toolResult
                            }));
                        }
                        catch (callErr) {
                            res.writeHead(200, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({
                                jsonrpc: "2.0",
                                id,
                                error: {
                                    code: -32603,
                                    message: callErr?.message || "Tool execution failed"
                                }
                            }));
                        }
                        return;
                    }
                }
                // 2. Target SSE Session transport (Strict routing with single-session proxy fallback)
                const sessionId = urlObj.searchParams.get("sessionId") ||
                    urlObj.searchParams.get("session_id") ||
                    req.headers["x-session-id"] ||
                    req.headers["mcp-session-id"];
                const targetEntry = sessionId
                    ? sessionManager.get(sessionId)
                    : (sessionManager.size === 1 ? sessionManager.getFirst() : undefined);
                if (sessionId && !targetEntry) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        jsonrpc: "2.0",
                        id: jsonBody?.id || null,
                        error: { code: -32001, message: `Session not found: ${sessionId}` }
                    }));
                    return;
                }
                if (targetEntry) {
                    try {
                        await targetEntry.transport.handlePostMessage(req, res, jsonBody);
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
                // If no active SSE session and not matched above, return a friendly JSON response
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    jsonrpc: "2.0",
                    id: jsonBody?.id || null,
                    result: { status: "ok", message: "Holy Bible MCP received request" }
                }));
                return;
            }
            // Default info / Diagnostic Server Card
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                name: "holy-bible",
                server: "Holy Bible MCP Server v2.0",
                protocolVersion: "2025-03-26",
                capabilities: {
                    tools: { listChanged: true },
                    resources: { subscribe: true, listChanged: true },
                    prompts: { listChanged: true }
                },
                endpoints: {
                    sseStream: "/sse",
                    messagePost: "/messages",
                    healthCheck: "/health"
                }
            }));
        };
    }
    async start(port, host, sessionManager, serverFactory) {
        this.cleanupInterval = setInterval(() => this.rateLimiter.cleanup(), 60000);
        const handler = this.createRequestHandler(sessionManager, serverFactory);
        this.httpServer = http.createServer(handler);
        sessionManager.startHeartbeat(15000);
        return new Promise((resolve) => {
            this.httpServer.listen(port, host, () => {
                console.error(`[TRANSPORT SSE] 🌐 Remote SSE Server listening at http://${host}:${port}/sse`);
                resolve(this.httpServer);
            });
        });
    }
    async close() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        if (this.httpServer) {
            await new Promise((resolve) => this.httpServer.close(() => resolve()));
            this.httpServer = null;
        }
    }
}
