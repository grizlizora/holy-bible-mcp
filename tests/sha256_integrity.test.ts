import { describe, it, expect } from "vitest";
import { computeFileSha256, verifyDatabaseSha256, verifySqliteDatabaseIntegrity } from "../src/database/integrity_checker.js";
import path from "path";
import fs from "fs";

describe("SQLite & SHA-256 Database Integrity Verification", () => {
  const directivesDbPath = path.resolve(process.cwd(), "data/directives.sqlite");

  it("should compute valid SHA-256 hash for directives.sqlite", async () => {
    if (fs.existsSync(directivesDbPath)) {
      const hash = await computeFileSha256(directivesDbPath);
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64); // 64 hex characters
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    }
  });

  it("should verify valid SHA-256 matching", async () => {
    if (fs.existsSync(directivesDbPath)) {
      const hash = await computeFileSha256(directivesDbPath);
      const result = await verifyDatabaseSha256(directivesDbPath, hash);
      expect(result.valid).toBe(true);
      expect(result.actualSha256).toBe(hash);
    }
  });

  it("should detect SHA-256 mismatch", async () => {
    if (fs.existsSync(directivesDbPath)) {
      const bogusHash = "0000000000000000000000000000000000000000000000000000000000000000";
      const result = await verifyDatabaseSha256(directivesDbPath, bogusHash);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("SHA-256 mismatch");
    }
  });

  it("should verify database header and quick_check on directives.sqlite", async () => {
    if (fs.existsSync(directivesDbPath)) {
      const integrity = await verifySqliteDatabaseIntegrity(directivesDbPath, { calculateSha256: true });
      expect(integrity.valid).toBe(true);
      expect(integrity.quickCheck).toBe("ok");
      expect(integrity.tableCount).toBeGreaterThan(0);
      expect(integrity.sha256).toBeDefined();
    }
  });
});
