import { describe, it, expect } from "vitest";
import { validateToolArgs } from "../src/tools/schemas/tool_schemas.js";

describe("Tool Schemas & Zod Validation Middleware", () => {
  it("should validate valid ask_holy_bible arguments", () => {
    const valid = validateToolArgs("ask_holy_bible", {
      question: "Що Біблія говорить про любов?",
      language: "ukr",
      mode: "detailed",
      warmth: 85
    });

    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.language).toBe("ukr");
      expect(valid.data.mode).toBe("detailed");
      expect(valid.data.warmth).toBe(85);
    }
  });

  it("should validate search_keyword with defaults", () => {
    const valid = validateToolArgs("search_keyword", {
      query: "благодать"
    });

    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.limit).toBe(10);
    }
  });

  it("should reject get_chapter_context with empty book", () => {
    const invalid = validateToolArgs("get_chapter_context", {
      book: "",
      chapter: 1
    });

    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error).toContain("Book cannot be empty");
    }
  });

  it("should validate set_response_mode allowed enum values", () => {
    const valid = validateToolArgs("set_response_mode", {
      mode: "deep"
    });
    expect(valid.success).toBe(true);

    const invalid = validateToolArgs("set_response_mode", {
      mode: "invalid_mode_name"
    });
    expect(invalid.success).toBe(false);
  });

  it("should validate set_relevance_sensitivity bounds (0-100)", () => {
    const valid = validateToolArgs("set_relevance_sensitivity", { score: 90 });
    expect(valid.success).toBe(true);

    const invalidTooHigh = validateToolArgs("set_relevance_sensitivity", { score: 150 });
    expect(invalidTooHigh.success).toBe(false);

    const invalidNegative = validateToolArgs("set_relevance_sensitivity", { score: -10 });
    expect(invalidNegative.success).toBe(false);
  });

  it("should handle unknown tool names gracefully", () => {
    const result = validateToolArgs("unknown_nonexistent_tool", {});
    expect(result.success).toBe(true);
  });
});
