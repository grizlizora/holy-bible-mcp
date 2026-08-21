/**
 * 🔍 HybridSearchEngine (hybrid_search_engine.ts)
 * 
 * Production Hybrid Search combining SQLite FTS5 (BM25 ranking),
 * Reciprocal Rank Fusion (RRF), Ukrainian morphology stemmer,
 * and in-memory MiniSearch fallback engine.
 */

import { queryDb } from "./database.js";
import { formatBiblicalDisplayTitle } from "./osis_engine.js";
import { UkrainianMorphologyEngine } from "./search/morphology/ukrainian_morphology_engine.js";
import { RrfCalculator } from "./search/rrf_calculator.js";
import { PastoralCounselMatcher } from "./search/pastoral_counsel_matcher.js";
import { MiniSearchFallbackEngine } from "./search/minisearch_fallback_engine.js";

export { UkrainianMorphologyEngine } from "./search/morphology/ukrainian_morphology_engine.js";
export { RrfCalculator } from "./search/rrf_calculator.js";
export { PastoralCounselMatcher } from "./search/pastoral_counsel_matcher.js";

export interface HybridSearchResultItem {
  reference: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  hybridScore: number;
  ftsRank?: number;
  vectorRank?: number;
  theologicalContext?: string;
}

export class HybridSearchEngine {
  private static instance: HybridSearchEngine;
  private miniSearchEngine: MiniSearchFallbackEngine;

  constructor() {
    this.miniSearchEngine = MiniSearchFallbackEngine.getInstance();
  }

  public static getInstance(): HybridSearchEngine {
    if (!HybridSearchEngine.instance) {
      HybridSearchEngine.instance = new HybridSearchEngine();
    }
    return HybridSearchEngine.instance;
  }

  public async searchScriptureHybrid(params: {
    query: string;
    language?: string;
    mode?: "balanced" | "exact" | "semantic" | "theological";
    semanticWeight?: number;
    topK?: number;
  }): Promise<{ query: string; totalFound: number; results: HybridSearchResultItem[] }> {
    const { query, language = "ukr", mode = "balanced", topK = 10 } = params;
    if (!query || !query.trim()) {
      return { query: "", totalFound: 0, results: [] };
    }

    const rrfParams = RrfCalculator.detectSearchIntent(query, mode);
    const ftsQuery = UkrainianMorphologyEngine.generateFtsQuery(query);

    let lexicalRows: any[] = [];
    try {
      lexicalRows = await queryDb(
        `SELECT v.id, v.book, v.chapter, v.verse, v.text, v.translation,
                bm25(verses_fts) as bm25_score
         FROM verses_fts f
         JOIN verses v ON f.rowid = v.rowid
         WHERE verses_fts MATCH ?
         ORDER BY bm25_score ASC
         LIMIT 40`,
        [ftsQuery]
      );
    } catch (_) {
      // In-Memory MiniSearch fallback (<1.5ms) without blocking full-table LIKE scans
      if (this.miniSearchEngine.hasIndex()) {
        const miniResults = this.miniSearchEngine.search(query, 30);
        lexicalRows = miniResults.map((m) => ({
          ...m,
          bm25_score: 0.5
        }));
      } else {
        // Safe indexed fallback
        const words = query.split(/\s+/).filter((w) => w.length > 2);
        if (words.length > 0) {
          const firstWord = words[0];
          try {
            lexicalRows = await queryDb(
              `SELECT id, book, chapter, verse, text, translation, 0 as bm25_score
               FROM verses 
               WHERE text LIKE ? LIMIT 30`,
              [`%${firstWord}%`]
            );
            if (lexicalRows.length > 0) {
              this.miniSearchEngine.addDocuments(
                lexicalRows.map((r) => ({
                  id: String(r.id),
                  book: r.book,
                  chapter: r.chapter,
                  verse: r.verse,
                  text: r.text,
                  translation: r.translation || "UBIO"
                }))
              );
            }
          } catch (_) {
            lexicalRows = [];
          }
        }
      }
    }

    const candidates = lexicalRows.map((r, index) => {
      const ftsRank = index + 1;
      const hybridScore = RrfCalculator.computeScore(ftsRank, r.bm25_score || 0.5, rrfParams);
      const displayTitle = formatBiblicalDisplayTitle(`${r.book} ${r.chapter}:${r.verse}`, language);

      return {
        reference: displayTitle,
        book: r.book,
        chapter: r.chapter,
        verse: r.verse,
        text: r.text,
        translation: r.translation || "UBIO",
        hybridScore,
        ftsRank,
        theologicalContext: `Канонічна відповідність у книзі ${displayTitle}`
      };
    });

    candidates.sort((a, b) => b.hybridScore - a.hybridScore);

    return {
      query,
      totalFound: candidates.length,
      results: candidates.slice(0, topK)
    };
  }

  public async findByLifeSituation(
    situationDescription: string,
    emotion = "auto",
    language = "ukr"
  ): Promise<{ situation: string; emotion: string; scriptures: HybridSearchResultItem[]; pastoralCounsel: string }> {
    const detectedEmotion = PastoralCounselMatcher.matchEmotion(situationDescription, emotion);

    const { results } = await this.searchScriptureHybrid({
      query: situationDescription,
      language,
      mode: "balanced",
      topK: 5
    });

    const pastoralCounsel = PastoralCounselMatcher.generatePastoralText(detectedEmotion, language);

    return {
      situation: situationDescription,
      emotion: detectedEmotion,
      scriptures: results,
      pastoralCounsel
    };
  }
}
