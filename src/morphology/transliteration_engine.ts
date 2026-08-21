/**
 * 🔤 TransliterationEngine (transliteration_engine.ts)
 * 
 * Pure phonological transliterator with Niqqud/cantillation stripping
 * for Biblical Hebrew (WLC) and Koine Greek (NA28/LXX).
 */

export const GREEK_TRANSLIT_MAP: Record<string, string> = {
  'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'ē', 'θ': 'th',
  'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p',
  'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'ph', 'χ': 'ch', 'ψ': 'ps', 'ω': 'ō'
};

export const HEBREW_TRANSLIT_MAP: Record<string, string> = {
  'א': 'ʾ', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'w', 'ז': 'z', 'ח': 'ḥ',
  'ט': 'ṭ', 'י': 'y', 'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n',
  'ן': 'n', 'ס': 's', 'ע': 'ʿ', 'פ': 'p', 'ף': 'p', 'צ': 'ṣ', 'ץ': 'ṣ', 'ק': 'q',
  'ר': 'r', 'ש': 'š', 'ת': 't'
};

export class TransliterationEngine {
  public static stripDiacritics(text: string): string {
    return text
      .normalize('NFD')
      // Strip Hebrew Niqqud & cantillation (0591-05BD, 05BF, 05C1-05C2, 05C4-05C5, 05C7)
      .replace(/[\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C5\u05C7]/g, '')
      // Strip combining diacritical marks & Greek polytonic accents
      .replace(/[\u0300-\u036F\u1F00-\u1FFE]/g, '')
      .normalize('NFC');
  }

  public static transliterate(text: string, isHebrew: boolean): string {
    const unaccented = this.stripDiacritics(text);
    const map = isHebrew ? HEBREW_TRANSLIT_MAP : GREEK_TRANSLIT_MAP;
    const lower = unaccented.toLowerCase();
    let result = '';
    for (const char of lower) {
      result += map[char] || char;
    }
    return result.replace(/[^\p{L}\p{M}\sʾʿ]/gu, '').trim() || unaccented;
  }

  public static cleanWord(text: string): string {
    return this.stripDiacritics(text).replace(/[^\p{L}\p{M}]/gu, '');
  }
}
