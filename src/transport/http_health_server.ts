import http from "http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { isDbReady, DB_PATH } from "../database.js";
import { SseSessionManager } from "./sse_session_manager.js";

export class RateLimiter {
  private requests = new Map<string, { count: number; resetAt: number }>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 120, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  public check(ip: string): { limited: boolean; remaining: number; retryAfter: number } {
    const now = Date.now();
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

  public cleanup(): void {
    const now = Date.now();
    for (const [ip, record] of Array.from(this.requests.entries())) {
      if (now > record.resetAt) {
        this.requests.delete(ip);
      }
    }
  }
}

export class HttpHealthServer {
  private httpServer: http.Server | null = null;
  private rateLimiter: RateLimiter;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxRequestsPerMinute = 120) {
    this.rateLimiter = new RateLimiter(maxRequestsPerMinute);
  }

  private validateAuthToken(req: http.IncomingMessage, urlObj: URL): boolean {
    const requiredToken = process.env.MCP_AUTH_TOKEN || process.env.AUTH_TOKEN;
    if (!requiredToken || !requiredToken.trim()) {
      return true; // No auth token configured = open mode
    }

    const authHeader = req.headers["authorization"] || "";
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token === requiredToken.trim()) return true;
    }

    const queryToken = urlObj.searchParams.get("token") || urlObj.searchParams.get("auth");
    if (queryToken && queryToken.trim() === requiredToken.trim()) {
      return true;
    }

    return false;
  }

  public createRequestHandler(
    sessionManager: SseSessionManager,
    serverFactory: () => Server
  ): (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void> {
    return async (req: http.IncomingMessage, res: http.ServerResponse) => {
      if (typeof res?.on === "function") {
        res.on("error", (err: any) => {
          if (err?.code !== "EPIPE" && err?.code !== "ECONNRESET") {
            console.warn("[TRANSPORT HTTP RES ERROR]:", err?.message || err);
          }
        });
      }
      if (typeof req?.on === "function") {
        req.on("error", (err: any) => {
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

      const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || 
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

      // Health / Status (Public unauthenticated diagnostic endpoint)
      if (urlObj.pathname === "/health" || urlObj.pathname === "/status") {
        const authConfigured = Boolean(process.env.MCP_AUTH_TOKEN || process.env.AUTH_TOKEN);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          name: "holy-bible-mcp",
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
      if (urlObj.pathname === "/sse" || urlObj.pathname.startsWith("/messages")) {
        if (!this.validateAuthToken(req, urlObj)) {
          res.writeHead(401, { "Content-Type": "application/json", "WWW-Authenticate": "Bearer" });
          res.end(JSON.stringify({
            error: "Unauthorized",
            message: "Missing or invalid Bearer token in Authorization header or '?token=' query parameter."
          }));
          return;
        }
      }

      // SSE Stream
      if (urlObj.pathname === "/sse" && req.method === "GET") {
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
        const cleanup = async () => {
          if (cleanedUp) return;
          cleanedUp = true;
          sessionManager.remove(sessionId);
          console.error(`[TRANSPORT SSE] 🔴 Client disconnected. Session ID: ${sessionId} (Active: ${sessionManager.size})`);
          try { await sseTransport.close(); } catch (_) {}
          try { await sessionServer.close(); } catch (_) {}
        };

        sseTransport.onclose = cleanup;
        res.on("close", cleanup);
        res.on("error", cleanup);
        req.on("close", cleanup);
        req.on("error", cleanup);

        try {
          await sessionServer.connect(sseTransport);
        } catch (connErr: any) {
          console.error(`[TRANSPORT SSE CONNECT ERROR]:`, connErr?.message || connErr);
          await cleanup();
        }
        return;
      }

      // POST Messages
      if (urlObj.pathname.startsWith("/messages") && req.method === "POST") {
        const sessionId = urlObj.searchParams.get("sessionId") || 
                          (req.headers["x-session-id"] as string) || 
                          (req.headers["mcp-session-id"] as string);
        
        let targetEntry = sessionId ? sessionManager.get(sessionId) : undefined;
        if (!targetEntry && !sessionId && sessionManager.size === 1) {
          targetEntry = sessionManager.getFirst();
        }

        if (!targetEntry) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Session not found or expired. Re-establish GET /sse first." }));
          return;
        }

        try {
          await targetEntry.transport.handlePostMessage(req, res);
        } catch (err: any) {
          console.error("[TRANSPORT SSE POST ERROR]:", err.message);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to process message payload", details: err.message }));
          }
        }
        return;
      }

      // Default info
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
    };
  }

  public async start(
    port: number,
    host: string,
    sessionManager: SseSessionManager,
    serverFactory: () => Server
  ): Promise<http.Server> {
    this.cleanupInterval = setInterval(() => this.rateLimiter.cleanup(), 60000);
    const handler = this.createRequestHandler(sessionManager, serverFactory);
    this.httpServer = http.createServer(handler);

    sessionManager.startHeartbeat(15000);

    return new Promise((resolve) => {
      this.httpServer!.listen(port, host, () => {
        console.error(`[TRANSPORT SSE] 🌐 Remote SSE Server listening at http://${host}:${port}/sse`);
        resolve(this.httpServer!);
      });
    });
  }

  public async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    if (this.httpServer) {
      await new Promise<void>((resolve) => this.httpServer!.close(() => resolve()));
      this.httpServer = null;
    }
  }
}

