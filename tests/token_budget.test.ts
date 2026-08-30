import { describe, it, expect } from "vitest";
import {
  DynamicTokenBudgetManager,
  NeuralThinkingEngine,
  CONTEXT_WINDOW_PROFILES
} from "../src/token_optimizer/index.js";

describe("DynamicTokenBudgetManager - Context Profile Detection", () => {
  it("should detect small context window from numCtx parameter", () => {
    const profile = DynamicTokenBudgetManager.detectContextProfile({ numCtx: 4096 });
    expect(profile.key).toBe("ctx_4k");
    expect(profile.targetTier).toBe("tier1");
  });

  it("should detect IDE context window (ctx_32k) for Trae and Cursor", () => {
    const profileTrae = DynamicTokenBudgetManager.detectContextProfile({ clientHost: "trae-ide" });
    expect(profileTrae.key).toBe("ctx_32k");

    const profileCursor = DynamicTokenBudgetManager.detectContextProfile({ clientHost: "cursor-client" });
    expect(profileCursor.key).toBe("ctx_32k");
  });

  it("should detect frontier model context window (ctx_128k_plus) for Claude 3.7 and GPT-4o", () => {
    const profileClaude = DynamicTokenBudgetManager.detectContextProfile({ modelName: "claude-3-7-sonnet" });
    expect(profileClaude.key).toBe("ctx_128k_plus");

    const profileGpt = DynamicTokenBudgetManager.detectContextProfile({ modelName: "gpt-4o" });
    expect(profileGpt.key).toBe("ctx_128k_plus");

    const profileDeepSeek = DynamicTokenBudgetManager.detectContextProfile({ modelName: "deepseek-r1" });
    expect(profileDeepSeek.key).toBe("ctx_128k_plus");
  });

  it("should detect edge/small model profile (ctx_4k) for sub-8.5B models", () => {
    const profileSmall = DynamicTokenBudgetManager.detectContextProfile({ modelName: "qwen2.5-7b" });
    expect(profileSmall.key).toBe("ctx_4k");
  });
});

describe("DynamicTokenBudgetManager - 40/20/20/20 Token Allocation", () => {
  it("should allocate balanced tokens without drift for standard mode", () => {
    const profile = CONTEXT_WINDOW_PROFILES.ctx_32k;
    const allocation = DynamicTokenBudgetManager.calculateAllocation({
      profile,
      mode: "medium",
      hasStrongs: true,
      hasCrossrefs: true,
      complexityScore: 50
    });

    expect(allocation.scripture).toBeGreaterThan(0);
    expect(allocation.strongs).toBeGreaterThan(0);
    expect(allocation.crossref).toBeGreaterThan(0);
    expect(allocation.directive).toBeGreaterThan(0);

    const sum = allocation.scripture + allocation.strongs + allocation.crossref + allocation.directive;
    expect(sum).toBe(allocation.totalUsable);
  });

  it("should reallocate surplus to scripture in verses_only mode", () => {
    const profile = CONTEXT_WINDOW_PROFILES.ctx_32k;
    const allocation = DynamicTokenBudgetManager.calculateAllocation({
      profile,
      mode: "verses_only",
      hasStrongs: false,
      hasCrossrefs: true,
      complexityScore: 20
    });

    expect(allocation.strongs).toBe(0);
    expect(allocation.scripture).toBeGreaterThan(allocation.totalUsable * 0.60);
    const sum = allocation.scripture + allocation.strongs + allocation.crossref + allocation.directive;
    expect(sum).toBe(allocation.totalUsable);
  });
});

describe("NeuralThinkingEngine", () => {
  it("should generate thinking guidance for reasoning models in Ukrainian", () => {
    const guidance = NeuralThinkingEngine.buildThinkingGuidance(true, "ukr");
    expect(guidance).toContain("[ПРОТОКОЛ МИСЛЕННЯ REASONING (CoT) ДЛЯ <think>]");
    expect(guidance).toContain("Канонічна фіксація");
  });

  it("should generate thinking guidance for reasoning models in English", () => {
    const guidance = NeuralThinkingEngine.buildThinkingGuidance(true, "eng");
    expect(guidance).toContain("[REASONING CHAIN-OF-THOUGHT PROTOCOL FOR <think>]");
  });

  it("should return empty string when isReasoningModel is false", () => {
    expect(NeuralThinkingEngine.buildThinkingGuidance(false)).toBe("");
  });

  it("should generate telemetry footer when showMetrics is true", () => {
    const footer = NeuralThinkingEngine.generateTelemetryFooter({
      showMetrics: true,
      complexityScore: 65,
      effectiveMode: "detailed",
      accuracyScore: "High",
      language: "ukr"
    });
    expect(footer).toContain("📊 **Складність:** `65/100`");
    expect(footer).toContain("[[METRICS:");
  });
});
