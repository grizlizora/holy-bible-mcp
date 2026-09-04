import { queryDb } from "../../../database.js";
import { fetchOnlineKeywordSearch } from "../../../services/online_bible_fallback.js";
import { DirectiveStore } from "../../../directives/directive_store.js";
export class VerseContextRetriever {
    static async retrieveVerses(keywords, detectedLang, limit = 6) {
        const verses = [];
        // 1. Fast FTS5 Parallel Queries for all keywords
        for (const kw of keywords) {
            const cleanKw = kw.replace(/[^\p{L}\p{N}]/gu, ' ').trim();
            if (!cleanKw)
                continue;
            const matchQuery = `"${cleanKw.replace(/"/g, '""')}"*`;
            try {
                let rows = await queryDb(`SELECT v.book, v.chapter, v.verse, v.text, v.language 
           FROM verses_fts f 
           JOIN verses v ON f.rowid = v.rowid 
           WHERE verses_fts MATCH ? AND v.language = ? 
           LIMIT ?`, [matchQuery, detectedLang, limit]);
                if (!rows || rows.length === 0) {
                    rows = await queryDb(`SELECT v.book, v.chapter, v.verse, v.text, v.language 
             FROM verses_fts f 
             JOIN verses v ON f.rowid = v.rowid 
             WHERE verses_fts MATCH ? 
             LIMIT ?`, [matchQuery, limit]);
                }
                if (rows && rows.length > 0) {
                    for (const r of rows) {
                        if (!verses.some(v => v.book === r.book && v.chapter === r.chapter && v.verse === r.verse)) {
                            verses.push(r);
                        }
                    }
                    if (verses.length >= limit)
                        break;
                }
            }
            catch {
                // Fallback gracefully on query syntax error
            }
        }
        // 2. Semantic Concept Fallback (from SQLite / DirectiveStore)
        if (verses.length === 0 && keywords.length > 0) {
            try {
                const store = DirectiveStore.getInstance();
                for (const kw of keywords) {
                    const concepts = store.theologyRepo.getSemanticConcepts(kw, limit);
                    for (const c of concepts) {
                        try {
                            const row = await queryDb(`SELECT book, chapter, verse, text, language FROM verses WHERE UPPER(book) = ? AND chapter = ? AND verse = ? AND language = ? LIMIT 1`, [c.book.toUpperCase(), c.chapter, c.verse, detectedLang]);
                            if (row && row.length > 0) {
                                if (!verses.some(v => v.book === row[0].book && v.chapter === row[0].chapter && v.verse === row[0].verse)) {
                                    verses.push(row[0]);
                                }
                            }
                            else if (c.theological_principle) {
                                verses.push({
                                    book: c.book,
                                    chapter: c.chapter,
                                    verse: c.verse,
                                    text: c.theological_principle,
                                    language: detectedLang
                                });
                            }
                        }
                        catch { }
                        if (verses.length >= limit)
                            break;
                    }
                    if (verses.length >= limit)
                        break;
                }
            }
            catch { }
        }
        // 3. Online Fallback if local SQLite returned 0 verses (Parallelized Fast-Fail)
        if (verses.length === 0 && keywords.length > 0) {
            const targetKeywords = keywords.slice(0, 3);
            const onlinePromises = targetKeywords.map(kw => fetchOnlineKeywordSearch(kw, detectedLang, limit));
            const results = await Promise.allSettled(onlinePromises);
            for (const res of results) {
                if (res.status === "fulfilled" && Array.isArray(res.value)) {
                    for (const r of res.value) {
                        if (!verses.some(v => v.book === r.book && v.chapter === r.chapter && v.verse === r.verse)) {
                            verses.push({
                                book: r.book,
                                chapter: r.chapter,
                                verse: r.verse,
                                text: r.text,
                                language: detectedLang
                            });
                        }
                    }
                    if (verses.length >= limit)
                        break;
                }
            }
        }
        return verses;
    }
}
