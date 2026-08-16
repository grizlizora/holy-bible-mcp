import { getBookNumber } from "../data/osis_dictionary.js";
export const BOLLS_BOOK_MAP = {
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
// ⚡ Fast In-Memory LRU Cache for Online Queries (prevents redundant HTTP requests)
const onlineVerseCache = new Map();
const onlineSearchCache = new Map();
const ONLINE_CACHE_TTL_MS = 3600_000; // 1 hour
/**
 * 🌐 Multi-Provider Resilient Online Verse Resolver
 * Queries primary CDN/API (Bolls.life) with automated fallback to secondary mirror (Bible-API / UKRK / KJV).
 */
export async function fetchOnlineVerseText(osisCode, chapter, verse, lang) {
    const cacheKey = `${osisCode}:${chapter}:${verse}:${lang}`;
    const cached = onlineVerseCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
        return cached.text;
    }
    const bookNum = getBookNumber(osisCode);
    if (bookNum <= 0)
        return null;
    const isUkr = lang === 'ukr' || lang === 'uk';
    const isRu = lang === 'ru' || lang === 'rus';
    const primaryTranslation = isUkr ? 'UBIO' : (isRu ? 'SYNOD' : 'KJV');
    const fallbackTranslation = isUkr ? 'UKRK' : (isRu ? 'RST' : 'WEB');
    // 1. Primary Query
    try {
        const res = await fetch(`https://bolls.life/get-verse/${primaryTranslation}/${bookNum}/${chapter}/${verse}/`, {
            headers: { "User-Agent": "HolyBibleMCP/2.0" },
            signal: AbortSignal.timeout(3500)
        });
        if (res.ok) {
            const data = await res.json();
            if (data?.text) {
                const cleanText = String(data.text).replace(/<[^>]+>/g, '').trim();
                onlineVerseCache.set(cacheKey, { text: cleanText, expiresAt: Date.now() + ONLINE_CACHE_TTL_MS });
                return cleanText;
            }
        }
    }
    catch (_) { }
    // 2. Secondary Fallback Query
    try {
        const resFallback = await fetch(`https://bolls.life/get-verse/${fallbackTranslation}/${bookNum}/${chapter}/${verse}/`, {
            headers: { "User-Agent": "HolyBibleMCP/2.0" },
            signal: AbortSignal.timeout(3500)
        });
        if (resFallback.ok) {
            const data = await resFallback.json();
            if (data?.text) {
                const cleanText = String(data.text).replace(/<[^>]+>/g, '').trim();
                onlineVerseCache.set(cacheKey, { text: cleanText, expiresAt: Date.now() + ONLINE_CACHE_TTL_MS });
                return cleanText;
            }
        }
    }
    catch (_) { }
    return null;
}
export async function fetchOnlineChapterVerses(osisCode, chapter, lang) {
    try {
        const bookNum = getBookNumber(osisCode);
        if (bookNum <= 0)
            return [];
        const isUkr = lang === 'ukr' || lang === 'uk';
        const isRu = lang === 'ru' || lang === 'rus';
        const translation = isUkr ? 'UBIO' : (isRu ? 'SYNOD' : 'KJV');
        const res = await fetch(`https://bolls.life/get-chapter/${translation}/${bookNum}/${chapter}/`, {
            headers: { "User-Agent": "HolyBibleMCP/2.0" },
            signal: AbortSignal.timeout(4500)
        });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                return data.map((item) => ({
                    book: osisCode,
                    chapter,
                    verse: item.verse,
                    text: String(item.text || '').replace(/<[^>]+>/g, '').trim(),
                    language: lang
                }));
            }
        }
    }
    catch (_) { }
    return [];
}
export async function fetchOnlineKeywordSearch(keyword, lang = "ukr", limit = 6) {
    const cacheKey = `${keyword}::${lang}::${limit}`;
    const cached = onlineSearchCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
        return cached.results;
    }
    try {
        const isUkr = lang === "ukr" || lang === "uk";
        const isRu = lang === "ru" || lang === "rus";
        const translation = isUkr ? "UBIO" : (isRu ? "SYNOD" : "NIV");
        const fallbackTranslation = isUkr ? "UKRK" : (isRu ? "RST" : "ESV");
        let res = await fetch(`https://bolls.life/search/${translation}/?search=${encodeURIComponent(keyword)}`, {
            headers: { "User-Agent": "HolyBibleMCP/2.0" },
            signal: AbortSignal.timeout(4000)
        });
        if (!res.ok) {
            res = await fetch(`https://bolls.life/search/${fallbackTranslation}/?search=${encodeURIComponent(keyword)}`, {
                headers: { "User-Agent": "HolyBibleMCP/2.0" },
                signal: AbortSignal.timeout(4000)
            });
        }
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                const results = data.slice(0, limit).map((item) => {
                    const osis = BOLLS_BOOK_MAP[item.book] || "GEN";
                    return {
                        book: osis,
                        chapter: item.chapter,
                        verse: item.verse,
                        text: (item.text || "").replace(/<[^>]+>/g, "").trim(),
                        score: 0.95
                    };
                });
                onlineSearchCache.set(cacheKey, { results, expiresAt: Date.now() + ONLINE_CACHE_TTL_MS });
                return results;
            }
        }
    }
    catch (_) { }
    return [];
}
