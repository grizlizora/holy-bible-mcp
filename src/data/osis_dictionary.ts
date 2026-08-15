import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const primaryPath = path.resolve(__dirname, './osis_dictionary.json');
const fallbackPath = path.resolve(__dirname, '../src/data/osis_dictionary.json');

let dictionaryData: any = {};
try {
  const targetPath = fs.existsSync(primaryPath) ? primaryPath : fallbackPath;
  const raw = fs.readFileSync(targetPath, 'utf-8');
  dictionaryData = JSON.parse(raw);
} catch (e) {
  console.error('[ERROR] Failed to load osis_dictionary.json:', e);
}

export interface BookDictEntry {
  names?: Record<string, string>;
  aliases?: string[];
}

export const OSIS_BOOK_NAMES: Record<string, Record<string, string>> = {};
export const OSIS_ALIAS_MAP: Record<string, string> = {};
export const OSIS_BOOK_NUMBER: Record<string, number> = {};

const books = dictionaryData.books || {};

let bookIndex = 1;
for (const [osisCode, bookDataRaw] of Object.entries(books)) {
  const osis = osisCode.toUpperCase();
  const bookData = bookDataRaw as BookDictEntry;
  OSIS_ALIAS_MAP[osis] = osis;
  OSIS_BOOK_NUMBER[osis] = bookIndex++;

  if (Array.isArray(bookData.aliases)) {
    for (const alias of bookData.aliases) {
      OSIS_ALIAS_MAP[alias.toUpperCase()] = osis;
    }
  }

  if (bookData.names && typeof bookData.names === 'object') {
    for (const [lang, localizedName] of Object.entries(bookData.names)) {
      if (!OSIS_BOOK_NAMES[lang]) OSIS_BOOK_NAMES[lang] = {};
      OSIS_BOOK_NAMES[lang][osis] = String(localizedName);
      // Also register full localized name as alias
      OSIS_ALIAS_MAP[String(localizedName).toUpperCase()] = osis;
    }
  }
}

export function getBookNumber(input: string): number {
  if (!input) return 0;
  const clean = input.trim().toUpperCase().replace(/[^A-ZА-ЯІЇЄ0-9]/gi, '');
  const osis = OSIS_ALIAS_MAP[clean] || OSIS_ALIAS_MAP[clean.slice(0, 4)] || OSIS_ALIAS_MAP[clean.slice(0, 3)] || clean;
  return OSIS_BOOK_NUMBER[osis] || 0;
}

export function getLocalizedBookNameFromDict(osisCode: string, lang = 'ukr'): string {
  const code = (osisCode || '').toUpperCase().trim();
  const langMap = OSIS_BOOK_NAMES[lang] || OSIS_BOOK_NAMES.ukr || {};
  const engMap = OSIS_BOOK_NAMES.eng || {};
  return langMap[code] || engMap[code] || code;
}
