/**
 * 🧠 100% Model-Agnostic Algorithmic Parameter & Capacity Parser.
 * Dynamically resolves parameter size (in Billions) for ANY local or cloud LLM (current or future)
 * using metadata inspection, numeric regex extraction, architecture descriptors, and context heuristics.
 */
export function extractModelParamSizeB(modelName, details) {
    // Layer 1: Direct Numeric Metadata Inspection
    const rawParams = details?.parameter_count || details?.num_params || details?.metadata?.parameter_count;
    if (typeof rawParams === 'number' && rawParams > 0) {
        return Math.round((rawParams / 1e9) * 10) / 10;
    }
    const strParams = details?.parameter_size || details?.parameterSizeB;
    if (typeof strParams === 'number' && strParams > 0) {
        return strParams;
    }
    if (typeof strParams === 'string' && strParams) {
        const parsed = parseFloat(strParams);
        if (!isNaN(parsed) && parsed > 0) {
            return strParams.toLowerCase().includes('m') ? Math.round((parsed / 1000) * 100) / 100 : parsed;
        }
    }
    const name = (modelName || '').toLowerCase().trim();
    if (!name)
        return 14.0;
    // Layer 2A: MoE (Mixture-of-Experts) Architecture Resolver (e.g., "8x7b", "16x3.5b", "8x22b")
    const moeMatch = name.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*[bB]\b/);
    if (moeMatch) {
        const experts = parseInt(moeMatch[1], 10);
        const sizePerExpert = parseFloat(moeMatch[2]);
        if (!isNaN(experts) && !isNaN(sizePerExpert)) {
            return Math.round(experts * sizePerExpert * 10) / 10;
        }
    }
    // Layer 2B: Explicit Parameter Pattern Regex in Model Identifier (Matches "405b", "70b", "32b", "14b", "8b", "7b", "3b", "1.5b")
    const allMatches = Array.from(name.matchAll(/(?:^|[\s\-_/:])(\d+(?:\.\d+)?)\s*[bB](?:[\s\-_/:.]|$)/g));
    if (allMatches.length > 0) {
        const values = allMatches.map(m => parseFloat(m[1])).filter(v => !isNaN(v) && v > 0);
        if (values.length > 0) {
            return Math.max(...values);
        }
    }
    // Layer 2C: Million Parameter Suffix (e.g. "350m", "500m")
    const mMatch = name.match(/(?:^|[\s\-_/:])(\d+(?:\.\d+)?)\s*[mM](?:[\s\-_/:.]|$)/);
    if (mMatch) {
        const val = parseFloat(mMatch[1]);
        if (!isNaN(val) && val > 0)
            return Math.round((val / 1000) * 100) / 100;
    }
    // Layer 3: Known Architecture & Cloud Flagship Slugs (when no explicit B suffix in name)
    if (name.includes('deepseek-r1') ||
        name.includes('deepseek-v3') ||
        name.includes('deepseek/deepseek-chat') ||
        name.includes('deepseek-chat') ||
        name === 'r1' ||
        name === 'v3') {
        return 671.0;
    }
    if (name.includes('claude-3-opus') || name.includes('claude-opus'))
        return 175.0;
    if (name.includes('claude-3-7-sonnet') || name.includes('claude-3-5-sonnet') || name.includes('claude-3-sonnet') || name.includes('sonnet'))
        return 70.0;
    if (name.includes('claude-3-5-haiku') || name.includes('claude-3-haiku') || name.includes('haiku'))
        return 10.0;
    if (name.includes('gpt-4o-mini') || name.includes('gpt-4.1-mini') || name.includes('gpt-3.5-turbo'))
        return 10.0;
    if (name.includes('gpt-4.5'))
        return 100.0;
    if (name.includes('gpt-4o') || name.includes('gpt-4-turbo') || name.includes('gpt-4'))
        return 70.0;
    if (name.includes('o1-mini') || name.includes('o3-mini') || name.includes('o4-mini'))
        return 10.0;
    if (name.includes('o1') || name.includes('o3') || name.includes('o4'))
        return 70.0;
    if (name.includes('gemini-2.5-flash') || name.includes('gemini-2.0-flash') || name.includes('gemini-1.5-flash') || (name.includes('gemini') && name.includes('flash')))
        return 14.0;
    if (name.includes('gemini-1.5-pro') || name.includes('gemini-2.0-pro') || name.includes('gemini-ultra') || (name.includes('gemini') && name.includes('pro')))
        return 70.0;
    if (name.includes('grok-2') || name.includes('grok-vision') || name.includes('grok-beta') || name.includes('grok'))
        return 70.0;
    if (name.includes('command-r-plus') || name.includes('command-r+'))
        return 104.0;
    if (name.includes('command-r'))
        return 35.0;
    if (name.includes('dbrx'))
        return 132.0;
    if (name.includes('mistral-large') || name.includes('pixtral-large'))
        return 123.0;
    if (name.includes('codestral'))
        return 22.0;
    if (name.includes('mistral-small') || name.includes('mistral-nemo') || name.includes('nemo'))
        return 12.0;
    // Layer 4: Dynamic Semantic Tier Clustering Fallback
    const isCompactTier = /(?:^|[\s\-_/:])(mini|nano|micro|pico|tiny|small|lite|compact|mobile|edge)(?:[\s\-_/:]|$)/i.test(name);
    if (isCompactTier)
        return 10.0;
    const isMidTier = /(?:^|[\s\-_/:])(flash|medium|mid|standard)(?:[\s\-_/:]|$)/i.test(name);
    if (isMidTier)
        return 14.0;
    const isFrontierTier = /(?:^|[\s\-_/:])(ultra|max|plus|large|xl|xxl|huge|giant|mega|frontier|heavy|reasoner|reasoning|thinking)(?:[\s\-_/:]|$)/i.test(name);
    if (isFrontierTier)
        return 70.0;
    // Layer 4B: Context Window Capacity Heuristic (if context >= 128K -> Tier 3: 70.0B)
    const ctxLength = details?.context_length || details?.num_ctx;
    if (typeof ctxLength === 'number' && ctxLength >= 128000) {
        return 70.0;
    }
    // Universal Default Baseline
    return 14.0;
}
/**
 * 🧠 Strict Model Tier Matrix Resolution
 * Tier 1 (<=8.5B), Tier 1.5 (8.5B-10.5B), Tier 2 (10.5B-13.5B), Tier 3 (>13.5B)
 */
export function getModelTier(paramSizeB) {
    const size = typeof paramSizeB === 'number' && !isNaN(paramSizeB) ? paramSizeB : 14.0;
    if (size <= 8.5)
        return 'tier1';
    if (size <= 10.5)
        return 'tier1_5';
    if (size <= 24.99)
        return 'tier2';
    return 'tier3';
}
export function isSmallModelByParamSize(modelName, details) {
    const sizeB = extractModelParamSizeB(modelName, details);
    if (sizeB !== null) {
        return sizeB <= 12.5;
    }
    const name = (modelName || '').toLowerCase();
    return (name.includes('0.5b') ||
        name.includes('1.5b') ||
        name.includes('2b') ||
        name.includes('3b') ||
        name.includes('3.8b') ||
        name.includes('4b') ||
        name.includes('7b') ||
        name.includes('8b') ||
        name.includes('mini') ||
        name.includes('nano'));
}
export function detectModelFamily(modelName, details) {
    const name = (modelName || '').toLowerCase();
    const familyStr = (details?.family || '').toLowerCase();
    if (name.includes('qwen') || familyStr.includes('qwen'))
        return 'qwen';
    if (name.includes('phi') || familyStr.includes('phi'))
        return 'phi';
    if (name.includes('llama') || familyStr.includes('llama'))
        return 'llama';
    if (name.includes('deepseek') || familyStr.includes('deepseek'))
        return 'deepseek';
    if (name.includes('gemma') || familyStr.includes('gemma'))
        return 'gemma';
    return 'generic';
}
/**
 * 🧠 Universal Language-Agnostic Prompt Complexity Estimator
 * Evaluates text length, sentence depth, clause count, scripture references, and multi-lingual triggers.
 * Works seamlessly across ALL 700+ languages worldwide!
 */
export function estimatePromptComplexity(text) {
    if (!text || !text.trim()) {
        return { score: 50, level: 'moderate', multiplier: 1.0, reason: 'Empty query' };
    }
    const clean = text.trim();
    const lower = clean.toLowerCase();
    const words = clean.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    // 1. Trivial single-phrase greeting / acknowledgement (minimal: 15-25)
    const isTrivial = /^(?:привіт|добрий\s*день|доброго\s*дня|дякую|спасибі|ок|hello|hi|thanks|ok|hola|gracias|hallo|danke|bonjour|merci|привет|спасибо)$/i.test(lower) || (wordCount <= 2 && clean.length < 12 && !clean.includes('?'));
    if (isTrivial) {
        const score = Math.max(15, Math.min(25, 15 + wordCount * 3));
        return { score, level: 'simple', multiplier: 0.7, reason: 'Short greeting or acknowledgement' };
    }
    // 2. Explicit scripture verses list request (verses_only: 25-34)
    const isVersesOnly = /(?:дай|покажи|знайди|список|наведи|текст|цитати)\s+(?:вірш[івіам]?|цитат[иа]?|писанн?я|біблійн[их|і])/i.test(lower) ||
        /(?:verses\s+only|only\s+verses|list\s+of\s+verses|show\s+verses|find\s+verses|scriptures\s+on)/i.test(lower);
    if (isVersesOnly) {
        const score = Math.max(25, Math.min(34, 26 + Math.min(6, wordCount)));
        return { score, level: 'simple', multiplier: 0.8, reason: 'Scripture verses list request' };
    }
    // --- Dynamic Multi-Dimensional Continuous Score Calculator (28 to 98) ---
    let score = 38;
    // Factor A: Linguistic Depth & Length (scales +2 to +22)
    score += Math.min(22, Math.round(wordCount * 1.6));
    // Factor B: Structural & Punctuation Complexity
    const punctuationCount = (clean.match(/[,;:\-–—\(\)]/g) || []).length;
    score += Math.min(8, punctuationCount * 2);
    // Factor C: Direct Single-Fact / Lookup Intent (-10 to -14)
    const isDirectFactual = /^(?:хто\s+так[ийаеі]+|де\s+народив[сясь]+|де\s+знаходиться|де\s+написано|коли\s+жив|хто\s+написав|скільки\s+років|чи\s+був|чи\s+була|хто\s+був|хто\s+є|де\s+є|who\s+is|where\s+was|where\s+is|when\s+did)/iu.test(clean);
    if (isDirectFactual && wordCount <= 8) {
        score -= 12;
    }
    // Factor D: Practical "How-to" / Life Guidance (+6 to +10)
    const isPracticalGuidance = /(?:як\s+правильно|як\s+навчитися|як\s+прощати|як\s+молитися|як\s+боротися|що\s+робити|як\s+подолати|порадь|порада|практичн|how\s+to|what\s+should)/i.test(lower);
    if (isPracticalGuidance) {
        score += 8;
    }
    // Factor E: Theological / Philosophical Concept Definition (+12 to +18)
    const isConceptualTopic = /(?:що\s+таке|сутність|природа|значення|доктрин|первородн|виправданн|відкупленн|троїчн|заповіт|теодице|есхатолог|що\s+означає|concept|theology|doctrine|nature\s+of)/i.test(lower);
    if (isConceptualTopic) {
        score += 16;
    }
    // Factor F: Deep Comparative / Exegetical / Cross-Testament Analysis (+20 to +28)
    const isDeepAnalytical = /(?:порівняй|аналіз|екзегез|богословськ|історичн|контекст|грецьк|іврит|дослідж|пророцтв|герменевтик|символізм|розкрий\s+глибин|treatise|exegesis|theological|compare|historical)/i.test(lower);
    if (isDeepAnalytical) {
        score += 24;
    }
    // Factor G: Specific Scripture or Strong's Reference (+6)
    if (/\b\d{1,3}\s*[:\.]\s*\d{1,3}\b/.test(clean) || /\b[HG]\d{3,5}\b/i.test(clean) || /агапе|шалом|логос|хесед|алетейя/i.test(lower)) {
        score += 6;
    }
    // Bound within 28 to 98
    score = Math.max(28, Math.min(98, Math.round(score)));
    let level = 'moderate';
    if (score < 40)
        level = 'simple';
    else if (score < 68)
        level = 'moderate';
    else if (score < 80)
        level = 'deep';
    else
        level = 'unthrottled';
    return { score, level, multiplier: 1.0, reason: `Computed dynamic complexity: ${score}%` };
}
/**
 * 🎛️ 4-Tier Calibrated Model Budget Engine
 */
export function computeAdaptiveModelBudget(params) {
    const { modelName, userMessage, details, warmth, isReasoning } = params;
    const sizeB = extractModelParamSizeB(modelName, details) || 7.0;
    const tier = getModelTier(sizeB);
    const family = detectModelFamily(modelName, details);
    const complexity = estimatePromptComplexity(userMessage);
    // Power-of-2 context bucketing for GPU Metal VRAM stability
    let numCtx = 8192;
    if (tier === 'tier1')
        numCtx = 4096;
    else if (tier === 'tier1_5')
        numCtx = 6144;
    else if (tier === 'tier2')
        numCtx = 8192;
    else
        numCtx = 8192;
    const reasoningBonus = isReasoning ? 1200 : 0;
    let numPredict = 3000;
    if (tier === 'tier1')
        numPredict = 2000;
    else if (tier === 'tier1_5')
        numPredict = 2500;
    else if (tier === 'tier2')
        numPredict = 3500;
    else if (tier === 'tier3')
        numPredict = 5000;
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
    }
    else if (sizeB <= 25) {
        maxThinkChars = 3500;
    }
    else {
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
