import { describe, it, expect } from "vitest";
import { resolveLanguageCode, extractBiblicalSearchKeywords } from "../../src/services/language_resolver.js";
import { handleAskHolyBible } from "../../src/tools/handlers/ask_holy_bible.handler.js";
import { PromptRepositoryEngine } from "../../src/prompts_repository.js";


describe("E2E: Universal Multilingual Resolution & Routing Matrix", () => {
  const languageCases = [
    { sample: "Qu'est-ce que l'amour de Dieu selon la Bible?", expectedLang: "fra" },
    { sample: "Was sagt die Bibel über die Hoffnung und Gnade?", expectedLang: "deu" },
    { sample: "¿Qué dice la Biblia sobre la fe verdadera?", expectedLang: "spa" },
    { sample: "Що Біблія говорить про віру та надію?", expectedLang: "ukr" },
    { sample: "Czym jest miłość według Pisma Świętego?", expectedLang: "pol" },
    { sample: "מה אומר התנך על אהבה וחסד?", expectedLang: "heb" },
    { sample: "Τι λέει η Αγία Γραφή για την αγάπη;", expectedLang: "grc" }
  ];

  for (const { sample, expectedLang } of languageCases) {
    it(`should resolve ${expectedLang.toUpperCase()} from query sample: "${sample.slice(0, 30)}..."`, () => {
      const resolved = resolveLanguageCode("auto", sample);
      expect(resolved).toBe(expectedLang);

      const keywords = extractBiblicalSearchKeywords(sample);
      expect(keywords.length).toBeGreaterThan(0);
    });
  }

  it("should generate ask_holy_bible context with correct sensitivity profile when French is detected", async () => {
    const result = await handleAskHolyBible({
      question: "Qu'est-ce que la grâce de Dieu?",
      language: "fra",
      warmth: 80
    });

    expect(result.content[0]?.text).toBeDefined();
    const data = JSON.parse(result.content[0]?.text as string);
    expect(data.contextText).toBeDefined();
    expect(data.sensitivityProfile?.score).toBe(80);
    expect(data.accuracyScore).toBeDefined();
  });

  it("should format holy_bible_study prompt with French rules when French is requested", () => {
    const promptText = PromptRepositoryEngine.buildHydratedStudyPrompt({
      topic: "la grâce",
      language: "fra",
      detailLevel: "medium"
    });

    expect(promptText).toContain("Study Topic: \"la grâce\"");
    expect(promptText).toContain("Core Essence & Anchor");
  });

  it("should format holy_bible_study prompt with German rules when German is requested", () => {
    const promptText = PromptRepositoryEngine.buildHydratedStudyPrompt({
      topic: "Glaube und Hoffnung",
      language: "deu",
      detailLevel: "medium"
    });

    expect(promptText).toContain("Study Topic: \"Glaube und Hoffnung\"");
    expect(promptText).toContain("Core Essence & Anchor");
  });
});

