import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { HttpHealthServer, RateLimiter } from "../../src/transport/http_health_server.js";
import { SseSessionManager } from "../../src/transport/sse_session_manager.js";
import { createServerInstance } from "../../src/index.js";
import { DirectiveStore } from "../../src/directives/directive_store.js";

describe("E2E: Remote HTTP & SSE Transport Lifecycle", () => {
  let sessionManager: SseSessionManager;
  const AUTH_TOKEN = "test-secret-bearer-token-123";

  beforeAll(async () => {
    process.env.MCP_AUTH_TOKEN = AUTH_TOKEN;
    await DirectiveStore.getInstance().loadDirectives();
    sessionManager = new SseSessionManager();
  });

  afterAll(async () => {
    delete process.env.MCP_AUTH_TOKEN;
    await sessionManager.closeAll();
  });

  it("1. should manage SSE session lifecycles in SseSessionManager", () => {
    const mockTransport: any = { close: async () => {}, sessionId: "test-sess-1" };
    const mockServer = createServerInstance();
    const mockRes: any = { write: () => {}, end: () => {} };

    sessionManager.register("test-sess-1", { transport: mockTransport, server: mockServer, res: mockRes });
    expect(sessionManager.size).toBe(1);
    expect(sessionManager.get("test-sess-1")).toBeDefined();
    expect(sessionManager.getFirst()).toBeDefined();

    sessionManager.remove("test-sess-1");
    expect(sessionManager.size).toBe(0);
  });

  it("2. should enforce sliding-window RateLimiter with DoS retry-after calculation", () => {
    const limiter = new RateLimiter(3, 60000);
    const ip = "10.0.0.1";

    const r1 = limiter.check(ip);
    expect(r1.limited).toBe(false);
    expect(r1.remaining).toBe(2);

    const r2 = limiter.check(ip);
    expect(r2.limited).toBe(false);
    expect(r2.remaining).toBe(1);

    const r3 = limiter.check(ip);
    expect(r3.limited).toBe(false);
    expect(r3.remaining).toBe(0);

    const r4 = limiter.check(ip);
    expect(r4.limited).toBe(true);
    expect(r4.retryAfter).toBeGreaterThan(0);
  });

  it("3. should clean up expired rate limit entries on periodic interval", () => {
    const limiter = new RateLimiter(5, 10); // 10ms window
    limiter.check("1.2.3.4");
    expect(limiter.check("1.2.3.4").remaining).toBe(3);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        limiter.cleanup();
        const fresh = limiter.check("1.2.3.4");
        expect(fresh.remaining).toBe(4);
        resolve();
      }, 20);
    });
  });

  it("4. should validate Bearer token authorization in HttpHealthServer", () => {
    const healthServer = new HttpHealthServer(120);
    const validate = (healthServer as any).validateAuthToken.bind(healthServer);

    // Missing token -> false
    const reqNoAuth: any = { headers: {} };
    const urlNoAuth = new URL("http://localhost/sse");
    expect(validate(reqNoAuth, urlNoAuth)).toBe(false);

    // Invalid Bearer token -> false
    const reqBadAuth: any = { headers: { authorization: "Bearer wrong-token" } };
    expect(validate(reqBadAuth, urlNoAuth)).toBe(false);

    // Valid Bearer token in header -> true
    const reqGoodAuth: any = { headers: { authorization: `Bearer ${AUTH_TOKEN}` } };
    expect(validate(reqGoodAuth, urlNoAuth)).toBe(true);

    // Valid token in query parameter -> true
    const urlQueryAuth = new URL(`http://localhost/sse?token=${AUTH_TOKEN}`);
    expect(validate(reqNoAuth, urlQueryAuth)).toBe(true);
  });
});
