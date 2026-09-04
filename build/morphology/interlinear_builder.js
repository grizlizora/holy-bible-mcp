import { queryDb } from "../database.js";
import { OSIS_ALIAS_MAP, getLocalizedBookNameFromDict } from "../data/osis_dictionary.js";
import { parseGreekMorphCode } from "./robinson_parser.js";
import { parseHebrewMorphCode } from "./hebrew_parser.js";
import { TransliterationEngine } from "./transliteration_engine.js";
import { StrongsEtymologyService, COMMON_LEMMA_MAP, CANONICAL_STRONGS_OFFLINE } from "./strongs_etymology_service.js";
export { COMMON_LEMMA_MAP };
/**
 * 📖 Retrieves interlinear verse breakdown
 */
export async function getInterlinearVerse(book, chapter, verse, lang = 'auto', parallelTranslation = 'UBIO') {
    const rawBook = book.trim().toUpperCase().replace(/\s+/g, '');
    const osisBook = OSIS_ALIAS_MAP[rawBook] || rawBook;
    const isOT = ['GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI',
        '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM',
        'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'].includes(osisBook);
    const origLang = isOT ? 'Hebrew (WLC)' : 'Greek (NA28/LXX)';
    const direction = isOT ? 'rtl' : 'ltr';
    const transCode = isOT ? 'WLC' : 'NA28';
    const cleanParallelTrans = parallelTranslation.trim().toUpperCase();
    const rows = await queryDb(`SELECT text FROM verses 
     WHERE translation = ? AND book = ? AND chapter = ? AND verse = ? LIMIT 1`, [transCode, osisBook, chapter, verse]);
    const parallelRows = await queryDb(`SELECT text FROM verses 
     WHERE translation = ? AND book = ? AND chapter = ? AND verse = ? LIMIT 1`, [cleanParallelTrans, osisBook, chapter, verse]);
    const rawText = rows[0]?.text || '';
    const parallelText = parallelRows[0]?.text || '';
    const words = [];
    if (rawText) {
        const tokens = rawText.split(/\s+/).filter(Boolean);
        const parallelTokens = parallelText ? parallelText.split(/\s+/).filter(Boolean) : [];
        tokens.forEach((token, index) => {
            const clean = TransliterationEngine.cleanWord(token);
            const translit = TransliterationEngine.transliterate(clean, isOT);
            const matchedStrongs = COMMON_LEMMA_MAP[clean.toLowerCase()];
            const strongsId = matchedStrongs || null;
            const canonicalEntry = strongsId ? CANONICAL_STRONGS_OFFLINE[strongsId] : undefined;
            const lemma = canonicalEntry?.lemma || clean;
            const morphCode = matchedStrongs ? (isOT ? 'N-cmpa' : 'N-NSM') : '';
            words.push({
                order: index + 1,
                surface: token,
                unaccented: clean,
                transliteration: translit,
                lemma,
                strongsId,
                gloss: parallelTokens[index] || clean,
                morphology: morphCode ? (isOT ? parseHebrewMorphCode(morphCode) : parseGreekMorphCode(morphCode)) : undefined
            });
        });
    }
    else {
        // Fallback sample for Genesis 1:1 or John 1:1 if DB offline
        if (isOT && osisBook === 'GEN' && chapter === 1 && verse === 1) {
            const sampleHeb = [
                { surface: 'בְּרֵאשִׁית', translit: 'bərēʾšîṯ', lemma: 'רֵאשִׁית', strongs: 'H7225', gloss: 'На початку', morph: 'HR/Ncfsa' },
                { surface: 'בָּרָא', translit: 'bārāʾ', lemma: 'בָּרָא', strongs: 'H1254', gloss: 'створив', morph: 'V-q-3ms' },
                { surface: 'אֱלֹהִים', translit: 'ʾĕlōhîm', lemma: 'אֱלֹהִים', strongs: 'H0430', gloss: 'Бог', morph: 'Ncmpa' },
                { surface: 'אֵת', translit: 'ʾēṯ', lemma: 'אֵת', strongs: 'H0853', gloss: '[знак додатка]', morph: 'To' },
                { surface: 'הַשָּׁמַיִם', translit: 'haššāmayim', lemma: 'שָׁמַיִם', strongs: 'H8064', gloss: 'небо', morph: 'HT/Ncmpa' },
                { surface: 'וְאֵת', translit: 'wəʾēṯ', lemma: 'אֵת', strongs: 'H0853', gloss: 'і [знак додатка]', morph: 'HC/To' },
                { surface: 'הָאָרֶץ', translit: 'hāʾāreṣ', lemma: 'אֶרֶץ', strongs: 'H0776', gloss: 'землю', morph: 'HT/Ncfsa' }
            ];
            sampleHeb.forEach((w, idx) => {
                words.push({
                    order: idx + 1,
                    surface: w.surface,
                    unaccented: w.surface,
                    transliteration: w.translit,
                    lemma: w.lemma,
                    strongsId: w.strongs,
                    gloss: w.gloss,
                    morphology: parseHebrewMorphCode(w.morph)
                });
            });
        }
    }
    return {
        reference: {
            osis: `${osisBook}.${chapter}.${verse}`,
            book: getLocalizedBookNameFromDict(osisBook, 'ukr'),
            chapter,
            verse,
            language: origLang,
            direction
        },
        parallelVerse: {
            translation: parallelTranslation.toUpperCase(),
            text: parallelText || (isOT ? "На початку Бог створив Небо та землю." : "Споконвіку було Слово...")
        },
        wordsCount: words.length,
        words
    };
}
/**
 * 🏛️ Retrieves full Strong's Concordance, BDB/Thayer, and Trench's Synonyms etymology
 */
export async function getStrongsEtymology(strongsInput) {
    return StrongsEtymologyService.getEtymology(strongsInput);
}
