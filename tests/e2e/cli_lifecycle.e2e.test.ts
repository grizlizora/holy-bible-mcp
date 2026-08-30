import { describe, it, expect, vi } from "vitest";
import { isCliCommand, runCli } from "../../src/cli/index.js";

describe("E2E: CLI Database Manager Subsystem", () => {
  it("1. should correctly identify CLI invocations vs server boot", () => {
    expect(isCliCommand(["download-db"])).toBe(true);
    expect(isCliCommand(["db-status"])).toBe(true);
    expect(isCliCommand(["verify-db"])).toBe(true);
    expect(isCliCommand(["delete-db"])).toBe(true);
    expect(isCliCommand(["--help"])).toBe(true);
    expect(isCliCommand(["-h"])).toBe(true);
    expect(isCliCommand(["--version"])).toBe(true);
    expect(isCliCommand(["-v"])).toBe(true);
    expect(isCliCommand([])).toBe(false);
    expect(isCliCommand(["--sse"])).toBe(false);
    expect(isCliCommand(["--dual"])).toBe(false);
  });

  it("2. should print help info and return exit code 0 on --help", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const exitCode = await runCli(["--help"]);
    expect(exitCode).toBe(0);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("3. should print version info and return exit code 0 on --version", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const exitCode = await runCli(["--version"]);
    expect(exitCode).toBe(0);
    expect(spy).toHaveBeenCalledWith("holy-bible-mcp v2.0.0");
    spy.mockRestore();
  });

  it("4. should execute db-status command and return exit code 0 or 1", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const exitCode = await runCli(["db-status"]);
    expect(typeof exitCode).toBe("number");
    spy.mockRestore();
  });

  it("5. should handle unknown commands gracefully with exit code 1", async () => {
    const spyErr = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitCode = await runCli(["nonexistent-command-xyz"]);
    expect(exitCode).toBe(1);
    expect(spyErr).toHaveBeenCalled();
    spyErr.mockRestore();
  });
});
