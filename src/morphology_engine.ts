import { parseGreekMorphCode } from "./morphology/robinson_parser.js";
import { parseHebrewMorphCode, parseAramaicMorphCode } from "./morphology/hebrew_parser.js";
import { getInterlinearVerse, getStrongsEtymology, COMMON_LEMMA_MAP } from "./morphology/interlinear_builder.js";

/**
 * 🏛️ Morphology & Original Languages Engine Facade
 * Provides Hebrew (WLC), Aramaic, Greek (NA28/LXX) interlinear text,
 * Robinson grammatical parsing, Strong's Concordance, and Trench's Synonyms.
 */
export class MorphologyEngine {
  public static parseGreekMorphCode = parseGreekMorphCode;
  public static parseHebrewMorphCode = parseHebrewMorphCode;
  public static parseAramaicMorphCode = parseAramaicMorphCode;
  public static getInterlinearVerse = getInterlinearVerse;
  public static getStrongsEtymology = getStrongsEtymology;

  public static parseMorphology(code: string, lang: 'grc' | 'heb' | 'arc' | 'auto' = 'auto') {
    if (lang === 'arc' || (lang === 'auto' && (code.startsWith('A-') || code.startsWith('A/') || code.startsWith('ARAM')))) {
      return parseAramaicMorphCode(code);
    }
    if (lang === 'heb' || (lang === 'auto' && (code.includes('/') || code.startsWith('H')))) {
      return parseHebrewMorphCode(code);
    }
    return parseGreekMorphCode(code);
  }
}

export { COMMON_LEMMA_MAP, parseAramaicMorphCode };
export * from "./morphology/types.js";

