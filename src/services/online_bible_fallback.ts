import { getBookNumber } from "../data/osis_dictionary.js";

export const BOLLS_BOOK_MAP: Record<number, string> = {
  1: "Gen", 2: "Exod", 3: "Lev", 4: "Num", 5: "Deut", 6: "Josh", 7: "Judg", 8: "Ruth",
  9: "1Sam", 10: "2Sam", 11: "1Kgs", 12: "2Kgs", 13: "1Chr", 14: "2Chr", 15: "Ezra",
  16: "Neh", 17: "Esth", 18: "Job", 19: "Ps", 20: "Prov", 21: "Eccl", 22: "Song",
  23: "Isa", 24: "Jer", 25: "Lam", 26: "Ezek", 27: "Dan", 28: "Hos", 29: "Joel",
  30: "Amos", 31: "Obad", 32: "Jonah", 33: "Mic", 34: "Nah", 35: "Hab", 36: "Zeph",
  37: "Hag", 38: "Zech", 39: "Mal", 40: "Matt", 41: "Mark", 42: "Luke", 43: "John",
  44: "Acts", 45: "Rom", 46: "1Cor", 47: "2Cor", 48: "Gal", 49: "Eph", 50: "Phil",
  51: "Col", 52: "1Thess", 53: "2Thess", 54: "1Tim", 55: "2Tim", 56: "Titus", 57: "Phlm",
  58: "Heb", 59: "Jas", 60: "1Pet", 61: "2Pet", 62: "1John", 63: "2John", 64: "3John",
  65: "Jude", 66: "Rev"
};

/** 🌐 Dynamic Online Scripture Fallback Engine (when SQLite is not yet downloaded or verse missing) */
export async function fetchOnlineVerseText(osisCode: string, chapter: number, verse: number, lang: string): Promise<string | null> {
  try {
    const bookNum = getBookNumber(osisCode);
    if (bookNum <= 0) return null;

    const isUkr = lang === 'ukr' || lang === 'uk';
    const isRu = lang === 'ru' || lang === 'rus';
    const translation = isUkr ? 'UBIO' : (isRu ? 'SYNOD' : 'KJV');

    const res = await fetch(`https://bolls.life/get-verse/${translation}/${bookNum}/${chapter}/${verse}/`, {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data: any = await res.json();
      if (data?.text) {
        return String(data.text).replace(/<[^>]+>/g, '').trim();
      }
    }
  } catch (_) {}
  return null;
}

export async function fetchOnlineChapterVerses(osisCode: string, chapter: number, lang: string): Promise<any[]> {
  try {
    const bookNum = getBookNumber(osisCode);
    if (bookNum <= 0) return [];

    const isUkr = lang === 'ukr' || lang === 'uk';
    const isRu = lang === 'ru' || lang === 'rus';
    const translation = isUkr ? 'UBIO' : (isRu ? 'SYNOD' : 'KJV');

    const res = await fetch(`https://bolls.life/get-chapter/${translation}/${bookNum}/${chapter}/`, {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data: any = await res.json();
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          book: osisCode,
          chapter,
          verse: item.verse,
          text: String(item.text || '').replace(/<[^>]+>/g, '').trim(),
          language: lang
        }));
      }
    }
  } catch (_) {}
  return [];
}

export async function fetchOnlineKeywordSearch(keyword: string, lang: string = "ukr", limit: number = 6): Promise<any[]> {
  try {
    const isUkr = lang === "ukr" || lang === "uk";
    const isRu = lang === "ru" || lang === "rus";
    const translation = isUkr ? "UBIO" : (isRu ? "SYNOD" : "NIV");
    const fallbackTranslation = isUkr ? "UKRK" : (isRu ? "RST" : "ESV");

    let res = await fetch(`https://bolls.life/search/${translation}/?search=${encodeURIComponent(keyword)}`, {
      headers: { "User-Agent": "HolyBibleMCP/1.0" },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) {
      res = await fetch(`https://bolls.life/search/${fallbackTranslation}/?search=${encodeURIComponent(keyword)}`, {
        headers: { "User-Agent": "HolyBibleMCP/1.0" },
        signal: AbortSignal.timeout(4000)
      });
    }

    if (res.ok) {
      const data: any = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.slice(0, limit).map((item: any) => ({
          book: BOLLS_BOOK_MAP[item.book] || `Book${item.book}`,
          chapter: item.chapter,
          verse: item.verse,
          text: String(item.text || "").replace(/<[^>]+>/g, "").trim(),
          language: lang
        }));
      }
    }
  } catch (_) {}
  return [];
}
