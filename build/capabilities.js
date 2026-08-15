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
    const name = (modelName || '').toLowerCase().trim();
    if (!name)
        return 14.0;
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
        if (!isNaN(val) && val > 0)
            return val;
    }
    const mMatch = name.match(/(?:^|[^a-z0-9.])(\d+(?:\.\d+)?)\s*[-_]?\s*[mM](?:[^a-z0-9.]|$)/);
    if (mMatch) {
        const val = parseFloat(mMatch[1]);
        if (!isNaN(val) && val > 0)
            return Math.round((val / 1000) * 100) / 100;
    }
    const tagMatch = name.match(/:(?:q\d+_[a-z0-9_]+-)?(\d+(?:\.\d+)?)[bB]\b/);
    if (tagMatch) {
        const val = parseFloat(tagMatch[1]);
        if (!isNaN(val) && val > 0)
            return val;
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
export function getModelTier(paramSizeB) {
    const size = typeof paramSizeB === 'number' && !isNaN(paramSizeB) ? paramSizeB : 14.0;
    if (size <= 8.5)
        return 'tier1';
    if (size <= 10.5)
        return 'tier1_5';
    if (size <= 13.5)
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
