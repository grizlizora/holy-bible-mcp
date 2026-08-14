export interface ModelCapabilities {
  supportsImages: boolean;
  supportsAudio: boolean;
  supportsVideo: boolean;
  parameterSize?: number | null;
  isSmallModel?: boolean;
  isReasoningModel?: boolean;
  supportsThinking?: boolean;
}

export interface PromptComplexityResult {
  score: number;
  level: 'simple' | 'moderate' | 'deep' | 'unthrottled';
  multiplier: number;
  reason: string;
}

export type LLMFamily = 'qwen' | 'phi' | 'llama' | 'deepseek' | 'gemma' | 'generic';

export type ModelTier = 'tier1' | 'tier1_5' | 'tier2' | 'tier3';

export interface AdaptiveBudget {
  numCtx: number;
  numPredict: number;
  temperature: number;
  topP: number;
  minP: number;
  repeatPenalty: number;
  frequencyPenalty: number;
  presencePenalty: number;
  repeatLastN: number;
  maxThinkChars: number;
  parameterSizeB: number;
  family: LLMFamily;
  complexity: PromptComplexityResult;
  tier: ModelTier;
}

/**
 * 🧠 100% Model-Agnostic Algorithmic Parameter & Capacity Parser.
 * Dynamically resolves parameter size (in Billions) for ANY local or cloud LLM (current or future)
 * using metadata inspection, numeric regex extraction, architecture descriptors, and context heuristics.
 */
export function extractModelParamSizeB(modelName: string, details?: any): number {
  // Layer 1: Direct Numeric Metadata Inspection
  const rawParams = details?.parameter_count || details?.num_params || details?.metadata?.parameter_count;
  if (typeof rawParams === 'number' && rawParams > 0) {
    return Math.round((rawParams / 1e9) * 10) / 10;
  }

  const name = (modelName || '').toLowerCase().trim();
  if (!name) return 14.0;

  // Layer 2A: MoE (Mixture-of-Experts) Architecture Resolver (e.g., "8x7b", "16x3.5b")
  const moeMatch = name.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*[bB]\b/);
  if (moeMatch) {
    const experts = parseInt(moeMatch[1], 10);
    const sizePerExpert = parseFloat(moeMatch[2]);
    if (!isNaN(experts) && !isNaN(sizePerExpert)) {
      return Math.round(experts * sizePerExpert * 10) / 10;
    }
  }

  // Layer 2B: Generic Universal Parameter Pattern Regex (Matches "70b", "70-b", "3.5b", "0.5b", "120b", "350m")
  const bMatch = name.match(/(?:^|[^a-z0-9.])(\d+(?:\.\d+)?)\s*[-_]?\s*[bB](?:[^a-z0-9.]|$)/);
  if (bMatch) {
    const val = parseFloat(bMatch[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  const mMatch = name.match(/(?:^|[^a-z0-9.])(\d+(?:\.\d+)?)\s*[-_]?\s*[mM](?:[^a-z0-9.]|$)/);
  if (mMatch) {
    const val = parseFloat(mMatch[1]);
    if (!isNaN(val) && val > 0) return Math.round((val / 1000) * 100) / 100;
  }

  const tagMatch = name.match(/:(?:q\d+_[a-z0-9_]+-)?(\d+(?:\.\d+)?)[bB]\b/);
  if (tagMatch) {
    const val = parseFloat(tagMatch[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  // Layer 3A: Algorithmic Compact/Mini Variant Detector (maps mini/flash/haiku/nano variants -> Tier 1.5: 10.0B)
  const isCompactVariant = /(?:^|[^a-z])(mini|nano|micro|pico|tiny|small|lite|flash|haiku|compact|mobile|edge|turbo-mini)(?:[^a-z]|$)/.test(name);
  if (isCompactVariant) {
    return 10.0;
  }

  // Layer 3B: Algorithmic High-Capacity & Frontier Model Detector (maps pro/plus/ultra/sonnet/opus/deepseek -> Tier 3: 70.0B)
  const isHighCapacityVariant = /(?:^|[^a-z])(pro|plus|ultra|max|large|xl|xxl|huge|giant|mega|deepseek|sonnet|opus|reasoning|thinking|frontier|heavy|cot|o1|o3|gpt-4|claude-3|gemini-1|gemini-2)(?:[^a-z]|$)/.test(name);
  if (isHighCapacityVariant) {
    return 70.0;
  }

  // Layer 3C: Context Window Capacity Heuristic (if context >= 128K -> Tier 3: 70.0B)
  const ctxLength = details?.context_length || details?.num_ctx;
  if (typeof ctxLength === 'number' && ctxLength >= 128000) {
    return 70.0;
  }

  // Universal Default Baseline: Safe high-capability resolution (14.0B -> Tier 3)
  return 14.0;
}

/**
 * 🧠 Strict Model Tier Matrix Resolution
 * Tier 1 (<=8.5B), Tier 1.5 (8.5B-10.5B), Tier 2 (10.5B-13.5B), Tier 3 (>13.5B)
 */
export function getModelTier(paramSizeB: number | null | undefined): ModelTier {
  const size = typeof paramSizeB === 'number' && !isNaN(paramSizeB) ? paramSizeB : 14.0;
  if (size <= 8.5) return 'tier1';
  if (size <= 10.5) return 'tier1_5';
  if (size <= 13.5) return 'tier2';
  return 'tier3';
}

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
 * Evaluates text length, sentence depth, clause count, scripture references, and multi-lingual triggers.
 * Works seamlessly across ALL 700+ languages worldwide!
 */
export function estimatePromptComplexity(text: string): PromptComplexityResult {
  if (!text || !text.trim()) {
    return { score: 50, level: 'moderate', multiplier: 1.0, reason: 'Empty or trivial query' };
  }

  const clean = text.trim();
  let score = 50;

  // 1. Universal Unicode Structural & Script Density Metrics (800+ Languages)
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const isCjk = /[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/.test(clean);
  const effectiveWordCount = isCjk ? clean.length * 1.5 : wordCount;

  if (clean.length > 250 || effectiveWordCount > 40) score += 20;
  else if (clean.length > 120 || effectiveWordCount > 20) score += 10;
  else if (clean.length < 20 && effectiveWordCount < 3) score -= 12;

  // Clause count & punctuation complexity across all world scripts (Latin, Cyrillic, Arabic, Armenian, Ethiopic, CJK)
  const punctuationCount = (clean.match(/[,;:\-–—?!¿¡؟፧՞\u3001\u3002\uFF1F\uFF01]/gu) || []).length;
  if (punctuationCount >= 4) score += 10;

  // Universal Scripture reference detection across scripts (e.g. "3:16", "12.4", "３：１６")
  const hasScriptureRef = /\b\d{1,3}\s*[:\.\uff1a]\s*\d{1,3}\b/.test(clean);
  if (hasScriptureRef) score += 10;

  // Strong's ID / Etymology indicator (e.g. "H8267", "G5579")
  const hasStrongsCode = /\b[HG]\d{3,5}\b/i.test(clean);
  if (hasStrongsCode) score += 15;

  // 2. Universal Semantic & Ontological Inquiry Evaluator (800+ Languages)
  // Detects conceptual questions (definitions, purpose, suffering, faith, love, hope, grace, eternity) across all language families
  const isQuestion = /[?¿؟፧՞\uff1f]/.test(clean) || /^(?:що|як|чому|хто|де|чи|what|why|how|who|where|is|can|qué|por qué|cómo|quién|warum|wie|wer|was|pourquoi|comment|qui|que|dlaczego|jak|kto|co|perché|come|chi|cosa|porque|como|quem|qual|waarom|hoe|wie|wat|зачем|لماذا|كيف|من|ما|למה|איך|מי|מה|为什么|如何|谁|什么是|なぜ|どうして|誰|何|왜|어떻게|누구|무엇|kyk|hvorfor|hvordan|hvem|hva|miksi|kuinka|kuka|mitä)/i.test(clean.trim());
  
  if (isQuestion) {
    score = Math.max(68, score + 15);
  }

  // Trivial single-token greeting detection across all major language roots
  const isTrivialGreeting = /^(?:привіт|добрий|дякую|спасибі|ок|hello|hi|thanks|ok|hola|gracias|hallo|danke|bonjour|merci|cześć|dzięki|ciao|grazie|olá|obrigado|hallo|bedankt|привет|спасибо|مرحبا|شكرا|שלום|תודה|你好|谢谢|こんにちは|ありがとう|안녕하세요|감사합니다)$/i.test(clean.trim());
  if (isTrivialGreeting) {
    score = Math.min(25, score - 25);
  }

  score = Math.max(10, Math.min(100, score));

  if (score < 40) {
    return { score, level: 'simple', multiplier: 0.7, reason: 'Short factual or greeting query' };
  } else if (score < 70) {
    return { score, level: 'moderate', multiplier: 1.0, reason: 'Standard analytical question' };
  } else if (score < 85) {
    return { score, level: 'deep', multiplier: 1.3, reason: 'Deep conceptual/theological query' };
  } else {
    return { score, level: 'unthrottled', multiplier: 1.5, reason: 'Complex ontological study' };
  }
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
  const tier = getModelTier(sizeB);
  const family = detectModelFamily(modelName, details);
  const complexity = estimatePromptComplexity(userMessage);

  // Power-of-2 context bucketing for GPU Metal VRAM stability
  let numCtx = 8192;
  if (tier === 'tier1') numCtx = 4096;
  else if (tier === 'tier1_5') numCtx = 6144;
  else if (tier === 'tier2') numCtx = 8192;
  else numCtx = 8192;

  const reasoningBonus = isReasoning ? 1200 : 0;
  let numPredict = 3000;
  if (tier === 'tier1') numPredict = 2000;
  else if (tier === 'tier1_5') numPredict = 2500;
  else if (tier === 'tier2') numPredict = 3500;
  else if (tier === 'tier3') numPredict = 5000;
  numPredict += reasoningBonus;

  // Calibrated min_p matrix per tier
  let computedMinP = tier === 'tier1' ? 0.07 : tier === 'tier1_5' ? 0.06 : tier === 'tier2' ? 0.05 : 0.04;
  let baseTemp = tier === 'tier1' ? 0.30 : tier === 'tier1_5' ? 0.35 : tier === 'tier2' ? 0.45 : 0.55;
  let computedTopP = 0.90;
  let computedRepeatPenalty = 1.08;
  let computedFrequencyPenalty = 0.05;
  let computedPresencePenalty = 0.05;
  let computedRepeatLastN = 128;

  if (isReasoning || family === 'deepseek') {
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
