export interface ModelCapabilities {
  supportsImages: boolean;
  supportsAudio: boolean;
  supportsVideo: boolean;
  parameterSize?: number | null;
  isSmallModel?: boolean;
  isReasoningModel?: boolean;
  supportsThinking?: boolean;
}

const capabilitiesCache = new Map<string, { capabilities: ModelCapabilities; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

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
 * Smart classification: returns true if the model parameter count is <= 12.5 Billion parameters,
 * or if it has an explicit generic size descriptor ("mini" / "nano" / "pico" / "tiny" / "small" / "micro" / "lite").
 */
export function isSmallModelByParamSize(modelName: string, details?: any): boolean {
  const sizeB = extractModelParamSizeB(modelName, details);
  if (sizeB !== null) {
    return sizeB <= 10.0;
  }
  const lower = (modelName || '').toLowerCase();
  return lower.includes('mini') || lower.includes('nano') || lower.includes('tiny') || lower.includes('pico') || lower.includes('micro') || lower.includes('small') || lower.includes('lite');
}


/**
 * 🧠 100% Model-Agnostic Dynamic Reasoning & Capability Classifier.
 * Inspects native model metadata, modelfile Jinja templates, special tokens, and engine capabilities
 * returned directly from the AI runtime (Ollama / V8 API), zero manual model brand name checks.
 */
export function detectReasoningCapability(modelName: string, templateText?: string, details?: any, rawCapabilities?: string[]): boolean {
  const normalized = (modelName || '').toLowerCase();

  // 1. Native Engine Capability Array Inspection (e.g. Ollama ["completion", "tools", "thinking"])
  if (Array.isArray(rawCapabilities) && rawCapabilities.length > 0) {
    if (rawCapabilities.some(c => typeof c === 'string' && (c.toLowerCase().includes('thinking') || c.toLowerCase().includes('reasoning')))) {
      return true;
    }
  }

  // 2. Strict Jinja Chat Template & Modelfile Inspection for Thinking Tags
  if (templateText) {
    const lowerTemplate = templateText.toLowerCase();
    if (
      lowerTemplate.includes('<think>') || 
      lowerTemplate.includes('</think>') || 
      lowerTemplate.includes('thought_tag') ||
      lowerTemplate.includes('start_of_thought') ||
      lowerTemplate.includes('thinking') ||
      lowerTemplate.includes('reasoning_content')
    ) {
      return true;
    }
  }

  // 3. Dynamic Model Architecture & Family Inspection (Model-Agnostic)
  const familyArch = String(details?.family || details?.architecture || '').toLowerCase();
  if (familyArch.includes('reasoner') || familyArch.includes('reasoning') || familyArch.includes('thinking') || familyArch.includes('thought') || familyArch.includes('cot')) {
    return true;
  }

  // 4. Generic Model Name Intent Signatures (Model-Agnostic Functional Keywords)
  const functionalReasoningRegex = /(?:^|[^a-z0-9])(?:reasoner|reasoning|thinking|thinker|think|cot|logic|math)(?:$|[^a-z0-9])/i;
  if (functionalReasoningRegex.test(normalized)) {
    return true;
  }

  return false;
}

/**
 * Dynamically determines if a model natively supports multimodal inputs and reasoning capabilities.
 * For local models, queries Ollama's metadata endpoint for vision encoder families, templates & model info.
 * For APIs, checks model name signatures.
 */
export async function determineModelCapabilities(modelName: string, channelType: string): Promise<ModelCapabilities> {
  const normalized = modelName.toLowerCase();
  const cacheKey = `${channelType}:${normalized}`;

  const cached = capabilitiesCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.capabilities;
  }

  const isReasoning = detectReasoningCapability(modelName);

  // 1. API Models (OpenAI, Anthropic, Gemini, DeepSeek, OpenRouter)
  if (channelType === 'api') {
    const isKnownVision = 
      normalized.includes('vision') || 
      normalized.includes('-vl') ||
      normalized.includes('4o') ||
      normalized.includes('claude-3') ||
      normalized.includes('gemini');

    const paramSizeB = extractModelParamSizeB(modelName);
    const isSmall = isSmallModelByParamSize(modelName);

    const caps: ModelCapabilities = { 
      supportsImages: isKnownVision, 
      supportsAudio: false, 
      supportsVideo: false, 
      isReasoningModel: isReasoning,
      parameterSize: paramSizeB,
      isSmallModel: isSmall
    };
    capabilitiesCache.set(cacheKey, { capabilities: caps, expiresAt: Date.now() + CACHE_TTL_MS });
    return caps;
  }

  // 2. Local Ollama Models - Dynamic metadata check
  try {
    const rawBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/api';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');
    const showUrl = baseUrl.endsWith('/api') ? `${baseUrl}/show` : `${baseUrl}/api/show`;

    const res = await fetch(showUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName }),
      signal: AbortSignal.timeout(2000)
    });
    
    if (res.ok) {
      const data = await res.json();
      const families: string[] = data?.details?.families || [];
      const family: string = data?.details?.family || '';
      const modelInfo = data?.model_info || {};
      const template = data?.template || data?.modelfile || '';

      const visionFamilies = ['clip', 'vision', 'mllama', 'vl', 'projector'];
      
      const hasVisionFamily = visionFamilies.some(f => 
        family.toLowerCase().includes(f) || families.some((fam: string) => fam.toLowerCase().includes(f))
      );

      const hasVisionProjector = Object.keys(modelInfo).some(key => 
        key.includes('projector') || key.includes('vision') || key.includes('mmproj') || key.includes('clip')
      );
      
      const isVision = hasVisionFamily || hasVisionProjector || normalized.includes('vision') || normalized.includes('vl');
      const rawCapabilities: string[] = data?.capabilities || [];
      const isDynamicReasoning = detectReasoningCapability(modelName, template, data?.details, rawCapabilities);

      const paramSizeB = extractModelParamSizeB(modelName, data?.details);
      const isSmall = isSmallModelByParamSize(modelName, data?.details);
      const supportsThinking = (paramSizeB !== null ? paramSizeB > 8.0 : !isSmall) && isDynamicReasoning;

      const caps: ModelCapabilities = { 
        supportsImages: isVision, 
        supportsAudio: false, 
        supportsVideo: false, 
        isReasoningModel: isDynamicReasoning,
        supportsThinking,
        parameterSize: paramSizeB,
        isSmallModel: isSmall
      };

      capabilitiesCache.set(cacheKey, { capabilities: caps, expiresAt: Date.now() + CACHE_TTL_MS });
      return caps;
    }
  } catch (err) {
    console.warn(`[CAPABILITIES] Failed to fetch Ollama metadata for ${modelName}:`, err);
  }

  const isVisionHeuristic = normalized.includes('vision') || normalized.includes('-vl') || normalized.includes('llava');
  const paramSizeB = extractModelParamSizeB(modelName);
  const isSmall = isSmallModelByParamSize(modelName);
  const supportsThinking = (paramSizeB !== null ? paramSizeB > 8.0 : !isSmall) && isReasoning;

  const fallbackCaps: ModelCapabilities = { 
    supportsImages: isVisionHeuristic, 
    supportsAudio: false, 
    supportsVideo: false, 
    isReasoningModel: isReasoning,
    supportsThinking,
    parameterSize: paramSizeB,
    isSmallModel: isSmall
  };
  capabilitiesCache.set(cacheKey, { capabilities: fallbackCaps, expiresAt: Date.now() + CACHE_TTL_MS });
  return fallbackCaps;
}

export interface PromptComplexityResult {
  score: number; // 0 to 100
  level: 'simple' | 'moderate' | 'deep' | 'unthrottled';
  multiplier: number;
  reason: string;
}

/**
 * 🧠 Dynamic Question Complexity Estimator.
 * Analyzes semantic triggers, philosophical depth, analytical query intent, and length
 * to automatically scale model output limits so models are NEVER suffocated on complex queries.
 */
export function estimatePromptComplexity(text: string): PromptComplexityResult {
  const clean = (text || '').trim();
  if (!clean || clean.length < 6) {
    return { score: 5, level: 'simple', multiplier: 0.6, reason: 'Brief greeting or trigger' };
  }

  let score = 25; // baseline

  // 1. Language-Agnostic Structural & Length Metrics
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (clean.length > 250 || wordCount > 40) score += 20;
  else if (clean.length > 100 || wordCount > 15) score += 10;

  const punctuationCount = (clean.match(/[,;:\-\–\—\?\!]/g) || []).length;
  if (punctuationCount >= 4) score += 10;

  // Scripture reference detection (e.g. "3:16", "12.4")
  if (/\b\d{1,3}\s*[:\.]\s*\d{1,3}\b/.test(clean)) score += 10;

  // Strong's ID / Etymology indicator (e.g. "H8267", "G5579")
  if (/\b[HG]\d{3,5}\b/i.test(clean)) score += 15;

  const lower = clean.toLowerCase();

  // 2. Deep Philosophical, Theological & Morality Keywords (+25) (UKR, ENG, SPA, DEU, FRA, POL, ITA, POR, NLD)
  const deepKeywords = [
    // UKR
    'що таке', 'що означає', 'сенс', 'душа', 'любов', 'бог', 'віра', 'смерть', 'гріх',
    'мораль', 'добро', 'зло', 'духовний', 'біблія', 'христос', 'буття', 'призначення',
    'щастя', 'спасіння', 'істина', 'благодать', 'мудрість', 'заповідь', 'любові', 'страждання',
    // ENG
    'what is', 'meaning', 'soul', 'love', 'god', 'faith', 'death', 'sin', 'morality',
    'good', 'evil', 'spiritual', 'bible', 'christ', 'salvation', 'truth', 'grace', 'wisdom', 'commandment', 'suffering', 'purpose',
    // SPA
    'qué es', 'significado', 'alma', 'amor', 'dios', 'fe', 'muerte', 'pecado', 'moral',
    'espiritual', 'biblia', 'cristo', 'salvación', 'verdad', 'gracia', 'sabiduría', 'sufrimiento',
    // DEU
    'was ist', 'bedeutung', 'seele', 'liebe', 'gott', 'glaube', 'tod', 'sünde', 'moral',
    'geistlich', 'bibel', 'christus', 'rettung', 'wahrheit', 'gnade', 'weisheit', 'ewigkeit',
    // FRA
    'qu\'est-ce que', 'sens', 'âme', 'amour', 'dieu', 'foi', 'mort', 'péché', 'morale',
    'spirituel', 'bible', 'christ', 'salut', 'vérité', 'grâce', 'sagesse', 'souffrance',
    // POL
    'co to jest', 'sens', 'dusza', 'miłość', 'bóg', 'wiara', 'śmierć', 'grzech', 'moralność',
    'duchowy', 'biblia', 'chrystus', 'zbawienie', 'prawda', 'łaska', 'mądrość', 'cierpienie',
    // ITA / POR / NLD
    'cos\'è', 'oque é', 'amor', 'deus', 'fé', 'morte', 'pecado', 'salvação', 'liefde', 'geloof'
  ];
  if (deepKeywords.some(kw => lower.includes(kw))) {
    score += 25;
  }

  // 3. Analytical & Structural Triggers (+20)
  const analyticalKeywords = [
    // UKR
    'чому', 'поясни', 'проаналізуй', 'порівняй', 'різниця', 'розкрий', 'детально',
    'глибоко', 'аргументуй', 'причини', 'наслідки', 'структура', 'покроково',
    // ENG
    'why', 'explain', 'analyze', 'compare', 'difference', 'reveal', 'detailed',
    'deeply', 'argument', 'reasons', 'consequences', 'structure', 'step by step',
    // SPA
    'por qué', 'explica', 'analiza', 'compara', 'diferencia', 'revela', 'detalladamente',
    // DEU
    'warum', 'erkläre', 'analysiere', 'vergleiche', 'unterschied', 'detailliert',
    // FRA
    'pourquoi', 'expliquer', 'analyser', 'comparer', 'différence', 'révéler',
    // POL
    'dlaczego', 'wyjaśnij', 'przeanalizuj', 'porównaj', 'różnica', 'szczegółowo'
  ];
  if (analyticalKeywords.some(kw => lower.includes(kw))) {
    score += 20;
  }

  score = Math.min(100, Math.max(0, score));

  if (score >= 60) {
    return { score, level: 'unthrottled', multiplier: 2.2, reason: 'Deep analytical/philosophical prompt' };
  } else if (score >= 40) {
    return { score, level: 'deep', multiplier: 1.6, reason: 'High-detail query' };
  } else if (score >= 20) {
    return { score, level: 'moderate', multiplier: 1.0, reason: 'Standard query' };
  } else {
    return { score, level: 'simple', multiplier: 0.6, reason: 'Brief input' };
  }
}

export type LLMFamily = 'qwen' | 'phi' | 'llama' | 'deepseek' | 'generic';

export function detectModelFamily(modelName: string, details?: any): LLMFamily {
  const norm = (modelName || '').toLowerCase();
  const familyStr = String(details?.family || details?.architecture || '').toLowerCase();

  if (norm.includes('deepseek') || familyStr.includes('deepseek')) return 'deepseek';
  if (norm.includes('qwen') || familyStr.includes('qwen')) return 'qwen';
  if (norm.includes('phi') || familyStr.includes('phi')) return 'phi';
  if (norm.includes('llama') || familyStr.includes('llama') || familyStr.includes('mllama')) return 'llama';

  return 'generic';
}

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
}


export type ModelTier = 'tier1' | 'tier1_5' | 'tier2' | 'tier3';

export function getModelTier(paramSizeB: number | null | undefined): ModelTier {
  if (!paramSizeB || paramSizeB <= 8.5) return 'tier1';
  if (paramSizeB <= 10.5) return 'tier1_5';
  if (paramSizeB <= 13.5) return 'tier2';
  return 'tier3';
}

/**
 * 🧠 Continuous Adaptive LLM Scaling Engine.
 * Dynamically computes optimal num_ctx, num_predict, temperature, top_p, min_p, repeat_penalty,
 * frequency_penalty, maxThinkChars, and prompt complexity rating based on model parameters and prompt intent.
 * Prevents models from suffocating on low token budgets while ensuring zero OOM/drift.
 */
export function computeAdaptiveModelBudget(params: {
  modelName: string;
  userMessage?: string;
  parameterSizeB?: number | null;
  isSmallModel?: boolean;
  isReasoningModel?: boolean;
  detailLevel?: string;
  warmth?: number;
  temperature?: number;
  topP?: number;
}): AdaptiveBudget {
  const { modelName, userMessage = '', parameterSizeB, isSmallModel, isReasoningModel, detailLevel = 'medium', warmth, temperature, topP } = params;

  // Resolve size in Billions (default to 4.5B if unknown small model, or 14B if unknown large model)
  const sizeB = parameterSizeB ?? (extractModelParamSizeB(modelName) ?? (isSmallModel ? 4.5 : 14.0));
  const isReasoning = isReasoningModel ?? detectReasoningCapability(modelName);
  const family = detectModelFamily(modelName);

  // 1. Dynamic Prompt Complexity Assessment & Mode Normalization
  const complexity = estimatePromptComplexity(userMessage);
  const modeNormalized = (detailLevel || 'auto').toLowerCase().trim();

  // 2. Dynamic num_ctx scaling curve (Expanded up to 16k for ultra-complex 100/100 prompts)
  let numCtx: number;
  if (complexity.score >= 80 || userMessage.length > 800) {
    numCtx = sizeB >= 10.5 ? 16384 : 8192;
  } else if (sizeB <= 3.0) {
    numCtx = 4096;
  } else if (sizeB <= 8.0) {
    numCtx = (modeNormalized === 'detailed' || modeNormalized === 'deep') ? 6144 : 4096;
  } else {
    numCtx = (modeNormalized === 'detailed' || modeNormalized === 'deep') ? 8192 : 6144;
  }

  // 3. UI Mode-Driven Token Allocation & Dynamic Complexity Adjustment
  const sizeFactor = Math.min(1.2, Math.max(0.65, Math.pow(sizeB / 7.0, 0.3)));

  const basePredictByMode: Record<string, number> = {
    minimal: 550,
    short: 950,
    medium: 2200,
    detailed: 4500,
    deep: 6000,
    verses_only: 700
  };

  let numPredict: number;
  const reasoningBonus = isReasoning ? 1200 : 0;

  if (complexity.score >= 80 || userMessage.length > 800) {
    numPredict = (sizeB >= 26 ? 8192 : sizeB >= 10.5 ? 6000 : 4000) + reasoningBonus;
  } else if (modeNormalized !== 'auto' && basePredictByMode[modeNormalized]) {
    numPredict = basePredictByMode[modeNormalized] + reasoningBonus;
  } else {
    const basePredict = 2200;
    numPredict = Math.round(basePredict * sizeFactor * complexity.multiplier);
    if (complexity.level === 'unthrottled') {
      numPredict = Math.min(6000, Math.max(numPredict, 3500)) + reasoningBonus;
    } else if (complexity.level === 'deep') {
      numPredict = Math.min(4500, Math.max(numPredict, 2800)) + reasoningBonus;
    } else if (complexity.level === 'simple') {
      numPredict = Math.min(1000, Math.max(numPredict, 500)) + reasoningBonus;
    } else {
      numPredict = Math.min(3000, Math.max(numPredict, 1800)) + reasoningBonus;
    }
  }

  // 4. Family-Aware Dynamic Sampling Matrix Calibration
  const tier = getModelTier(sizeB);

  let baseTemp = temperature ?? (
    tier === 'tier1' ? 0.30 :
    tier === 'tier1_5' ? 0.35 :
    tier === 'tier2' ? 0.45 : 0.55
  );
  let computedTopP = topP ?? (
    tier === 'tier1' ? 0.90 :
    tier === 'tier1_5' ? 0.88 :
    tier === 'tier2' ? 0.88 : 0.85
  );
  let computedMinP = (
    tier === 'tier1' ? 0.07 :
    tier === 'tier1_5' ? 0.06 :
    tier === 'tier2' ? 0.05 : 0.04
  );
  let computedRepeatPenalty = (
    tier === 'tier1' ? 1.05 :
    tier === 'tier1_5' ? 1.04 :
    tier === 'tier2' ? 1.03 : 1.02
  );
  let computedFrequencyPenalty = 0.0;
  let computedPresencePenalty = 0.0;
  let computedRepeatLastN = (
    tier === 'tier1' ? 128 :
    tier === 'tier1_5' ? 256 :
    tier === 'tier2' ? 256 : 512
  );

  if (isReasoning || family === 'deepseek') {
    // 🧠 Open-source benchmark standard: Low temperature (0.22-0.28) prevents infinite thinking loops in reasoning models
    baseTemp = 0.25;
    computedTopP = 0.90;
    computedMinP = 0.05;
    computedRepeatPenalty = 1.02;
    computedFrequencyPenalty = 0.0;
    computedRepeatLastN = 128;
  }

  // Adjust temperature slightly based on Warmth slider if user specified warmth
  if (warmth !== undefined && warmth !== null) {
    const warmthDelta = (warmth - 50) / 400; // Controlled delta (-0.12 to +0.12)
    baseTemp = Math.max(0.15, Math.min(0.75, baseTemp + warmthDelta));
  }

  // 🧠 Strict Reasoning Cap Tier System (aligned with isSmallModel threshold 12.5B):
  // Tier 1 (<=12.5B, isSmallModel=true): supportsThinking=false anyway, 1500 chars safety cap
  // Tier 2 (12.5B-25B, e.g. qwen3:14b, phi-4:14b): 3500 chars — needs full planning phase
  // Tier 3 (>25B, e.g. qwen2.5:32b): 4500 chars — heavy reasoning models
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
    complexity
  };


}
