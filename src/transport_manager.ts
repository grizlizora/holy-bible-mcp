import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioTransportAdapter } from "./transport/stdio_transport_adapter.js";
import { SseSessionManager } from "./transport/sse_session_manager.js";
import { HttpHealthServer } from "./transport/http_health_server.js";

export interface TransportConfig {
  mode: "stdio" | "sse" | "dual";
  port: number;
  host: string;
}

export type ServerFactory = () => Server;

export class TransportManager {
  private serverFactory: ServerFactory;
  private stdioAdapter = new StdioTransportAdapter();
  private sessionManager = new SseSessionManager();
  private healthServer = new HttpHealthServer();
  private isHttpActive = false;

  constructor(serverFactory: ServerFactory) {
    this.serverFactory = serverFactory;
  }

  public async start(config: TransportConfig): Promise<void> {
    if (config.mode === "stdio" || config.mode === "dual") {
      await this.stdioAdapter.connect(this.serverFactory, () => {
        if (!this.isHttpActive) {
          process.exit(0);
        }
      });
    }

    if (config.mode === "sse" || config.mode === "dual") {
      this.isHttpActive = true;
      await this.healthServer.start(config.port, config.host, this.sessionManager, this.serverFactory);
    }
  }

  public async shutdown(): Promise<void> {
    console.error("[TRANSPORT] Shutting down gracefully...");
    await this.sessionManager.closeAll();
    await this.stdioAdapter.close();
    await this.healthServer.close();
    this.isHttpActive = false;
  }
}
