import { describe, it, expect, beforeAll } from "vitest";
import { DirectiveStore } from "../../src/directives/directive_store.js";
import { handleGetVerse } from "../../src/tools/handlers/verse.handlers.js";
import { handleSearchKeyword } from "../../src/tools/handlers/search.handlers.js";
import { ChapterResourceHandler } from "../../src/resources/handlers/chapter_resource_handler.js";
import { CrossrefResourceHandler } from "../../src/resources/handlers/crossref_resource_handler.js";
import { InterlinearResourceHandler } from "../../src/resources/handlers/interlinear_resource_handler.js";
import { StrongsResourceHandler } from "../../src/resources/handlers/strongs_resource_handler.js";

describe("E2E: Database Fallback Cascade & Resource Handlers Resilience", () => {
  beforeAll(async () => {
    await DirectiveStore.getInstance().loadDirectives();
  });

  it("1. should gracefully resolve verse via online fallback or local fallback", async () => {

    const result = await handleGetVerse({
      reference: "John 1:1",
      language: "eng"
    });

    expect(result.content[0]?.text).toBeDefined();
    expect(result.content[0]?.text).toContain("John 1:1");
  });

  it("2. should gracefully resolve keyword search without throwing unhandled exceptions", async () => {
    const result = await handleSearchKeyword({
      keyword: "благодать",
      language: "ukr",
      limit: 3
    });

    expect(result.content[0]?.text).toBeDefined();
    expect(result.content[0]?.text.length).toBeGreaterThan(0);
  });

  it("3. should handle ChapterResourceHandler with online fallback", async () => {
    const res = await ChapterResourceHandler.handle("bible://ubio/GEN/1", {
      translation: "ubio",
      book: "GEN",
      chapter: 1
    });

    expect(res.contents[0]?.text).toBeDefined();
    expect(res.contents[0]?.text).toContain("Буття 1");
  });

  it("4. should handle CrossrefResourceHandler and return structured cross references", async () => {
    const res = await CrossrefResourceHandler.handle("bible://crossref/JHN/3/16", {
      book: "JHN",
      chapter: 3,
      verse: 16
    });

    expect(res.contents[0]?.text).toBeDefined();
    const data = JSON.parse(res.contents[0]?.text as string);
    expect(data.source).toBe("JHN 3:16");
    expect(Array.isArray(data.references)).toBe(true);
  });

  it("5. should handle InterlinearResourceHandler and return word-by-word analysis", async () => {
    const res = await InterlinearResourceHandler.handle("bible://interlinear/GEN/1/1", {
      book: "GEN",
      chapter: 1,
      verse: 1
    });

    expect(res.contents[0]?.text).toBeDefined();
    const data = JSON.parse(res.contents[0]?.text as string);
    expect(data.reference?.osis || data.reference).toBe("GEN.1.1");
    expect(data.words.length).toBeGreaterThan(0);
  });



  it("6. should handle StrongsResourceHandler and return full etymology and synonyms", async () => {
    const res = await StrongsResourceHandler.handle("bible://strongs/G26", {
      strongsId: "G26"
    });

    expect(res.contents[0]?.text).toBeDefined();
    const data = JSON.parse(res.contents[0]?.text as string);
    expect(data.strongsId).toBe("G0026");
    expect(data.lemma).toBe("ἀγάπη");
    expect(data.trenchSynonyms).toBeDefined();
  });
});
