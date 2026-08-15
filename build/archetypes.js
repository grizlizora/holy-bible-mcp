import { DirectiveStore } from "./directives/directive_store.js";
/**
 * 🎛️ Sensitivity & Pastoral Warmth Directive Resolver (Zero-latency SQLite lookup)
 */
export function getSensitivityDirective(score = 80, lang = 'uk') {
    const store = DirectiveStore.getInstance();
    const res = store.resolveWarmth(score, lang);
    return {
        score: res.score,
        label: res.label,
        directive: res.directive
    };
}
/**
 * 🧠 Maps complexity score to optimal response mode with model tier capacity awareness via SQLite
 */
export function deriveModeFromComplexity(complexityScore, paramSizeB) {
    const store = DirectiveStore.getInstance();
    return store.resolveModeFromComplexity(complexityScore, paramSizeB);
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
