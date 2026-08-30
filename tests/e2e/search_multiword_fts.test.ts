import { describe, it, expect } from "vitest";
import { handleSearchKeyword } from "../../src/tools/handlers/search.handlers.js";
import { ParallelCorpusEngine } from "../../src/parallel_corpus_engine.js";

describe("Multi-Word FTS & Parallel Range Search", () => {
  it("should handle multi-word search without collapsing spaces into single tokens", async () => {
    const result = await handleSearchKeyword({
      keyword: "святий дух",
      language: "ukr",
      limit: 5
    });

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content.length).toBeGreaterThan(0);
  });

  it("should handle verse range queries across parallel translations", async () => {
    const engine = ParallelCorpusEngine.getInstance();
    const parallel = await engine.getParallelVerses("JHN", 3, 16, 17, ["UBIO", "KJV"], "ukr");

    expect(parallel).toBeDefined();
    expect(parallel.reference).toContain("3:16-17");
    expect(parallel.translations.length).toBe(2);
    expect(parallel.translations[0].translationId).toBe("UBIO");
    expect(parallel.translations[1].translationId).toBe("KJV");
  });
});
