import { queryDb, isDbReady } from "../../database.js";
import { formatScriptureVerse } from "../../formatting.js";
import { resolveLanguageCode } from "../../services/language_resolver.js";
import { fetchOnlineKeywordSearch } from "../../services/online_bible_fallback.js";
import { HybridSearchEngine } from "../../hybrid_search_engine.js";
export async function handleSearchKeyword(args) {
    if (!isDbReady()) {
        return {
            content: [{ type: "text", text: "" }]
        };
    }
    const rawKeyword = String(args?.keyword || "").trim();
    const lang = String(args?.language || "ukr");
    const limit = typeof args?.limit === "number" ? args.limit : 10;
    const detectedLang = resolveLanguageCode(lang, rawKeyword);
    const cleanKey = rawKeyword.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    const matchQuery = `${cleanKey}*`;
    let rows = [];
    try {
        rows = await queryDb(`SELECT v.book, v.chapter, v.verse, v.text, v.language 
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
    }
    catch {
        rows = [];
    }
    if (rows.length === 0) {
        rows = await fetchOnlineKeywordSearch(rawKeyword, detectedLang, limit);
    }
    const formattedText = rows.map((v) => {
        return formatScriptureVerse({ book: v.book, chapter: v.chapter, verse: v.verse, text: v.text, language: detectedLang }).formattedText;
    }).join("\n\n");
    return {
        content: [{ type: "text", text: formattedText || JSON.stringify(rows, null, 2) }]
    };
}
export async function handleSearchSemantic(args) {
    const concept = String(args?.concept || "").toLowerCase();
    const rows = await queryDb(`SELECT concept_name, book, chapter, verse, theological_principle FROM semantic_concepts WHERE LOWER(concept_name) LIKE ? OR LOWER(keywords) LIKE ? LIMIT 5`, [`%${concept}%`, `%${concept}%`]);
    return {
        content: [{ type: "text", text: JSON.stringify(rows, null, 2) }]
    };
}
export async function handleSearchTopic(args) {
    const topic = String(args?.topic || "").toLowerCase();
    const limit = typeof args?.limit === "number" ? args.limit : 5;
    const rows = await queryDb(`SELECT concept_name, book, chapter, verse, theological_principle FROM semantic_concepts WHERE LOWER(concept_name) LIKE ? OR LOWER(keywords) LIKE ? LIMIT ?`, [`%${topic}%`, `%${topic}%`, limit]);
    return {
        content: [{ type: "text", text: JSON.stringify(rows, null, 2) }]
    };
}
export async function handleSearchScriptureHybrid(args) {
    const query = String(args?.query || "");
    const language = String(args?.language || "ukr");
    const mode = args?.mode || "balanced";
    const topK = typeof args?.top_k === "number" ? args.top_k : 10;
    const result = await HybridSearchEngine.getInstance().searchScriptureHybrid({
        query,
        language,
        mode,
        topK
    });
    return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
}
export async function handleFindByLifeSituation(args) {
    const situation = String(args?.situation_description || "");
    const emotion = String(args?.emotion || "auto");
    const language = String(args?.language || "ukr");
    const result = await HybridSearchEngine.getInstance().findByLifeSituation(situation, emotion, language);
    return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
}
