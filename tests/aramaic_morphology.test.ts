import { describe, it, expect } from "vitest";
import { parseAramaicMorphCode } from "../src/morphology/hebrew_parser.js";
import { MorphologyEngine } from "../src/morphology_engine.js";

describe("Biblical Aramaic Morphology Parser", () => {
  it("should parse Aramaic Peal verb (A-V-q-3ms)", () => {
    const result = parseAramaicMorphCode("A-V-q-3ms");
    expect(result.pos).toBe("Verb");
    expect(result.stem).toContain("Peal");
    expect(result.person).toBe("3 Person");
    expect(result.gender).toBe("Masculine");
    expect(result.number).toBe("Singular");
    expect(result.description).toContain("Biblical Aramaic Verb - Peal (Ground)");
  });

  it("should parse Aramaic Aphel causative verb (A-V-a-3ms)", () => {
    const result = parseAramaicMorphCode("A-V-a-3ms");
    expect(result.pos).toBe("Verb");
    expect(result.stem).toContain("Aphel");
    expect(result.tense).toContain("Perfect");
    expect(result.description).toContain("Biblical Aramaic Verb");
  });

  it("should parse Aramaic Pael intensive verb (A-V-p-3mp)", () => {
    const result = parseAramaicMorphCode("A-V-p-3mp");
    expect(result.pos).toBe("Verb");
    expect(result.stem).toContain("Pael");
    expect(result.number).toBe("Plural");
    expect(result.description).toContain("Biblical Aramaic Verb");
  });

  it("should parse Aramaic noun with prefixes (AC/AR/Ncmse)", () => {
    const result = parseAramaicMorphCode("AC/AR/Ncmse");
    expect(result.pos).toBe("Aramaic Noun");
    expect(result.gender).toBe("Masculine");
    expect(result.number).toBe("Singular");
    expect(result.state).toContain("Emphatic");
    expect(result.description).toContain("Aramaic Conjunction");
    expect(result.description).toContain("Aramaic Preposition");
  });

  it("should parse Aramaic relative prefix (Ad/V-q-3ms)", () => {
    const result = parseAramaicMorphCode("Ad/V-q-3ms");
    expect(result.description).toContain("Aramaic Relative");
    expect(result.stem).toContain("Peal");
  });

  it("should route correctly through MorphologyEngine.parseMorphology with 'arc' or auto detection", () => {
    const autoResult = MorphologyEngine.parseMorphology("A-V-q-3ms", "auto");
    expect(autoResult.pos).toBe("Verb");
    expect(autoResult.description).toContain("Biblical Aramaic Verb");

    const explicitResult = MorphologyEngine.parseMorphology("V-q-3ms", "arc");
    expect(explicitResult.pos).toBe("Verb");
    expect(explicitResult.description).toContain("Biblical Aramaic Verb");
  });
});

