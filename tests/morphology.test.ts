import { describe, it, expect } from "vitest";
import { parseGreekMorphCode } from "../src/morphology/robinson_parser.js";
import { parseHebrewMorphCode } from "../src/morphology/hebrew_parser.js";
import { UkrainianMorphologyEngine } from "../src/search/morphology/ukrainian_morphology_engine.js";

describe("Greek Robinson Morphology Parser", () => {
  it("should correctly parse Greek finite verb (V-AAI-3S)", () => {
    const result = parseGreekMorphCode("V-AAI-3S");
    expect(result.pos).toBe("Verb");
    expect(result.tense).toBe("Aorist");
    expect(result.voice).toBe("Active");
    expect(result.mood).toBe("Indicative");
    expect(result.person).toBe("3rd Person");
    expect(result.number).toBe("Singular");
    expect(result.description).toContain("Aorist Active Indicative");
  });

  it("should correctly parse Greek participle (V-PAP-NSM)", () => {
    const result = parseGreekMorphCode("V-PAP-NSM");
    expect(result.pos).toBe("Verb");
    expect(result.tense).toBe("Present");
    expect(result.voice).toBe("Active");
    expect(result.mood).toBe("Participle");
    expect(result.caseGrammatical).toBe("Nominative");
    expect(result.number).toBe("Singular");
    expect(result.gender).toBe("Masculine");
  });

  it("should correctly parse Greek noun (N-NSF)", () => {
    const result = parseGreekMorphCode("N-NSF");
    expect(result.pos).toBe("Noun");
    expect(result.caseGrammatical).toBe("Nominative");
    expect(result.number).toBe("Singular");
    expect(result.gender).toBe("Feminine");
  });

  it("should handle indeclinable loanwords (HEB, ARAM)", () => {
    expect(parseGreekMorphCode("HEB").pos).toBe("Hebrew Word");
    expect(parseGreekMorphCode("ARAM").pos).toBe("Aramaic Word");
  });
});

describe("Hebrew WLC Morphology Parser", () => {
  it("should correctly parse Hebrew Qal verb (V-q-3ms)", () => {
    const result = parseHebrewMorphCode("V-q-3ms");
    expect(result.pos).toBe("Verb");
    expect(result.stem).toBe("Qal");
    expect(result.person).toBe("3 Person");
    expect(result.gender).toBe("Masculine");
    expect(result.number).toBe("Singular");
  });

  it("should correctly decompose Hebrew clitic prefix and noun (HR/Ncfsa)", () => {
    const result = parseHebrewMorphCode("HR/Ncfsa");
    expect(result.pos).toBe("Noun");
    expect(result.gender).toBe("Feminine");
    expect(result.number).toBe("Singular");
    expect(result.state).toBe("Absolute");
    expect(result.description).toContain("Preposition");
  });

  it("should correctly parse proper nouns (Np)", () => {
    const result = parseHebrewMorphCode("Np");
    expect(result.pos).toBe("Proper Noun");
  });
});

describe("Ukrainian Morphology Engine", () => {
  it("should normalize orthography (accents, apostrophes, ґ)", () => {
    expect(UkrainianMorphologyEngine.normalizeOrthography("м’ясо")).toBe("м'ясо");
    expect(UkrainianMorphologyEngine.normalizeOrthography("ґрунт")).toBe("грунт");
  });

  it("should resolve irregular/suppletive verb forms to lemma", () => {
    expect(UkrainianMorphologyEngine.extractStem("буде")).toBe("бути");
    expect(UkrainianMorphologyEngine.extractStem("були")).toBe("бути");
    expect(UkrainianMorphologyEngine.extractStem("є")).toBe("бути");
    expect(UkrainianMorphologyEngine.extractStem("йшов")).toBe("іти");
    expect(UkrainianMorphologyEngine.extractStem("можу")).toBe("могти");
  });

  it("should strip noun and adjective inflectional endings", () => {
    const stemNoun = UkrainianMorphologyEngine.extractStem("благословеннями");
    expect(stemNoun.length).toBeLessThan("благословеннями".length);
    expect(stemNoun).toBe("благословенн");

    const stemAdj = UkrainianMorphologyEngine.extractStem("духовного");
    expect(stemAdj).toBe("духовн");
  });

  it("should generate valid FTS5 boolean query clauses", () => {
    const fts = UkrainianMorphologyEngine.generateFtsQuery("віра та надія");
    expect(fts).toContain("AND");
    expect(fts).toContain('"віра"*');
    expect(fts).toContain('"наді"*');
  });
});
