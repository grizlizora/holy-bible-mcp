import dictionaryData from '../../../../mcp-server/src/data/osis_dictionary.json';

export interface BookDictEntry {
  names?: Record<string, string>;
  aliases?: string[];
}

export const OSIS_BOOK_NAMES: Record<string, Record<string, string>> = {};
export const OSIS_ALIAS_MAP: Record<string, string> = {};

const books = (dictionaryData as any).books || {};

for (const [osisCode, bookDataRaw] of Object.entries(books)) {
  const osis = osisCode.toUpperCase();
  const bookData = bookDataRaw as BookDictEntry;
  OSIS_ALIAS_MAP[osis] = osis;

  if (Array.isArray(bookData.aliases)) {
    for (const alias of bookData.aliases) {
      OSIS_ALIAS_MAP[alias.toUpperCase()] = osis;
    }
  }

  if (bookData.names && typeof bookData.names === 'object') {
    for (const [lang, localizedName] of Object.entries(bookData.names)) {
      if (!OSIS_BOOK_NAMES[lang]) OSIS_BOOK_NAMES[lang] = {};
      OSIS_BOOK_NAMES[lang][osis] = String(localizedName);
    }
  }
}

export const OSIS_TO_UKRAINIAN_MAP = OSIS_BOOK_NAMES.ukr || {};

export function getLocalizedBookName(osisCode: string, lang = 'ukr'): string {
  const cleanCode = (osisCode || '').toUpperCase().replace(/\s+/g, '');
  const canonicalCode = OSIS_ALIAS_MAP[cleanCode] || cleanCode;
  const langKey = lang.toLowerCase() === 'eng' || lang.toLowerCase() === 'en' ? 'eng' : 'ukr';
  
  if (OSIS_BOOK_NAMES[langKey]?.[canonicalCode]) {
    return OSIS_BOOK_NAMES[langKey][canonicalCode];
  }
  if (OSIS_BOOK_NAMES.ukr?.[canonicalCode]) {
    return OSIS_BOOK_NAMES.ukr[canonicalCode];
  }
  return osisCode;
}

export function formatBiblicalDisplayTitle(input: string, lang = 'ukr'): string {
  if (!input || input === '...' || input === '…') return '';
  const trimmed = input.trim();

  if (/^(?:LocalizedName|BookAbbreviation|BookAbbr|Chapter:Verse|LanguageCode|LangCode)\b/i.test(trimmed)) {
    return '';
  }

  let cleanedText = trimmed
    .replace(/\?\s*No,\s*wait[\s\S]*/i, '')
    .replace(/The\s+prompt\s+says[\s\S]*/i, '')
    .replace(/\bОпівночі\b/gi, "Об'явлення")
    .trim();

  const match = cleanedText.match(/^(.+?)\s+(\d+:\d+(?:-\d+)?.*)$/);
  if (match) {
    const rawBook = match[1].trim();
    const chapterVerse = match[2].trim();
    const code = rawBook.toUpperCase().replace(/\s+/g, '');
    const localizedName = getLocalizedBookName(code, lang);
    if (localizedName && localizedName !== code) {
      return `${localizedName} ${chapterVerse}`;
    }
  }
  return cleanedText;
}

export function toCanonicalReferenceKey(str: string): string {
  if (!str) return '';
  let s = str.trim().toUpperCase().replace(/[-–—]/g, '-').replace(/_/g, ' ');
  const m = s.match(/^([1-3]?\s*[\p{L}\p{M}]+)\s*(.*)$/u);
  if (m) {
    const rawBook = m[1].replace(/\s+/g, '');
    const chapterVerse = m[2].replace(/\s+/g, '');
    const osis = OSIS_ALIAS_MAP[rawBook] || rawBook;
    return `${osis}_${chapterVerse}`;
  }
  return s.replace(/\s+/g, '');
}
