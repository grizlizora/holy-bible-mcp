import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
export class StdioTransportAdapter {
    stdioServer = null;
    stdioTransport = null;
    async connect(serverFactory, onOrphanClose) {
        this.stdioServer = serverFactory();
        this.stdioTransport = new StdioServerTransport();
        // 🛡️ Guard stdio streams against unhandled EPIPE / EOF errors
        if (process.stdout && typeof process.stdout.on === "function") {
            process.stdout.on("error", (err) => {
                if (err.code === "EPIPE") {
                    if (onOrphanClose) {
                        try {
                            onOrphanClose();
                        }
                        catch (_) { }
                    }
                    process.exit(0);
                }
            });
        }
        if (process.stdin && typeof process.stdin.on === "function") {
            process.stdin.on("error", () => { });
        }
        this.stdioTransport.onerror = (err) => {
            console.error("[TRANSPORT STDIO ERROR]:", err?.message || err);
        };
        this.stdioTransport.onclose = () => {
            console.error("[TRANSPORT STDIO CLOSED]");
            if (onOrphanClose) {
                onOrphanClose();
            }
        };
        await this.stdioServer.connect(this.stdioTransport);
        console.error("[TRANSPORT] ⚡ Local Stdio IPC Transport active and connected.");
    }
    async close() {
        if (this.stdioServer) {
            try {
                await this.stdioServer.close();
            }
            catch (_) { }
            this.stdioServer = null;
        }
        if (this.stdioTransport) {
            try {
                await this.stdioTransport.close();
            }
            catch (_) { }
            this.stdioTransport = null;
        }
    }
}
