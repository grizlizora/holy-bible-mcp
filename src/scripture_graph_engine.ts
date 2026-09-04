import { queryDb } from "./database.js";
import { OSIS_ALIAS_MAP } from "./data/osis_dictionary.js";
import { formatBiblicalDisplayTitle } from "./osis_engine.js";
import { TheologicalKnowledgeGraph } from "./graph/theological_graphology_engine.js";
import { ThematicChainTracer, ThematicChainNode } from "./graph/thematic_chain_tracer.js";
import { ProphecyFulfillmentMatcher, type ProphecyFulfillmentPair } from "./graph/prophecy_fulfillment_matcher.js";
import { DirectiveStore } from "./directives/directive_store.js";

export type CrossReferenceCategory = 
  | 'messianic_prophecy'
  | 'typology_antitype'
  | 'parallel_account'
  | 'direct_quotation'
  | 'doctrinal_corroboration'
  | 'allusion_thematic'
  | 'general';

export interface RankedCrossReference {
  targetOsis: string;
  targetDisplayTitle: string;
  targetText: string;
  category: CrossReferenceCategory;
  categoryLabel: string;
  compositeScore: number;
  theologicalSignificance?: string;
}

export type { ThematicChainNode, ProphecyFulfillmentPair };

/**
 * 🔗 Biblical Cross-References Graph Engine (344,000+ TSK Links)
 * Traverses prophecy fulfillments, typology, doctrinal corroboration,
 * and synoptic parallels with multi-signal PageRank and in-memory Graphology traversal.
 */
export class ScriptureGraphEngine {
  private static instance: ScriptureGraphEngine;
  private graphologyEngine: TheologicalKnowledgeGraph;

  constructor() {
    this.graphologyEngine = TheologicalKnowledgeGraph.getInstance();
  }

  public static getInstance(): ScriptureGraphEngine {
    if (!ScriptureGraphEngine.instance) {
      ScriptureGraphEngine.instance = new ScriptureGraphEngine();
    }
    return ScriptureGraphEngine.instance;
  }

  /**
   * ⚡ Resolves top-ranked cross references with in-memory Graphology O(1) traversal
   */
  public async getRankedCrossReferences(
    book: string,
    chapter: number,
    verse: number,
    category = 'all',
    maxResults = 5,
    lang = 'ukr'
  ): Promise<{ sourceOsis: string; sourceTitle: string; results: RankedCrossReference[] }> {
    const rawBook = book.trim().toUpperCase().replace(/\s+/g, '');
    const osisBook = OSIS_ALIAS_MAP[rawBook] || rawBook;
    const sourceOsis = `${osisBook}.${chapter}.${verse}`;
    const sourceTitle = formatBiblicalDisplayTitle(`${osisBook} ${chapter}:${verse}`, lang);

    const candidates: RankedCrossReference[] = [];
    const seenRefs = new Set<string>();

    // 1. In-Memory Graphology traversal O(1)
    const graphNeighbors = this.graphologyEngine.getNeighbors(sourceOsis, category, maxResults);
    
    // Batch query scripture text in parallel for all unique neighbors (eliminates N+1 sequential loop)
    const neighborTexts = new Map<string, string>();
    await Promise.all(
      graphNeighbors.map(async (neighbor) => {
        const parts = neighbor.targetOsis.split(".");
        if (parts.length >= 3) {
          const key = `${parts[0]}.${parts[1]}.${parts[2]}`;
          try {
            const rows = await queryDb(
              `SELECT text FROM verses WHERE book = ? AND chapter = ? AND verse = ? LIMIT 1`,
              [parts[0], Number(parts[1]), Number(parts[2])]
            );
            if (rows[0]?.text) {
              neighborTexts.set(key, rows[0].text);
            }
          } catch (_) {}
        }
      })
    );

    for (const neighbor of graphNeighbors) {
      if (seenRefs.has(neighbor.targetOsis)) continue;
      seenRefs.add(neighbor.targetOsis);

      const text = neighborTexts.get(neighbor.targetOsis) || `[Scripture text for ${neighbor.targetOsis}]`;

      candidates.push({
        targetOsis: neighbor.targetOsis,
        targetDisplayTitle: formatBiblicalDisplayTitle(neighbor.targetOsis, lang),
        targetText: text,
        category: neighbor.category as CrossReferenceCategory,
        categoryLabel: neighbor.categoryLabel,
        compositeScore: neighbor.weight,
        theologicalSignificance: neighbor.theologicalSignificance
      });
    }

    // 2. Check direct prophecy pairs from ProphecyFulfillmentMatcher
    if (candidates.length < maxResults) {
      const matched = ProphecyFulfillmentMatcher.findMatchForOsis(sourceOsis, lang);
      if (matched && !seenRefs.has(matched.targetOsis)) {
        seenRefs.add(matched.targetOsis);
        candidates.push(matched as RankedCrossReference);
      }
    }

    // 3. Fallback to DirectiveStore Semantic Concepts (correct repository lookup)
    if (candidates.length < maxResults) {
      try {
        const store = DirectiveStore.getInstance();
        const concepts = store.theologyRepo.getSemanticConcepts(osisBook, maxResults);
        for (const r of concepts) {
          if (candidates.length >= maxResults) break;
          const targetOsis = `${r.book}.${r.chapter}.${r.verse}`;
          if (targetOsis === sourceOsis || seenRefs.has(targetOsis)) continue;
          seenRefs.add(targetOsis);

          let text = `[Scripture text for ${targetOsis}]`;
          try {
            const targetVerseRows = await queryDb(
              `SELECT text FROM verses WHERE book = ? AND chapter = ? AND verse = ? LIMIT 1`,
              [r.book, r.chapter, r.verse]
            );
            if (targetVerseRows[0]?.text) {
              text = targetVerseRows[0].text;
            }
          } catch (_) {}

          candidates.push({
            targetOsis,
            targetDisplayTitle: formatBiblicalDisplayTitle(`${r.book} ${r.chapter}:${r.verse}`, lang),
            targetText: text,
            category: 'doctrinal_corroboration',
            categoryLabel: lang === 'ukr' ? '⚓ Доктринальна єдність' : '⚓ Doctrinal Unity',
            compositeScore: 0.85,
            theologicalSignificance: r.theological_principle || `Тематичний зв'язок з темою ${r.concept_name}`
          });
        }
      } catch (_) {}
    }

    // 4. Default guaranteed theological anchor
    if (candidates.length === 0) {
      candidates.push({
        targetOsis: "JHN.3.16",
        targetDisplayTitle: "Івана 3:16",
        targetText: "«Так бо Бог полюбив світ, що дав Сина Свого Однородженого...»",
        category: "doctrinal_corroboration",
        categoryLabel: lang === 'ukr' ? '⚓ Доктринальна єдність' : '⚓ Doctrinal Unity',
        compositeScore: 0.95,
        theologicalSignificance: "Центральний євангельський вірш про Божу благодать та вічне життя."
      });
    }

    return {
      sourceOsis,
      sourceTitle,
      results: candidates.slice(0, maxResults)
    };
  }

  /**
   * 🔗 Traces progressive revelation covenant chain across Old and New Testaments
   */
  public static async findThematicChain(theme = "living_water", startingVerse = "GEN.3.15"): Promise<ThematicChainNode[]> {
    return ThematicChainTracer.traceChain(theme, startingVerse);
  }
}
