import { describe, it, expect } from "vitest";
import { extractModelParamSizeB } from "../src/capabilities/model_param_extractor.js";
import { computeAdaptiveModelBudget } from "../src/capabilities/adaptive_budget_engine.js";

describe("Extended Model Parameter Matrix & Reasoning Adaptation", () => {
  it("should correctly resolve parameter sizes for newest flagship models", () => {
    expect(extractModelParamSizeB("claude-3-7-sonnet")).toBe(200.0);
    expect(extractModelParamSizeB("claude-3.7-sonnet")).toBe(200.0);
    expect(extractModelParamSizeB("claude-3-5-sonnet-20241022")).toBe(200.0);
    expect(extractModelParamSizeB("gemini-2.0-flash")).toBe(32.0);
    expect(extractModelParamSizeB("gemini-2.0-pro")).toBe(200.0);
    expect(extractModelParamSizeB("llama-3.3-70b-instruct")).toBe(70.0);
    expect(extractModelParamSizeB("llama-3.2-3b-instruct")).toBe(3.0);
    expect(extractModelParamSizeB("llama-3.2-1b")).toBe(1.0);
    expect(extractModelParamSizeB("qwen2.5-72b-instruct")).toBe(72.0);
    expect(extractModelParamSizeB("qwen2.5-32b-coder")).toBe(32.0);
    expect(extractModelParamSizeB("deepseek-r1")).toBe(671.0);
    expect(extractModelParamSizeB("deepseek-r1-distill-qwen-32b")).toBe(32.0);
    expect(extractModelParamSizeB("deepseek-r1-distill-llama-70b")).toBe(70.0);
    expect(extractModelParamSizeB("command-r-plus")).toBe(200.0);
    expect(extractModelParamSizeB("codestral-22b")).toBe(22.0);
    expect(extractModelParamSizeB("codestral")).toBe(32.0);
  });

  it("should auto-tune hyperparameters for reasoning models (DeepSeek-R1, o1, thinking)", () => {
    const r1Budget = computeAdaptiveModelBudget({
      modelName: "deepseek-r1",
      userMessage: "Що таке первородний гріх у богослов'ї Апостола Павла?"
    });

    expect(r1Budget.temperature).toBe(0.25);
    expect(r1Budget.minP).toBe(0.05);
    expect(r1Budget.topP).toBe(0.90);
    expect(r1Budget.repeatPenalty).toBe(1.02);
    expect(r1Budget.numPredict).toBeGreaterThanOrEqual(6000); // tier3 5000 + 1200 bonus
  });

  it("should auto-tune hyperparameters for standard non-reasoning small models", () => {
    const smallBudget = computeAdaptiveModelBudget({
      modelName: "llama-3.2-3b",
      userMessage: "Привіт"
    });

    expect(smallBudget.tier).toBe("tier1");
    expect(smallBudget.numCtx).toBe(4096);
    expect(smallBudget.minP).toBe(0.07);
  });
});
