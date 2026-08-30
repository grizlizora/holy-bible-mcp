import http from "http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

export interface SseSessionEntry {
  transport: SSEServerTransport;
  server: Server;
  res: http.ServerResponse;
}

export class SseSessionManager {
  private sessions = new Map<string, SseSessionEntry>();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  public get size(): number {
    return this.sessions.size;
  }

  public get(id: string): SseSessionEntry | undefined {
    return this.sessions.get(id);
  }

  public getFirst(): SseSessionEntry | undefined {
    return this.sessions.values().next().value;
  }

  public register(id: string, entry: SseSessionEntry): void {
    this.sessions.set(id, entry);
  }

  public remove(id: string): void {
    this.sessions.delete(id);
  }

  public startHeartbeat(intervalMs = 15000): void {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval = setInterval(() => {
      for (const [id, session] of Array.from(this.sessions.entries())) {
        try {
          if (session.res.writable && !session.res.writableEnded) {
            session.res.write(": keepalive\n\n");
          } else {
            this.sessions.delete(id);
            session.transport.close().catch(() => {});
            session.server.close().catch(() => {});
          }
        } catch (_) {
          this.sessions.delete(id);
          session.transport.close().catch(() => {});
          session.server.close().catch(() => {});
        }
      }
    }, intervalMs);
  }

  public async broadcastNotification(method: string, params?: any): Promise<void> {
    for (const [id, session] of Array.from(this.sessions.entries())) {
      try {
        await session.server.notification({ method, params });
      } catch (err: any) {
        console.warn(`[TRANSPORT SSE] Failed to send notification to session ${id}:`, err?.message || err);
      }
    }
  }

  public async sendNotificationToSession(sessionId: string, method: string, params?: any): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    try {
      await session.server.notification({ method, params });
      return true;
    } catch (err: any) {
      console.warn(`[TRANSPORT SSE] Failed to send notification to session ${sessionId}:`, err?.message || err);
      return false;
    }
  }

  public async broadcastNotificationToTopic(topic: string, method: string, params?: any): Promise<void> {
    const payload = { topic, ...(params || {}) };
    await this.broadcastNotification(method, payload);
  }

  public async closeAll(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    for (const [id, session] of Array.from(this.sessions.entries())) {
      try { await session.transport.close(); } catch (_) {}
      try { await session.server.close(); } catch (_) {}
    }
    this.sessions.clear();
  }
}

