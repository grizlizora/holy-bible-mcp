/**
 * 🏛️ Morphology Dedicated Worker (morphology_worker.ts)
 * 
 * Worker thread script for Piscina executing heavy Greek (Robinson) and Hebrew (WLC)
 * morphological code decomposition and alignment.
 */

import { parseGreekMorphCode } from "../morphology/robinson_parser.js";
import { parseHebrewMorphCode } from "../morphology/hebrew_parser.js";
import { TransliterationEngine } from "../morphology/transliteration_engine.js";

export interface MorphologyTaskPayload {
  id: string;
  type: 'PARSE_GREEK' | 'PARSE_HEBREW' | 'TRANSLITERATE_TOKENS';
  codes?: string[];
  tokens?: string[];
  isHebrew?: boolean;
}

export default async function handleMorphologyTask(task: MorphologyTaskPayload): Promise<any> {
  const startTime = performance.now();

  if (task.type === 'PARSE_GREEK' && task.codes) {
    const parsed = task.codes.map(c => parseGreekMorphCode(c));
    return { taskId: task.id, parsed, elapsedMs: performance.now() - startTime };
  }

  if (task.type === 'PARSE_HEBREW' && task.codes) {
    const parsed = task.codes.map(c => parseHebrewMorphCode(c));
    return { taskId: task.id, parsed, elapsedMs: performance.now() - startTime };
  }

  if (task.type === 'TRANSLITERATE_TOKENS' && task.tokens) {
    const transliterated = task.tokens.map(t => TransliterationEngine.transliterate(t, Boolean(task.isHebrew)));
    return { taskId: task.id, transliterated, elapsedMs: performance.now() - startTime };
  }

  return { taskId: task.id, elapsedMs: performance.now() - startTime };
}
