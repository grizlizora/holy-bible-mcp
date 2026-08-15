/**
 * 🎛️ Sensitivity & Pastoral Warmth Directive Resolver
 */
export function getSensitivityDirective(score = 80) {
    let label = "Висока Чутливість (Любов/Душа)";
    let directive = "Надавай максимально теплу, підтримуючу та пастирську відповідь, фокусуючись на надії, милосерді та живій вірі.";
    if (score < 40) {
        label = "Аналітичний/Строгий Стиль";
        directive = "Надавай точну, академічну та суху богословську відповідь із чітким етимологічним аналізом без емоційних вступів.";
    }
    else if (score < 70) {
        label = "Збалансований Стиль";
        directive = "Поєднуй богословську точність із практичним життєвим застосуванням.";
    }
    return { score, label, directive };
}
/**
 * 🧠 Maps complexity score to optimal response mode with model tier capacity awareness
 */
export function deriveModeFromComplexity(complexityScore, paramSizeB) {
    if (complexityScore < 30)
        return "minimal";
    if (complexityScore < 50)
        return "short";
    if (complexityScore < 68)
        return "medium";
    if (complexityScore < 80)
        return "detailed";
    // Tier 1 safety guard: for compact models (<=8.5B), auto-cap at 'detailed' to prevent context blowout/looping
    if (typeof paramSizeB === 'number' && paramSizeB <= 8.5) {
        return "detailed";
    }
    return "deep";
}
/**
 * 🎯 Resolves effective mode taking user prompt semantics, tier limits, and manual overrides into account
 */
export function resolveEffectiveMode(currentModeKey, promptComplexityScore = 50, userPrompt = '', paramSizeB) {
    const normKey = (currentModeKey || 'auto').toLowerCase().trim();
    if (normKey && normKey !== "auto") {
        return normKey;
    }
    const lower = (userPrompt || '').toLowerCase().trim();
    if (/(?:дай|покажи|знайди|список|наведи|текст|цитати)\s+(?:вірш[івіам]?|цитат[иа]?|писанн?я|біблійн[их|і])/i.test(lower) ||
        /(?:verses\s+only|only\s+verses|list\s+of\s+verses|show\s+verses|find\s+verses|scriptures\s+on)/i.test(lower)) {
        return "verses_only";
    }
    return deriveModeFromComplexity(promptComplexityScore, paramSizeB);
}
