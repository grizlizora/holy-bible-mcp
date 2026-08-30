import { queryDb, isDbReady } from "../../database.js";
import { formatScriptureVerse } from "../../formatting.js";
import { resolveLanguageCode } from "../../services/language_resolver.js";
import { fetchOnlineKeywordSearch } from "../../services/online_bible_fallback.js";
import { HybridSearchEngine } from "../../hybrid_search_engine.js";
import { DirectiveStore } from "../../directives/directive_store.js";
import { z } from "zod";
import {
  SearchKeywordSchema,
  SearchSemanticSchema,
  SearchTopicSchema,
  SearchScriptureHybridSchema,
  FindScripturesByLifeSituationSchema
} from "../schemas/tool_schemas.js";

export async function handleSearchKeyword(args: z.infer<typeof SearchKeywordSchema>) {
  const rawKeyword = String(args?.keyword || args?.query || "").trim();
  const lang = String(args?.language || args?.lang || "ukr");
  const limit = typeof args?.limit === "number" ? args.limit : 10;
  const translation = args?.translation ? String(args.translation).trim() : undefined;
  const detectedLang = resolveLanguageCode(lang, rawKeyword);
  const tokens = rawKeyword
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const matchQuery = tokens.length > 0
    ? tokens.map(t => `${t}*`).join(" AND ")
    : "*";

  let rows: any[] = [];
  if (isDbReady()) {
    try {
      if (translation) {
        rows = await queryDb(
          `SELECT v.book, v.chapter, v.verse, v.text, v.language, v.translation 
           FROM verses_fts f 
           JOIN verses v ON f.rowid = v.rowid 
           WHERE verses_fts MATCH ? AND UPPER(v.translation) = UPPER(?) 
           LIMIT ?`,
          [matchQuery, translation, limit]
        );
      }
      if (!rows || rows.length === 0) {
        rows = await queryDb(
          `SELECT v.book, v.chapter, v.verse, v.text, v.language, v.translation 
           FROM verses_fts f 
           JOIN verses v ON f.rowid = v.rowid 
           WHERE verses_fts MATCH ? AND v.language = ? 
           LIMIT ?`,
          [matchQuery, detectedLang, limit]
        );
      }
      if (!rows || rows.length === 0) {
        rows = await queryDb(
          `SELECT v.book, v.chapter, v.verse, v.text, v.language, v.translation 
           FROM verses_fts f 
           JOIN verses v ON f.rowid = v.rowid 
           WHERE verses_fts MATCH ? 
           LIMIT ?`,
          [matchQuery, limit]
        );
      }
    } catch {
      rows = [];
    }
  }

  if (rows.length === 0) {
    rows = await fetchOnlineKeywordSearch(rawKeyword, detectedLang, limit);
  }

  const formattedText = rows.map((v: any) => {
    return formatScriptureVerse({ book: v.book, chapter: v.chapter, verse: v.verse, text: v.text, language: detectedLang }).formattedText;
  }).join("\n\n");

  return {
    content: [{ type: "text", text: formattedText || JSON.stringify(rows, null, 2) }]
  };
}


export async function handleSearchSemantic(args: z.infer<typeof SearchSemanticSchema>) {
  const concept = String(args?.concept || "").toLowerCase();
  let rows = await queryDb(
    `SELECT concept_name, book, chapter, verse, theological_principle FROM semantic_concepts WHERE LOWER(concept_name) LIKE ? OR LOWER(keywords) LIKE ? LIMIT 5`,
    [`%${concept}%`, `%${concept}%`]
  );

  if (!rows || rows.length === 0) {
    const storeConcepts = DirectiveStore.getInstance().theologyRepo.getSemanticConcepts(concept, 5);
    if (storeConcepts && storeConcepts.length > 0) {
      rows = storeConcepts.map(sc => ({
        concept_name: sc.concept_name,
        book: sc.book,
        chapter: sc.chapter,
        verse: sc.verse,
        theological_principle: sc.theological_principle
      }));
    }
  }

  return {
    content: [{ type: "text", text: JSON.stringify(rows, null, 2) }]
  };
}

export async function handleSearchTopic(args: z.infer<typeof SearchTopicSchema>) {
  const topic = String(args?.topic || "").toLowerCase();
  const limit = typeof args?.limit === "number" ? args.limit : 5;
  let rows = await queryDb(
    `SELECT concept_name, book, chapter, verse, theological_principle FROM semantic_concepts WHERE LOWER(concept_name) LIKE ? OR LOWER(keywords) LIKE ? LIMIT ?`,
    [`%${topic}%`, `%${topic}%`, limit]
  );

  if (!rows || rows.length === 0) {
    const storeConcepts = DirectiveStore.getInstance().theologyRepo.getSemanticConcepts(topic, limit);
    if (storeConcepts && storeConcepts.length > 0) {
      rows = storeConcepts.map(sc => ({
        concept_name: sc.concept_name,
        book: sc.book,
        chapter: sc.chapter,
        verse: sc.verse,
        theological_principle: sc.theological_principle
      }));
    }
  }

  return {
    content: [{ type: "text", text: JSON.stringify(rows, null, 2) }]
  };
}

export async function handleSearchScriptureHybrid(args: z.infer<typeof SearchScriptureHybridSchema>) {
  const query = String(args?.query || "");
  const language = String(args?.language || "ukr");
  const mode = (args?.mode as any) || "balanced";
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

export async function handleFindByLifeSituation(args: z.infer<typeof FindScripturesByLifeSituationSchema>) {
  const situation = String(args?.situation_description || "");
  const emotion = String(args?.emotion || "auto");
  const language = String(args?.language || "ukr");

  const result = await HybridSearchEngine.getInstance().findByLifeSituation(situation, emotion, language);
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
  };
}

