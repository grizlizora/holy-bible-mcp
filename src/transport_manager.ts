import http from "http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { isDbReady, DB_PATH } from "./database.js";

export interface TransportConfig {
  mode: "stdio" | "sse" | "dual";
  port: number;
  host: string;
}

export type ServerFactory = () => Server;

export class TransportManager {
  private serverFactory: ServerFactory;
  private stdioServer: Server | null = null;
  private stdioTransport: StdioServerTransport | null = null;
  private sseSessions: Map<string, { transport: SSEServerTransport; server: Server; res: http.ServerResponse }> = new Map();
  private httpServer: http.Server | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(serverFactory: ServerFactory) {
    this.serverFactory = serverFactory;
  }

  public async start(config: TransportConfig): Promise<void> {
    if (config.mode === "stdio" || config.mode === "dual") {
      await this.startStdio();
    }

    if (config.mode === "sse" || config.mode === "dual") {
      await this.startSse(config.port, config.host);
    }
  }

  private async startStdio(): Promise<void> {
    this.stdioServer = this.serverFactory();
    const stdioTransport = new StdioServerTransport();
    this.stdioTransport = stdioTransport;

    // 🛡️ Guard stdio streams against unhandled EPIPE / EOF errors
    if (process.stdout && typeof process.stdout.on === "function") {
      process.stdout.on("error", (err: any) => {
        if (err.code === "EPIPE") {
          process.exit(0);
        }
      });
    }
    if (process.stdin && typeof process.stdin.on === "function") {
      process.stdin.on("error", () => {});
    }
    
    stdioTransport.onerror = (err: Error) => {
      console.error("[TRANSPORT STDIO ERROR]:", err?.message || err);
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

  private async startSse(port: number, host: string): Promise<void> {
    this.httpServer = http.createServer(async (req, res) => {
      // Guard response and request against unhandled socket errors
      res.on("error", (err: any) => {
        if (err.code !== "EPIPE" && err.code !== "ECONNRESET") {
          console.warn("[TRANSPORT HTTP RES ERROR]:", err?.message || err);
        }
      });
      req.on("error", (err: any) => {
        if (err.code !== "ECONNRESET") {
          console.warn("[TRANSPORT HTTP REQ ERROR]:", err?.message || err);
        }
      });

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

        let cleanedUp = false;
        const cleanup = async () => {
          if (cleanedUp) return;
          cleanedUp = true;
          if (this.sseSessions.has(sessionId)) {
            this.sseSessions.delete(sessionId);
            console.error(`[TRANSPORT SSE] 🔴 Client disconnected. Session ID: ${sessionId} (Active: ${this.sseSessions.size})`);
          }
          try {
            await sseTransport.close();
          } catch (_) {}
          try {
            await sessionServer.close();
          } catch (_) {}
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

      // 4. Client Message Post Endpoint (POST /messages)
      if (urlObj.pathname.startsWith("/messages") && req.method === "POST") {
        const sessionId = urlObj.searchParams.get("sessionId") || 
                          (req.headers["x-session-id"] as string) || 
                          (req.headers["mcp-session-id"] as string);
        
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
        } catch (err: any) {
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
      for (const [id, session] of Array.from(this.sseSessions.entries())) {
        try {
          if (session.res.writable && !session.res.writableEnded) {
            session.res.write(": keepalive\n\n");
          } else {
            this.sseSessions.delete(id);
            session.transport.close().catch(() => {});
            session.server.close().catch(() => {});
          }
        } catch (_) {
          this.sseSessions.delete(id);
          session.transport.close().catch(() => {});
          session.server.close().catch(() => {});
        }
      }
    }, 15000);

    this.httpServer.listen(port, host, () => {
      console.error(`[TRANSPORT SSE] 🌐 Remote SSE Server listening at http://${host}:${port}/sse`);
    });
  }

  public async shutdown(): Promise<void> {
    console.error("[TRANSPORT] Shutting down gracefully...");
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    for (const [id, session] of Array.from(this.sseSessions.entries())) {
      try {
        await session.transport.close();
      } catch (_) {}
      try {
        await session.server.close();
      } catch (_) {}
    }
    this.sseSessions.clear();

    if (this.stdioServer) {
      try {
        await this.stdioServer.close();
      } catch (_) {}
      this.stdioServer = null;
    }
    if (this.stdioTransport) {
      try {
        await this.stdioTransport.close();
      } catch (_) {}
      this.stdioTransport = null;
    }

    if (this.httpServer) {
      await new Promise<void>((resolve) => this.httpServer!.close(() => resolve()));
      this.httpServer = null;
    }
  }
}
