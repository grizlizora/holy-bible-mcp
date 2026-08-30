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
    async broadcastNotification(method, params) {
        for (const [id, session] of Array.from(this.sessions.entries())) {
            try {
                await session.server.notification({ method, params });
            }
            catch (err) {
                console.warn(`[TRANSPORT SSE] Failed to send notification to session ${id}:`, err?.message || err);
            }
        }
    }
    async sendNotificationToSession(sessionId, method, params) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return false;
        try {
            await session.server.notification({ method, params });
            return true;
        }
        catch (err) {
            console.warn(`[TRANSPORT SSE] Failed to send notification to session ${sessionId}:`, err?.message || err);
            return false;
        }
    }
    async broadcastNotificationToTopic(topic, method, params) {
        const payload = { topic, ...(params || {}) };
        await this.broadcastNotification(method, payload);
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
