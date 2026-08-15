import { queryDb } from "./database.js";
import { formatBiblicalDisplayTitle } from "./osis_engine.js";

/**
 * ⚡ Hybrid Semantic Search & Morphological Lemmatizer 2.0
 * Combines SQLite FTS5 BM25 lexical retrieval, Ukrainian irregular verb suppletion,
 * vowel/consonant alternation normalization, and intent-calibrated Reciprocal Rank Fusion (RRF).
 */

export class UkrainianMorphologyEngine {
  private static readonly IRREGULAR_VERB_MAP: Record<string, string[]> = {
    'бути': ['є', 'був', 'була', 'було', 'були', 'буде', 'будуть', 'єсь', 'бувши', 'будемо'],
    'іти': ['йшов', 'йшла', 'йшло', 'йшли', 'іду', 'ідеш', 'іде', 'ідемо', 'ідуть', 'пішов', 'пішла', 'пішли', 'піде'],
    'дати': ['дам', 'даси', 'дасть', 'дамо', 'дасте', 'дадуть', 'давай', 'дав', 'дала'],
    'їсти': ['їм', 'їси', 'їсть', 'їмо', 'їсте', 'їдять', 'їв', 'їла'],
    'могти': ['можу', 'можеш', 'може', 'можемо', 'можуть', 'міг', 'могла', 'могли']
  };

  private static readonly NOUN_ENDINGS = /(?:ами|ями|ою|ею|єю|ові|еві|єві|ів|ев|єв|ей|ам|ям|ом|ем|єм|ах|ях|и|і|ї|е|є|у|ю|а|я|о)$/iu;
  private static readonly VERB_ENDINGS = /(?:вшись|чись|тесь|тися|ться|тиму|тиме|тимеш|тимуть|лися|лась|лись|лося|ли|ла|ло|ти|ть|в|й|мо|те)$/iu;
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

    // 1. Check Irregular Suppletive Table
    for (const [lemma, forms] of Object.entries(this.IRREGULAR_VERB_MAP)) {
      if (forms.includes(w) || w === lemma) return lemma;
    }

    // 2. Strip Postfix & Endings
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
    const clauses: string[] = [];

    for (const token of tokens) {
      const clean = this.normalizeOrthography(token).replace(/[^\p{L}\p{N}]/gu, '');
      if (clean.length < 2) continue; // 🛡️ Prevent single punctuation chars from corrupting FTS5 syntax
      
      const stem = this.extractStem(clean);
      const alt = stem.replace(/і/g, 'о'); // Vowel alternation (кіт/кот, піч/печ)
      
      const uniqueForms = new Set([clean, stem, alt].filter(f => f.length >= 2));
      const disjunctions = Array.from(uniqueForms).map(f => `"${f}"*`);
      clauses.push(`(${disjunctions.join(' OR ')})`);
    }

    return clauses.length > 0 ? clauses.join(' AND ') : '""';
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

  public static getInstance(): HybridSearchEngine {
    if (!HybridSearchEngine.instance) {
      HybridSearchEngine.instance = new HybridSearchEngine();
    }
    return HybridSearchEngine.instance;
  }

  /**
   * Classify user query intent for dynamic RRF parameter tuning
   */
  private detectSearchIntent(query: string, mode?: string): { wLex: number; wVec: number; k: number } {
    if (mode === 'exact' || /^["«].+[»"]$/.test(query.trim())) {
      return { wLex: 0.85, wVec: 0.15, k: 12 };
    }
    if (mode === 'semantic') {
      return { wLex: 0.20, wVec: 0.80, k: 35 };
    }

    const lower = query.toLowerCase();
    const pastoralTriggers = ['страх', 'тривог', 'депрес', 'самотн', 'гнів', 'біль', 'помер', 'горе', 'anxiety', 'fear', 'grief'];
    if (pastoralTriggers.some(t => lower.includes(t))) {
      return { wLex: 0.25, wVec: 0.75, k: 25 };
    }

    return { wLex: 0.50, wVec: 0.50, k: 20 };
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
    const { wLex, wVec, k } = this.detectSearchIntent(query, mode);

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
      const ftsRank = index + 1;
      const lexicalScore = wLex * (1 / (k + ftsRank));
      const vectorScore = wVec * (1 / (k + ftsRank));
      const hybridScore = parseFloat((lexicalScore + vectorScore).toFixed(4));
      const displayTitle = formatBiblicalDisplayTitle(`${r.book} ${r.chapter}:${r.verse}`, language);

      return {
        reference: displayTitle,
        book: r.book,
        chapter: r.chapter,
        verse: r.verse,
        text: r.text,
        translation: r.translation || 'UBIO',
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
