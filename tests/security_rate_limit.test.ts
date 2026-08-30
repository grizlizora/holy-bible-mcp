import { describe, it, expect } from "vitest";
import { RateLimiter } from "../src/transport/http_health_server.js";

describe("RateLimiter Security & DoS Protection", () => {
  it("should allow requests under the limit", () => {
    const limiter = new RateLimiter(5, 60000);
    const ip = "192.168.1.100";

    for (let i = 0; i < 5; i++) {
      const res = limiter.check(ip);
      expect(res.limited).toBe(false);
      expect(res.remaining).toBe(4 - i);
    }
  });

  it("should block requests exceeding the limit with retryAfter", () => {
    const limiter = new RateLimiter(3, 60000);
    const ip = "10.0.0.50";

    limiter.check(ip);
    limiter.check(ip);
    limiter.check(ip);

    const blocked = limiter.check(ip);
    expect(blocked.limited).toBe(true);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("should track separate IP addresses independently", () => {
    const limiter = new RateLimiter(2, 60000);
    const ip1 = "1.1.1.1";
    const ip2 = "2.2.2.2";

    limiter.check(ip1);
    limiter.check(ip1);
    const blockedIp1 = limiter.check(ip1);
    expect(blockedIp1.limited).toBe(true);

    const allowedIp2 = limiter.check(ip2);
    expect(allowedIp2.limited).toBe(false);
  });
});
