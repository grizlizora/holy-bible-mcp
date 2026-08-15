import { parseGreekMorphCode } from "./morphology/robinson_parser.js";
import { parseHebrewMorphCode } from "./morphology/hebrew_parser.js";
import { getInterlinearVerse, getStrongsEtymology, COMMON_LEMMA_MAP } from "./morphology/interlinear_builder.js";

/**
 * 🏛️ Morphology & Original Languages Engine Facade
 * Provides Hebrew (WLC), Aramaic, Greek (NA28/LXX) interlinear text,
 * Robinson grammatical parsing, Strong's Concordance, and Trench's Synonyms.
 */
export class MorphologyEngine {
  public static parseGreekMorphCode = parseGreekMorphCode;
  public static parseHebrewMorphCode = parseHebrewMorphCode;
  public static getInterlinearVerse = getInterlinearVerse;
  public static getStrongsEtymology = getStrongsEtymology;
}

export { COMMON_LEMMA_MAP };
export * from "./morphology/types.js";
