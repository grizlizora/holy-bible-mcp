import { describe, it, expect, beforeAll } from "vitest";
import { DirectiveStore } from "../src/directives/directive_store.js";

describe("DirectiveStore SQLite-Driven Subsystem", () => {
  beforeAll(async () => {
    await DirectiveStore.getInstance().loadDirectives();
  });

  it("should initialize DirectiveStore from directives.sqlite", () => {
    const store = DirectiveStore.getInstance();
    expect(store).toBeDefined();
    expect(store.dbPath.length).toBeGreaterThan(0);
  });

  it("should load canonical response modes", () => {
    const store = DirectiveStore.getInstance();
    const modes = store.getAllModes();
    expect(modes.length).toBeGreaterThanOrEqual(4);

    const mediumMode = store.getMode("medium");
    expect(mediumMode).toBeDefined();
    expect(mediumMode?.modeKey).toBe("medium");
  });

  it("should resolve model tiers by parameter size", () => {
    const store = DirectiveStore.getInstance();
    const tierSmall = store.resolveTierByParamSize(7);
    expect(tierSmall?.tierId).toBeDefined();

    const tierLarge = store.resolveTierByParamSize(70);
    expect(tierLarge?.tierId).toBe("tier3");
  });

  it("should resolve warmth directives for pastoral vs academic", () => {
    const store = DirectiveStore.getInstance();
    const warmthLow = store.resolveWarmth(20);
    expect(warmthLow).toBeDefined();
    expect(warmthLow.levelId).toBe("academic");
    expect(warmthLow.directive.length).toBeGreaterThan(0);

    const warmthHigh = store.resolveWarmth(85);
    expect(warmthHigh).toBeDefined();
    expect(warmthHigh.levelId).toBe("deep_love");
    expect(warmthHigh.directive.length).toBeGreaterThan(0);
  });
});
