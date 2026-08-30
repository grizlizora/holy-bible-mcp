/**
 * 🎛️ AdaptiveBudgetEngine (adaptive_budget_engine.ts)
 * 
 * Computes calibrated sampling hyperparameters and context budgets based on
 * prompt complexity, parameter size, and model family.
 */

import { LLMFamily, ModelTier, PromptComplexityResult, AdaptiveBudget } from './types.js';
import { extractModelParamSizeB } from './model_param_extractor.js';
import { resolveModelTier } from './model_tier_matrix.js';

export function isSmallModelByParamSize(modelName: string, details?: any): boolean {
  const sizeB = extractModelParamSizeB(modelName, details);
  if (sizeB !== null) {
    return sizeB <= 12.5;
  }
  const name = (modelName || '').toLowerCase();
  return (
    name.includes('0.5b') ||
    name.includes('1.5b') ||
    name.includes('2b') ||
    name.includes('3b') ||
    name.includes('3.8b') ||
    name.includes('4b') ||
    name.includes('7b') ||
    name.includes('8b') ||
    name.includes('mini') ||
    name.includes('nano')
  );
}

export function detectModelFamily(modelName: string, details?: any): LLMFamily {
  const name = (modelName || '').toLowerCase();
  const familyStr = (details?.family || '').toLowerCase();
  if (name.includes('qwen') || familyStr.includes('qwen')) return 'qwen';
  if (name.includes('phi') || familyStr.includes('phi')) return 'phi';
  if (name.includes('llama') || familyStr.includes('llama')) return 'llama';
  if (name.includes('deepseek') || familyStr.includes('deepseek')) return 'deepseek';
  if (name.includes('gemma') || familyStr.includes('gemma')) return 'gemma';
  return 'generic';
}

/**
 * 🧠 Universal Language-Agnostic Prompt Complexity Estimator
 */
export function estimatePromptComplexity(text: string): PromptComplexityResult {
  if (!text || !text.trim()) {
    return { score: 50, level: 'moderate', multiplier: 1.0, reason: 'Empty query' };
  }

  const clean = text.trim();
  const lower = clean.toLowerCase();
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Trivial single-phrase greeting / acknowledgement
  const isTrivial = /^(?:привіт|добрий\s*день|доброго\s*дня|дякую|спасибі|ок|hello|hi|thanks|ok|hola|gracias|hallo|danke|bonjour|merci|привет|спасибо)$/i.test(lower) || (wordCount <= 2 && clean.length < 12 && !clean.includes('?'));
  if (isTrivial) {
    const score = Math.max(15, Math.min(25, 15 + wordCount * 3));
    return { score, level: 'simple', multiplier: 0.7, reason: 'Short greeting or acknowledgement' };
  }

  // 2. Explicit scripture verses list request
  const isVersesOnly = /(?:дай|покажи|знайди|список|наведи|текст|цитати)\s+(?:вірш[івіам]?|цитат[иа]?|писанн?я|біблійн[их|і])/i.test(lower) ||
    /(?:verses\s+only|only\s+verses|list\s+of\s+verses|show\s+verses|find\s+verses|scriptures\s+on)/i.test(lower);
  if (isVersesOnly) {
    const score = Math.max(25, Math.min(34, 26 + Math.min(6, wordCount)));
    return { score, level: 'simple', multiplier: 0.8, reason: 'Scripture verses list request' };
  }

  let score = 38;
  score += Math.min(22, Math.round(wordCount * 1.6));
  const punctuationCount = (clean.match(/[,;:\-–—\(\)]/g) || []).length;
  score += Math.min(8, punctuationCount * 2);

  const isDirectFactual = /^(?:хто\s+так[ийаеі]+|де\s+народив[сясь]+|де\s+знаходиться|де\s+написано|коли\s+жив|хто\s+написав|скільки\s+років|чи\s+був|чи\s+була|хто\s+був|хто\s+є|де\s+є|who\s+is|where\s+was|where\s+is|when\s+did)/iu.test(clean);
  if (isDirectFactual && wordCount <= 8) {
    score -= 12;
  }

  const isPracticalGuidance = /(?:як\s+правильно|як\s+навчитися|як\s+прощати|як\s+молитися|як\s+боротися|що\s+робити|як\s+подолати|порадь|порада|практичн|how\s+to|what\s+should)/i.test(lower);
  if (isPracticalGuidance) {
    score += 8;
  }

  const isConceptualTopic = /(?:що\s+таке|сутність|природа|значення|доктрин|первородн|виправданн|відкупленн|троїчн|заповіт|теодице|есхатолог|що\s+означає|concept|theology|doctrine|nature\s+of)/i.test(lower);
  if (isConceptualTopic) {
    score += 16;
  }

  const isDeepAnalytical = /(?:порівняй|аналіз|екзегез|богословськ|історичн|контекст|грецьк|іврит|дослідж|пророцтв|герменевтик|символізм|розкрий\s+глибин|treatise|exegesis|theological|compare|historical)/i.test(lower);
  if (isDeepAnalytical) {
    score += 24;
  }

  if (/\b\d{1,3}\s*[:\.]\s*\d{1,3}\b/.test(clean) || /\b[HG]\d{3,5}\b/i.test(clean) || /агапе|шалом|логос|хесед|алетейя/i.test(lower)) {
    score += 6;
  }

  score = Math.max(28, Math.min(98, Math.round(score)));

  let level: 'simple' | 'moderate' | 'deep' | 'unthrottled' = 'moderate';
  if (score < 40) level = 'simple';
  else if (score < 68) level = 'moderate';
  else if (score < 80) level = 'deep';
  else level = 'unthrottled';

  return { score, level, multiplier: 1.0, reason: `Computed dynamic complexity: ${score}%` };
}

/**
 * 🎛️ 4-Tier Calibrated Model Budget Engine
 */
export function computeAdaptiveModelBudget(params: {
  modelName: string;
  userMessage: string;
  details?: any;
  warmth?: number;
  isReasoning?: boolean;
}): AdaptiveBudget {
  const { modelName, userMessage, details, warmth, isReasoning } = params;
  const sizeB = extractModelParamSizeB(modelName, details) || 7.0;
  const tier = resolveModelTier(sizeB);
  const family = detectModelFamily(modelName, details);
  const complexity = estimatePromptComplexity(userMessage);

  let numCtx = 8192;
  if (tier === 'tier1') numCtx = 4096;
  else if (tier === 'tier1_5') numCtx = 6144;
  else if (tier === 'tier2') numCtx = 8192;
  else numCtx = 8192;

  const lowerName = (modelName || '').toLowerCase();
  const autoReasoning = isReasoning || 
    lowerName.includes('r1') || 
    lowerName.includes('thinking') || 
    lowerName.includes('reasoning') || 
    lowerName.includes('o1') || 
    lowerName.includes('o3') ||
    lowerName.includes('deepseek-reasoner');

  const reasoningBonus = autoReasoning ? 1200 : 0;
  let numPredict = 3000;
  if (tier === 'tier1') numPredict = 2000;
  else if (tier === 'tier1_5') numPredict = 2500;
  else if (tier === 'tier2') numPredict = 3500;
  else if (tier === 'tier3') numPredict = 5000;
  numPredict += reasoningBonus;

  let computedMinP = tier === 'tier1' ? 0.07 : tier === 'tier1_5' ? 0.06 : tier === 'tier2' ? 0.05 : 0.04;
  let baseTemp = tier === 'tier1' ? 0.30 : tier === 'tier1_5' ? 0.35 : tier === 'tier2' ? 0.45 : 0.55;
  let computedTopP = 0.90;
  let computedRepeatPenalty = 1.08;
  let computedFrequencyPenalty = 0.05;
  let computedPresencePenalty = 0.05;
  let computedRepeatLastN = 128;

  if (autoReasoning || family === 'deepseek') {
    baseTemp = 0.25;
    computedTopP = 0.90;
    computedMinP = 0.05;
    computedRepeatPenalty = 1.02;
    computedFrequencyPenalty = 0.0;
    computedRepeatLastN = 128;
  }

  if (warmth !== undefined && warmth !== null) {
    const warmthDelta = (warmth - 50) / 400;
    baseTemp = Math.max(0.15, Math.min(0.75, baseTemp + warmthDelta));
  }

  let maxThinkChars = 3500;
  if (sizeB <= 12.5) {
    maxThinkChars = 1500;
  } else if (sizeB <= 25) {
    maxThinkChars = 3500;
  } else {
    maxThinkChars = 4500;
  }

  return {
    numCtx,
    numPredict,
    temperature: Number(baseTemp.toFixed(2)),
    topP: Number(computedTopP.toFixed(2)),
    minP: Number(computedMinP.toFixed(2)),
    repeatPenalty: Number(computedRepeatPenalty.toFixed(2)),
    frequencyPenalty: Number(computedFrequencyPenalty.toFixed(2)),
    presencePenalty: Number(computedPresencePenalty.toFixed(2)),
    repeatLastN: computedRepeatLastN,
    maxThinkChars,
    parameterSizeB: sizeB,
    family,
    complexity,
    tier
  };
}
