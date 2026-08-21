import http from "http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { isDbReady, DB_PATH } from "../database.js";
import { SseSessionManager } from "./sse_session_manager.js";

export class HttpHealthServer {
  private httpServer: http.Server | null = null;

  public async start(
    port: number,
    host: string,
    sessionManager: SseSessionManager,
    serverFactory: () => Server
  ): Promise<http.Server> {
    this.httpServer = http.createServer(async (req, res) => {
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

      // Universal CORS
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

      // Health / Status
      if (urlObj.pathname === "/health" || urlObj.pathname === "/status") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          name: "holy-bible-mcp",
          version: "2.0.0",
          status: "healthy",
          protocolVersion: "2025-03-26",
          databaseReady: isDbReady(),
          databasePath: DB_PATH,
          activeSseSessions: sessionManager.size,
          memoryUsage: process.memoryUsage(),
          uptimeSeconds: Math.floor(process.uptime()),
          timestamp: new Date().toISOString()
        }, null, 2));
        return;
      }

      // SSE Stream
      if (urlObj.pathname === "/sse" && req.method === "GET") {
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
    });

    sessionManager.startHeartbeat(15000);

    return new Promise((resolve) => {
      this.httpServer!.listen(port, host, () => {
        console.error(`[TRANSPORT SSE] 🌐 Remote SSE Server listening at http://${host}:${port}/sse`);
        resolve(this.httpServer!);
      });
    });
  }

  public async close(): Promise<void> {
    if (this.httpServer) {
      await new Promise<void>((resolve) => this.httpServer!.close(() => resolve()));
      this.httpServer = null;
    }
  }
}
