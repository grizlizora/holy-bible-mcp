import { describe, it, expect } from "vitest";
import { HttpHealthServer } from "../../src/transport/http_health_server.js";
import { SseSessionManager } from "../../src/transport/sse_session_manager.js";
import { createServerInstance } from "../../src/index.js";

describe("E2E: HTTP & SSE Network Protocol Lifecycles", () => {
  it("should handle /health check with security headers", async () => {
    const healthServer = new HttpHealthServer();
    const sessionManager = new SseSessionManager();
    const handler = healthServer.createRequestHandler(sessionManager, createServerInstance);

    let statusCode = 0;
    const headers: Record<string, string> = {};
    let responseBody = "";

    const req: any = {
      method: "GET",
      url: "/health",
      headers: { host: "localhost" },
      socket: { remoteAddress: "127.0.0.1" },
      on: () => {}
    };

    const res: any = {
      setHeader: (k: string, v: string) => {
        headers[k] = v;
      },
      getHeader: (k: string) => headers[k],
      writeHead: (code: number, hdrs?: Record<string, string>) => {
        statusCode = code;
        if (hdrs) Object.assign(headers, hdrs);
      },
      end: (data: string) => {
        responseBody = data;
      },
      on: () => {}
    };

    await handler(req, res);

    expect(statusCode).toBe(200);
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    const json = JSON.parse(responseBody);
    expect(json.status).toBe("healthy");
  });

  it("should handle CORS OPTIONS preflight request with appropriate methods", async () => {
    const healthServer = new HttpHealthServer();
    const sessionManager = new SseSessionManager();
    const handler = healthServer.createRequestHandler(sessionManager, createServerInstance);

    let statusCode = 0;
    const headers: Record<string, string> = {};

    const req: any = {
      method: "OPTIONS",
      url: "/messages",
      headers: { host: "localhost" },
      socket: { remoteAddress: "127.0.0.1" },
      on: () => {}
    };

    const res: any = {
      setHeader: (k: string, v: string) => {
        headers[k] = v;
      },
      getHeader: (k: string) => headers[k],
      writeHead: (code: number, hdrs?: Record<string, string>) => {
        statusCode = code;
        if (hdrs) Object.assign(headers, hdrs);
      },
      end: () => {},
      on: () => {}
    };

    await handler(req, res);

    expect(statusCode).toBe(204);
    expect(headers["Access-Control-Allow-Origin"]).toBe("*");
    expect(headers["Access-Control-Allow-Methods"]).toContain("POST");
  });
});
