import { describe, it, expect } from "vitest";
import { HttpHealthServer } from "../src/transport/http_health_server.js";
import { SseSessionManager } from "../src/transport/sse_session_manager.js";
import { createServerInstance } from "../src/index.js";

describe("HTTP Security Headers & Transport Hardening", () => {
  it("should return standard security headers on /health endpoint", async () => {
    const healthServer = new HttpHealthServer();
    const sessionManager = new SseSessionManager();
    const handler = healthServer.createRequestHandler(sessionManager, createServerInstance);

    const headers: Record<string, string> = {};
    let statusCode = 0;
    let responseBody = "";

    const req: any = {
      method: "GET",
      url: "/health",
      headers: { host: "localhost" },
      socket: { remoteAddress: "127.0.0.1" },
      on: () => req
    };

    const res: any = {
      setHeader: (name: string, value: any) => {
        headers[name.toLowerCase()] = String(value);
      },
      writeHead: (code: number, _hdrs?: any) => {
        statusCode = code;
      },
      end: (chunk?: string) => {
        if (chunk) responseBody += chunk;
      },
      on: () => res
    };

    await handler(req, res);

    expect(statusCode).toBe(200);
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["strict-transport-security"]).toContain("max-age=31536000");
    expect(headers["referrer-policy"]).toBe("no-referrer");
    expect(headers["x-xss-protection"]).toBe("1; mode=block");

    const parsed = JSON.parse(responseBody);
    expect(parsed.status).toBe("healthy");
  });

  it("should return standard security headers on /metrics endpoint", async () => {
    const healthServer = new HttpHealthServer();
    const sessionManager = new SseSessionManager();
    const handler = healthServer.createRequestHandler(sessionManager, createServerInstance);

    const headers: Record<string, string> = {};
    let statusCode = 0;
    let responseBody = "";

    const req: any = {
      method: "GET",
      url: "/metrics",
      headers: { host: "localhost" },
      socket: { remoteAddress: "127.0.0.1" },
      on: () => req
    };

    const res: any = {
      setHeader: (name: string, value: any) => {
        headers[name.toLowerCase()] = String(value);
      },
      writeHead: (code: number, _hdrs?: any) => {
        statusCode = code;
      },
      end: (chunk?: string) => {
        if (chunk) responseBody += chunk;
      },
      on: () => res
    };

    await handler(req, res);

    expect(statusCode).toBe(200);
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(responseBody).toContain("holy_bible_mcp_uptime_seconds");
  });
});
