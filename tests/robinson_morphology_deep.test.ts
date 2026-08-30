import { describe, it, expect } from "vitest";
import { parseGreekMorphCode } from "../src/morphology/robinson_parser.js";

describe("Deep Greek Robinson Morphology Parser", () => {
  it("should accurately parse 2nd Aorist finite verbs, infinitives, and participles", () => {
    // 2nd Aorist Active Indicative 3rd Person Singular (e.g. εἶπεν, ἔλαβεν)
    const v2aai = parseGreekMorphCode("V-2AAI-3S");
    expect(v2aai.pos).toBe("Verb");
    expect(v2aai.tense).toBe("2nd Aorist");
    expect(v2aai.voice).toBe("Active");
    expect(v2aai.mood).toBe("Indicative");
    expect(v2aai.person).toBe("3rd Person");
    expect(v2aai.number).toBe("Singular");
    expect(v2aai.description).toBe("Verb - 2nd Aorist Active Indicative (3rd Person Singular)");

    // 2nd Aorist Active Infinitive (e.g. ἰδεῖν, φαγεῖν)
    const v2aan = parseGreekMorphCode("V-2AAN");
    expect(v2aan.pos).toBe("Verb");
    expect(v2aan.tense).toBe("2nd Aorist");
    expect(v2aan.voice).toBe("Active");
    expect(v2aan.mood).toBe("Infinitive");
    expect(v2aan.description).toBe("Verb - 2nd Aorist Active Infinitive");

    // 2nd Aorist Active Participle (e.g. ἐλθών, λαβών)
    const v2aap = parseGreekMorphCode("V-2AAP-NSM");
    expect(v2aap.pos).toBe("Verb");
    expect(v2aap.tense).toBe("2nd Aorist");
    expect(v2aap.voice).toBe("Active");
    expect(v2aap.mood).toBe("Participle");
    expect(v2aap.caseGrammatical).toBe("Nominative");
    expect(v2aap.gender).toBe("Masculine");
    expect(v2aap.number).toBe("Singular");
    expect(v2aap.description).toBe("Verb - 2nd Aorist Active Participle, Nominative Masculine Singular");

    // 2nd Present / Aorist Participle
    const v2pap = parseGreekMorphCode("V-2PAP-NSM");
    expect(v2pap.tense).toBe("2nd Present");
  });

  it("should accurately parse Perfect (R/X) and Pluperfect (L/Y) tenses", () => {
    // Perfect Active Indicative with R (e.g. γέγραπται)
    const vRai = parseGreekMorphCode("V-RAI-3S");
    expect(vRai.tense).toBe("Perfect");
    expect(vRai.voice).toBe("Active");
    expect(vRai.mood).toBe("Indicative");

    // Pluperfect Active Indicative with L (e.g. ᾔδεισαν)
    const vLai = parseGreekMorphCode("V-LAI-3P");
    expect(vLai.tense).toBe("Pluperfect");
    expect(vLai.person).toBe("3rd Person");
    expect(vLai.number).toBe("Plural");
  });

  it("should parse Optative mood and Deponent voices", () => {
    // Aorist Active Optative (e.g. γένοιτο)
    const aao = parseGreekMorphCode("V-AAO-3S");
    expect(aao.mood).toBe("Optative");
    expect(aao.tense).toBe("Aorist");

    // Present Middle/Passive Deponent Optative (e.g. μὴ γένοιτο)
    const pno = parseGreekMorphCode("V-PNO-3S");
    expect(pno.voice).toBe("Middle/Passive Deponent");
    expect(pno.mood).toBe("Optative");

    // Passive Deponent
    const aoi = parseGreekMorphCode("V-AOI-3S");
    expect(aoi.voice).toBe("Passive Deponent");
    expect(aoi.mood).toBe("Indicative");
  });

  it("should cleanly format pronouns without double spaces when gender is omitted", () => {
    // 1st Person Personal Pronoun Nominative Singular (ἐγώ)
    const p1ns = parseGreekMorphCode("P-1NS");
    expect(p1ns.pos).toBe("Personal Pronoun");
    expect(p1ns.person).toBe("1 Person");
    expect(p1ns.caseGrammatical).toBe("Nominative");
    expect(p1ns.number).toBe("Singular");
    expect(p1ns.description).not.toContain("  ");
    expect(p1ns.description).toBe("Personal Pronoun (1 Person) - Nominative Singular");

    // Relative Pronoun Nominative Masculine Singular (ὅς)
    const rNsm = parseGreekMorphCode("R-NSM");
    expect(rNsm.pos).toBe("Relative Pronoun");
    expect(rNsm.caseGrammatical).toBe("Nominative");
    expect(rNsm.gender).toBe("Masculine");
    expect(rNsm.number).toBe("Singular");
    expect(rNsm.description).toBe("Relative Pronoun - Nominative Masculine Singular");
  });
});
