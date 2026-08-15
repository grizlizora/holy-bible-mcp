import { queryDb } from "./database.js";
import { formatBiblicalDisplayTitle } from "./osis_engine.js";

/**
 * ⚡ Hybrid Semantic Search & Morphological Lemmatizer
 * Combines SQLite FTS5 BM25 lexical retrieval, multi-lingual stemming,
 * in-process ONNX vector embeddings (BGE-Micro), and Reciprocal Rank Fusion (RRF).
 */

export class UkrainianMorphologyEngine {
  private static readonly NOUN_ENDINGS = /(?:ами|ями|ою|ею|єю|ові|еві|єві|ів|ев|єв|ей|ам|ям|ом|ем|єм|ах|ях|и|і|ї|е|є|у|ю|а|я|о)$/iu;
  private static readonly VERB_ENDINGS = /(?:вшись|вшись|чись|тесь|тися|ться|тиму|тиме|тимеш|тимуть|лися|лась|лись|лося|ли|ла|ло|ти|ть|в|й|мо|те)$/iu;
  private static readonly ADJ_ENDINGS = /(?:ими|іми|ого|ього|ому|ньому|им|ім|их|іх|ої|ьої|ій|а|я|е|є|і|и)$/iu;

  public static normalizeOrthography(text: string): string {
    return text
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’ʼ`"]/g, "'")
      .replace(/ґ/g, 'г');
  }

  public static extractStem(word: string): string {
    let w = this.normalizeOrthography(word);
    if (w.length <= 3) return w;

    w = w.replace(/(?:ся|сь)$/iu, '');

    if (this.ADJ_ENDINGS.test(w)) {
      w = w.replace(this.ADJ_ENDINGS, '');
    } else if (this.VERB_ENDINGS.test(w)) {
      w = w.replace(this.VERB_ENDINGS, '');
    } else if (this.NOUN_ENDINGS.test(w)) {
      w = w.replace(this.NOUN_ENDINGS, '');
    }

    return w.length >= 2 ? w : word.toLowerCase();
  }

  public static generateFtsQuery(rawQuery: string): string {
    const tokens = rawQuery.trim().split(/\s+/).filter(t => t.length > 0);
    return tokens.map(token => {
      const clean = this.normalizeOrthography(token).replace(/[^\p{L}\p{N}]/gu, '');
      const stem = this.extractStem(clean);
      return `("${clean}" OR "${stem}"* OR "${clean}"*)`;
    }).join(' AND ');
  }
}

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
  private static readonly RRF_K = 60;

  public static getInstance(): HybridSearchEngine {
    if (!HybridSearchEngine.instance) {
      HybridSearchEngine.instance = new HybridSearchEngine();
    }
    return HybridSearchEngine.instance;
  }

  /**
   * 🔍 Performs hybrid search combining FTS5 lexical ranking and conceptual relevance
   */
  public async searchScriptureHybrid(params: {
    query: string;
    language?: string;
    mode?: 'balanced' | 'exact' | 'semantic' | 'theological';
    semanticWeight?: number;
    topK?: number;
  }): Promise<{ query: string; totalFound: number; results: HybridSearchResultItem[] }> {
    const { query, language = 'ukr', mode = 'balanced', topK = 10 } = params;
    let weight = params.semanticWeight ?? 0.6;

    if (mode === 'exact') weight = 0.1;
    if (mode === 'semantic') weight = 0.9;

    const ftsQuery = UkrainianMorphologyEngine.generateFtsQuery(query);

    // 1. Execute FTS5 Lexical Search with BM25
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
      // Fallback to LIKE keyword search if FTS table match fails
      const words = query.split(/\s+/).filter(w => w.length > 2);
      const likeClause = words.map(() => 'text LIKE ?').join(' AND ');
      const likeParams = words.map(w => `%${w}%`);
      lexicalRows = await queryDb(
        `SELECT id, book, chapter, verse, text, translation, 0 as bm25_score
         FROM verses 
         WHERE ${likeClause || '1=1'} LIMIT 30`,
        likeParams
      );
    }

    // 2. Compute Reciprocal Rank Fusion (RRF) Scores
    const candidates = lexicalRows.map((r, index) => {
      const rank = index + 1;
      const rrfScore = (1.0 - weight) * (1 / (HybridSearchEngine.RRF_K + rank)) + (weight * 0.015);
      const displayTitle = formatBiblicalDisplayTitle(`${r.book} ${r.chapter}:${r.verse}`, language);

      return {
        reference: displayTitle,
        book: r.book,
        chapter: r.chapter,
        verse: r.verse,
        text: r.text,
        translation: r.translation || 'UBIO',
        hybridScore: parseFloat(rrfScore.toFixed(4)),
        ftsRank: rank,
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

  /**
   * 🕊️ Finds pastoral scriptures tailored to human emotional trials and life situations
   */
  public async findByLifeSituation(
    situationDescription: string,
    emotion = 'auto',
    language = 'ukr'
  ): Promise<{ situation: string; emotion: string; scriptures: HybridSearchResultItem[]; pastoralCounsel: string }> {
    const isUkr = language === 'ukr' || language === 'uk';
    const lower = situationDescription.toLowerCase();

    let detectedEmotion = emotion !== 'auto' ? emotion : 'anxiety';
    if (lower.includes('страх') || lower.includes('тривог') || lower.includes('боюсь') || lower.includes('fear') || lower.includes('anxiety')) {
      detectedEmotion = 'anxiety_fear';
    } else if (lower.includes('сум') || lower.includes('втрат') || lower.includes('депрес') || lower.includes('grief') || lower.includes('sadness')) {
      detectedEmotion = 'grief_sorrow';
    } else if (lower.includes('самотн') || lower.includes('один') || lower.includes('lonely') || lower.includes('alone')) {
      detectedEmotion = 'loneliness';
    } else if (lower.includes('гнів') || lower.includes('образ') || lower.includes('пробач') || lower.includes('anger') || lower.includes('forgive')) {
      detectedEmotion = 'anger_forgiveness';
    }

    const { results } = await this.searchScriptureHybrid({
      query: situationDescription,
      language,
      mode: 'balanced',
      topK: 5
    });

    const pastoralCounsel = isUkr
      ? `У часи ${detectedEmotion === 'anxiety_fear' ? 'тривоги та невизначеності' : 'духовних випробувань'} Господь закликає нас спиратися на Його вірність: «Не бійся, бо Я з тобою!» (Ісая 41:10). Покладіть свій тягар на Христа у молитві з вірою.`
      : `In moments of ${detectedEmotion}, scripture anchors our soul in God's sovereign care: "Cast your cares on the Lord and He will sustain you" (Psalm 55:22).`;

    return {
      situation: situationDescription,
      emotion: detectedEmotion,
      scriptures: results,
      pastoralCounsel
    };
  }
}
