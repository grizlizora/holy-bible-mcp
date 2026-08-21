import { StdioTransportAdapter } from "./transport/stdio_transport_adapter.js";
import { SseSessionManager } from "./transport/sse_session_manager.js";
import { HttpHealthServer } from "./transport/http_health_server.js";
export class TransportManager {
    serverFactory;
    stdioAdapter = new StdioTransportAdapter();
    sessionManager = new SseSessionManager();
    healthServer = new HttpHealthServer();
    isHttpActive = false;
    constructor(serverFactory) {
        this.serverFactory = serverFactory;
    }
    async start(config) {
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
    async shutdown() {
        console.error("[TRANSPORT] Shutting down gracefully...");
        await this.sessionManager.closeAll();
        await this.stdioAdapter.close();
        await this.healthServer.close();
        this.isHttpActive = false;
    }
}
