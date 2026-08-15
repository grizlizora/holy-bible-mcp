import http from "http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { isDbReady, DB_PATH } from "./database.js";

export interface TransportConfig {
  mode: "stdio" | "sse" | "dual";
  port: number;
  host: string;
  allowedOrigins?: string[];
}

export class TransportManager {
  private server: Server;
  private sseSessions: Map<string, SSEServerTransport> = new Map();
  private httpServer: http.Server | null = null;

  constructor(server: Server) {
    this.server = server;
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
    const stdioTransport = new StdioServerTransport();
    stdioTransport.onerror = (err: Error) => {
      console.error("[TRANSPORT STDIO ERROR]:", err);
    };
    stdioTransport.onclose = () => {
      console.error("[TRANSPORT STDIO CLOSED]");
      if (!this.httpServer) {
        process.exit(0);
      }
    };

    await this.server.connect(stdioTransport);
    console.error("[TRANSPORT] ⚡ Local Stdio IPC Transport active and connected.");
  }

  private async startSse(port: number, host: string): Promise<void> {
    this.httpServer = http.createServer(async (req, res) => {
      // 1. CORS Headers for Web Clients
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-session-id");

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
          status: "healthy",
          protocolVersion: "2025-03-26",
          databaseReady: isDbReady(),
          databasePath: DB_PATH,
          activeSseSessions: this.sseSessions.size,
          uptimeSeconds: Math.floor(process.uptime()),
          timestamp: new Date().toISOString()
        }, null, 2));
        return;
      }

      // 3. SSE Stream Connection Endpoint (GET /sse)
      if (urlObj.pathname === "/sse" && req.method === "GET") {
        const sseTransport = new SSEServerTransport("/messages", res);
        const sessionId = sseTransport.sessionId;

        this.sseSessions.set(sessionId, sseTransport);
        console.error(`[TRANSPORT SSE] 🟢 Client connected. Session ID: ${sessionId} (Active: ${this.sseSessions.size})`);

        sseTransport.onclose = () => {
          this.sseSessions.delete(sessionId);
          console.error(`[TRANSPORT SSE] 🔴 Client disconnected. Session ID: ${sessionId} (Active: ${this.sseSessions.size})`);
        };

        await this.server.connect(sseTransport);
        return;
      }

      // 4. Client Message Post Endpoint (POST /messages?sessionId=...)
      if (urlObj.pathname.startsWith("/messages") && req.method === "POST") {
        const sessionId = urlObj.searchParams.get("sessionId") || (req.headers["x-session-id"] as string);
        
        let targetTransport: SSEServerTransport | undefined;
        if (sessionId) {
          targetTransport = this.sseSessions.get(sessionId);
        } else if (this.sseSessions.size === 1) {
          targetTransport = this.sseSessions.values().next().value;
        }

        if (!targetTransport) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Session not found or expired. Re-establish GET /sse first." }));
          return;
        }

        await targetTransport.handlePostMessage(req, res);
        return;
      }

      // 5. Default Root Info Response
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        server: "Holy Bible MCP Server",
        version: "1.1.0",
        capabilities: ["tools", "resources", "prompts"],
        endpoints: {
          sseStream: "/sse",
          messagePost: "/messages",
          healthCheck: "/health"
        }
      }));
    });

    this.httpServer.listen(port, host, () => {
      console.error(`[TRANSPORT SSE] 🌐 Remote SSE Server listening at http://${host}:${port}/sse`);
    });
  }

  public async shutdown(): Promise<void> {
    console.error("[TRANSPORT] Shutting down gracefully...");
    for (const [id, session] of this.sseSessions.entries()) {
      try {
        await session.close();
      } catch (_) {}
    }
    this.sseSessions.clear();

    if (this.httpServer) {
      await new Promise<void>((resolve) => this.httpServer!.close(() => resolve()));
    }
  }
}
