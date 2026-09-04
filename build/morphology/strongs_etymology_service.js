/**
 * 🏛️ StrongsEtymologyService (strongs_etymology_service.ts)
 *
 * Retrieves Strong's Concordance, BDB/Thayer definitions, and Trench's Synonyms
 * from SQLite with bounded LRU caching.
 */
import { queryDb } from "../database.js";
import { DirectiveStore } from "../directives/directive_store.js";
export const COMMON_LEMMA_MAP = {
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
const STRONGS_ETYMOLOGY_CACHE = new Map();
const MAX_STRONGS_CACHE = 2000;
export const CANONICAL_STRONGS_OFFLINE = {
    "G0026": { lemma: "ἀγάπη", translit: "agape", pron: "ag-ah'-pay", def: "Love, benevolence, good will, esteem." },
    "G26": { lemma: "ἀγάπη", translit: "agape", pron: "ag-ah'-pay", def: "Love, benevolence, good will, esteem." },
    "G3056": { lemma: "λόγος", translit: "logos", pron: "log'-os", def: "Word, speech, divine expression, the Word." },
    "G4487": { lemma: "ῥῆμα", translit: "rhema", pron: "hray'-mah", def: "That which is spoken, an utterance." },
    "G2222": { lemma: "ζωή", translit: "zoe", pron: "dzo-ay'", def: "Life, both of physical vitality and spiritual divine life." },
    "G0225": { lemma: "ἀλήθεια", translit: "aletheia", pron: "al-ay'-thi-a", def: "Truth, verity, reality." },
    "H0430": { lemma: "אֱלֹהִים", translit: "elohim", pron: "el-o-heem'", def: "God, deities, divine majesty." },
    "H430": { lemma: "אֱלֹהִים", translit: "elohim", pron: "el-o-heem'", def: "God, deities, divine majesty." },
    "H1254": { lemma: "בָּרָא", translit: "bara", pron: "baw-raw'", def: "To create, shape, form (God's divine creation ex nihilo)." },
    "H7225": { lemma: "רֵאשִׁית", translit: "reshit", pron: "ray-sheeth'", def: "Beginning, chief, first-fruits." },
    "H7965": { lemma: "שָׁלוֹם", translit: "shalom", pron: "shaw-lome'", def: "Peace, wholeness, prosperity, safety." },
    "H2617": { lemma: "חֶסֶד", translit: "hesed", pron: "kheh'-sed", def: "Steadfast love, covenant kindness, mercy." },
    "H0571": { lemma: "אֱמֶת", translit: "emet", pron: "eh'-meth", def: "Truth, faithfulness, reliability." }
};
export class StrongsEtymologyService {
    static async getEtymology(strongsInput) {
        const rawClean = strongsInput.trim().toLowerCase();
        const resolvedFromAlias = COMMON_LEMMA_MAP[rawClean];
        const normalizedId = (resolvedFromAlias || strongsInput).trim().toUpperCase();
        if (STRONGS_ETYMOLOGY_CACHE.has(normalizedId)) {
            const cached = STRONGS_ETYMOLOGY_CACHE.get(normalizedId);
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
        let rows = await queryDb(`SELECT strongs_id, lemma, COALESCE(original_word, lemma) AS original_word, transliteration, pronunciation, definition 
       FROM strongs_dictionary 
       WHERE strongs_id IN (?, ?, ?) OR id IN (?, ?, ?) LIMIT 1`, [normalizedId, paddedKey, rawKey, normalizedId, paddedKey, rawKey]);
        if (!rows || rows.length === 0) {
            rows = await queryDb(`SELECT strongs_id, lemma, COALESCE(original_word, lemma) AS original_word, transliteration, pronunciation, definition 
         FROM strongs_dictionary 
         WHERE LOWER(lemma) = ? OR LOWER(original_word) = ? OR LOWER(transliteration) = ? LIMIT 1`, [rawClean, rawClean, rawClean]);
        }
        const hasDbRow = Boolean(rows && rows.length > 0);
        const row = rows[0] || {};
        const effectiveStrongsId = row.strongs_id ? String(row.strongs_id).toUpperCase() : paddedKey;
        const isGreekWord = effectiveStrongsId.startsWith('G') || isGreek;
        const isHebrewWord = effectiveStrongsId.startsWith('H') || isHebrew;
        const knownOffline = CANONICAL_STRONGS_OFFLINE[paddedKey] || CANONICAL_STRONGS_OFFLINE[normalizedId] || CANONICAL_STRONGS_OFFLINE[rawClean.toUpperCase()];
        const lemma = row.lemma || row.original_word || (knownOffline ? knownOffline.lemma : rawClean);
        const translit = row.transliteration || (knownOffline ? knownOffline.translit : rawClean);
        const pron = row.pronunciation || (knownOffline ? knownOffline.pron : '');
        const def = row.definition || (trench ? trench.distinction : (knownOffline ? knownOffline.def : 'Lexical definition not found in local Strong\'s dictionary.'));
        let sampleOccurrences = [
            { ref: isGreek ? 'JHN.3.16' : 'GEN.1.1', text: isGreek ? '«Так бо Бог полюбив [ἠγάπησεν] світ...»' : '«На початку створив [בָּרָא] Бог небо та землю...»' }
        ];
        // Attempt to query real verse occurrences for the lemma if available
        if (hasDbRow && row.lemma) {
            try {
                const occRows = await queryDb(`SELECT book, chapter, verse, text FROM verses WHERE text LIKE ? LIMIT 2`, [`%${row.lemma}%`]);
                if (occRows && occRows.length > 0) {
                    sampleOccurrences = occRows.map(r => ({
                        ref: `${r.book}.${r.chapter}.${r.verse}`,
                        text: r.text
                    }));
                }
            }
            catch (_) { }
        }
        const result = {
            strongsId: paddedKey,
            language: isGreek ? 'Koine Greek' : (isHebrew ? 'Biblical Hebrew' : 'Ancient Biblical Language'),
            lemma,
            transliteration: translit,
            pronunciation: pron,
            strongsDefinition: def,
            trenchSynonyms: trench,
            sampleOccurrences
        };
        if (STRONGS_ETYMOLOGY_CACHE.size >= MAX_STRONGS_CACHE) {
            const oldest = STRONGS_ETYMOLOGY_CACHE.keys().next().value;
            if (oldest)
                STRONGS_ETYMOLOGY_CACHE.delete(oldest);
        }
        STRONGS_ETYMOLOGY_CACHE.set(normalizedId, result);
        return result;
    }
}
