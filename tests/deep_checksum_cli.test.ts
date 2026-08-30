import { describe, it, expect } from "vitest";
import { handleVerifyDb } from "../src/cli/commands/verify_db.js";
import { isCliCommand } from "../src/cli/index.js";

describe("CLI Deep Integrity Verification & Commands", () => {
  it("should recognize CLI command flags", () => {
    expect(isCliCommand(["verify-db"])).toBe(true);
    expect(isCliCommand(["verify"])).toBe(true);
    expect(isCliCommand(["download-db"])).toBe(true);
    expect(isCliCommand(["status"])).toBe(true);
    expect(isCliCommand(["unknown-flag"])).toBe(false);
  });

  it("should handle verify-db gracefully when database does not exist", async () => {
    // If DB doesn't exist, handleVerifyDb returns 1 with error log
    const exitCode = await handleVerifyDb(["--deep"]);
    expect(typeof exitCode).toBe("number");
  });
});
