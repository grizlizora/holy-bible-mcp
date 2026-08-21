export class SseSessionManager {
    sessions = new Map();
    heartbeatInterval = null;
    get size() {
        return this.sessions.size;
    }
    get(id) {
        return this.sessions.get(id);
    }
    getFirst() {
        return this.sessions.values().next().value;
    }
    register(id, entry) {
        this.sessions.set(id, entry);
    }
    remove(id) {
        this.sessions.delete(id);
    }
    startHeartbeat(intervalMs = 15000) {
        if (this.heartbeatInterval)
            return;
        this.heartbeatInterval = setInterval(() => {
            for (const [id, session] of Array.from(this.sessions.entries())) {
                try {
                    if (session.res.writable && !session.res.writableEnded) {
                        session.res.write(": keepalive\n\n");
                    }
                    else {
                        this.sessions.delete(id);
                        session.transport.close().catch(() => { });
                        session.server.close().catch(() => { });
                    }
                }
                catch (_) {
                    this.sessions.delete(id);
                    session.transport.close().catch(() => { });
                    session.server.close().catch(() => { });
                }
            }
        }, intervalMs);
    }
    async closeAll() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        for (const [id, session] of Array.from(this.sessions.entries())) {
            try {
                await session.transport.close();
            }
            catch (_) { }
            try {
                await session.server.close();
            }
            catch (_) { }
        }
        this.sessions.clear();
    }
}
