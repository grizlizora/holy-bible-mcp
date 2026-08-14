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

const books = dictionaryData.books || {};

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

export function getLocalizedBookNameFromDict(osisCode: string, lang = 'ukr'): string {
  const code = (osisCode || '').toUpperCase().trim();
  const langMap = OSIS_BOOK_NAMES[lang] || OSIS_BOOK_NAMES.ukr || {};
  const engMap = OSIS_BOOK_NAMES.eng || {};
  return langMap[code] || engMap[code] || code;
}
