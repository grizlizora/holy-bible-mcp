import { describe, it, expect } from "vitest";
import { runCli, isCliCommand } from "../../src/cli/index.js";

describe("E2E: Deep CLI Flag Parsing & Error Codes", () => {
  it("should match CLI commands with flag-first ordering", () => {
    expect(isCliCommand(["--dir", "/data", "download-db"])).toBe(true);
    expect(isCliCommand(["--force", "delete-db"])).toBe(true);
    expect(isCliCommand(["--checksum", "verify-db"])).toBe(true);
    expect(isCliCommand(["--profile", "lite", "download"])).toBe(true);
  });

  it("should return exit code 0 on --help and --version", async () => {
    expect(await runCli(["--help"])).toBe(0);
    expect(await runCli(["-h"])).toBe(0);
    expect(await runCli(["--version"])).toBe(0);
  });

  it("should recognize download-db with various option combinations", () => {
    expect(isCliCommand(["download-db", "--dir", "./test", "--profile", "lite", "--checksum"])).toBe(true);
    expect(isCliCommand(["--dir=/tmp", "--checksum", "download-db"])).toBe(true);
  });

  it("should execute verify-db with --dir and --checksum", async () => {
    const exitCode = await runCli(["verify-db", "--dir", "./non-existent-db.sqlite", "--checksum"]);
    expect(exitCode).toBe(1); // Fails gracefully on non-existent file with exit code 1
  });
});
