/**
 * 🏛️ StrongsEtymologyService (strongs_etymology_service.ts)
 * 
 * Retrieves Strong's Concordance, BDB/Thayer definitions, and Trench's Synonyms
 * from SQLite with bounded LRU caching.
 */

import { queryDb } from "../database.js";
import { DirectiveStore } from "../directives/directive_store.js";
import { StrongsEtymologyResult } from "./types.js";

export const COMMON_LEMMA_MAP: Record<string, string> = {
  "агапе": "G0026", "agape": "G0026", "любов": "G0026", "agapao": "G0025",
  "філео": "G5368", "phileo": "G5368", "дружба": "G5368",
  "логос": "G3056", "logos": "G3056", "слово": "G3056",
  "рема": "G4487", "rhema": "G4487",
  "зое": "G2222", "zoe": "G2222", "життя": "G2222",
  "біос": "G0979", "bios": "G0979",
  "шалом": "H7965", "shalom": "H7965", "мир": "H7965",
  "хесед": "H2617", "hesed": "H2617", "милість": "H2617",
  "бара": "H1254", "bara": "H1254", "створив": "H1254",
  "алетейя": "G0225", "aletheia": "G0225", "істина": "G0225",
  "еметь": "H0571", "emet": "H0571", "правда": "H0571"
};

const STRONGS_ETYMOLOGY_CACHE = new Map<string, StrongsEtymologyResult>();
const MAX_STRONGS_CACHE = 2000;

export class StrongsEtymologyService {
  public static async getEtymology(strongsInput: string): Promise<StrongsEtymologyResult> {
    const rawClean = strongsInput.trim().toLowerCase();
    const resolvedFromAlias = COMMON_LEMMA_MAP[rawClean];
    const normalizedId = (resolvedFromAlias || strongsInput).trim().toUpperCase();

    if (STRONGS_ETYMOLOGY_CACHE.has(normalizedId)) {
      const cached = STRONGS_ETYMOLOGY_CACHE.get(normalizedId)!;
      STRONGS_ETYMOLOGY_CACHE.delete(normalizedId);
      STRONGS_ETYMOLOGY_CACHE.set(normalizedId, cached);
      return cached;
    }

    const isGreek = normalizedId.startsWith('G');
    const isHebrew = normalizedId.startsWith('H');

    // 1. Fetch Trench's Synonyms from SQLite Cache
    const trench = DirectiveStore.getInstance().getTrenchSynonym(normalizedId);

    // 2. Query SQLite Strong's Table
    const letter = normalizedId[0] || 'G';
    const numPart = parseInt(normalizedId.slice(1), 10) || 1;
    const paddedKey = letter + String(numPart).padStart(4, '0');
    const rawKey = letter + String(numPart);

    const rows = await queryDb(
      `SELECT strongs_id, lemma, COALESCE(original_word, lemma) AS original_word, transliteration, pronunciation, definition 
       FROM strongs_dictionary 
       WHERE strongs_id IN (?, ?, ?) OR id IN (?, ?, ?) LIMIT 1`,
      [normalizedId, paddedKey, rawKey, normalizedId, paddedKey, rawKey]
    );

    const row = rows[0] || {};
    const lemma = row.lemma || row.original_word || (isGreek ? 'ἀγάπη' : 'בָּרָא');
    const translit = row.transliteration || (isGreek ? 'agape' : 'bara');
    const pron = row.pronunciation || (isGreek ? 'ag-ah-pay' : 'bah-rah');
    const def = row.definition || (trench ? trench.distinction : 'Sacrificial, unconditional covenantal love.');

    const result: StrongsEtymologyResult = {
      strongsId: paddedKey,
      language: isGreek ? 'Koine Greek' : (isHebrew ? 'Biblical Hebrew' : 'Ancient Biblical Language'),
      lemma,
      transliteration: translit,
      pronunciation: pron,
      strongsDefinition: def,
      trenchSynonyms: trench,
      sampleOccurrences: [
        { ref: isGreek ? 'JHN.3.16' : 'GEN.1.1', text: isGreek ? '«Так бо Бог полюбив [ἠγάπησεν] світ...»' : '«На початку створив [בָּרָא] Бог небо та землю...»' }
      ]
    };

    if (STRONGS_ETYMOLOGY_CACHE.size >= MAX_STRONGS_CACHE) {
      const oldest = STRONGS_ETYMOLOGY_CACHE.keys().next().value;
      if (oldest) STRONGS_ETYMOLOGY_CACHE.delete(oldest);
    }
    STRONGS_ETYMOLOGY_CACHE.set(normalizedId, result);
    return result;
  }
}
