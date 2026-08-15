import { extractModelParamSizeB } from "../capabilities.js";
export const CONTEXT_WINDOW_PROFILES = {
    ctx_4k: {
        key: 'ctx_4k',
        maxWindowTokens: 4096,
        defaultMcpBudgetTokens: 1000,
        minMcpBudgetTokens: 600,
        maxMcpBudgetTokens: 1200,
        targetTier: 'tier1',
        description: 'Local Edge / Small Language Models (<= 8.5B)'
    },
    ctx_8k: {
        key: 'ctx_8k',
        maxWindowTokens: 8192,
        defaultMcpBudgetTokens: 2000,
        minMcpBudgetTokens: 1200,
        maxMcpBudgetTokens: 2500,
        targetTier: 'tier2',
        description: 'Standard Inference Window (8K - 16K)'
    },
    ctx_32k: {
        key: 'ctx_32k',
        maxWindowTokens: 32768,
        defaultMcpBudgetTokens: 4500,
        minMcpBudgetTokens: 2500,
        maxMcpBudgetTokens: 6500,
        targetTier: 'tier3',
        description: 'IDE Assistant Context (Trae, Cursor, Windsurf, Cloud Code)'
    },
    ctx_128k_plus: {
        key: 'ctx_128k_plus',
        maxWindowTokens: 131072,
        defaultMcpBudgetTokens: 9000,
        minMcpBudgetTokens: 4000,
        maxMcpBudgetTokens: 16000,
        targetTier: 'tier3',
        description: 'Frontier Cloud & Reasoning Models (Claude 3.5/3.7, GPT-4o, Gemini 2.0, DeepSeek-R1)'
    }
};
export class DynamicTokenBudgetManager {
    /**
     * 🔍 Auto-detects optimal Context Profile from environment and client metadata
     */
    static detectContextProfile(params) {
        const { modelName = '', clientHost = '', numCtx } = params;
        const hostLower = clientHost.toLowerCase();
        const modelLower = modelName.toLowerCase();
        const paramSizeB = extractModelParamSizeB(modelName);
        if (typeof numCtx === 'number' && numCtx > 0) {
            if (numCtx <= 4096)
                return CONTEXT_WINDOW_PROFILES.ctx_4k;
            if (numCtx <= 16384)
                return CONTEXT_WINDOW_PROFILES.ctx_8k;
            if (numCtx <= 65536)
                return CONTEXT_WINDOW_PROFILES.ctx_32k;
            return CONTEXT_WINDOW_PROFILES.ctx_128k_plus;
        }
        if (hostLower.includes('trae') || hostLower.includes('cursor') || hostLower.includes('windsurf') || hostLower.includes('vscode')) {
            return CONTEXT_WINDOW_PROFILES.ctx_32k;
        }
        if (modelLower.includes('claude') ||
            modelLower.includes('gpt-4') ||
            modelLower.includes('gemini') ||
            modelLower.includes('deepseek') ||
            modelLower.includes('o1') ||
            modelLower.includes('o3') ||
            paramSizeB >= 70.0) {
            return CONTEXT_WINDOW_PROFILES.ctx_128k_plus;
        }
        if (paramSizeB <= 8.5 || modelLower.includes('3b') || modelLower.includes('7b') || modelLower.includes('mini')) {
            return CONTEXT_WINDOW_PROFILES.ctx_4k;
        }
        return CONTEXT_WINDOW_PROFILES.ctx_8k;
    }
    /**
      * ⚖️ Computes exact 40 / 20 / 20 / 20 Token Allocation with Elastic Rebalancing
     */
    static calculateAllocation(params) {
        const { profile, mode, hasStrongs, hasCrossrefs, complexityScore, customBudgetCap } = params;
        // 1. Calculate base budget with complexity factor
        const baseBudget = customBudgetCap || profile.defaultMcpBudgetTokens;
        const complexityFactor = 0.85 + (Math.max(0, Math.min(100, complexityScore)) / 100) * 0.30;
        // 2. Bound safely AFTER complexity multiplier (guarantees hardware context envelope)
        let totalUsable = Math.round(baseBudget * complexityFactor);
        totalUsable = Math.max(profile.minMcpBudgetTokens, Math.min(profile.maxMcpBudgetTokens, totalUsable));
        let scripture = Math.floor(totalUsable * 0.40);
        let strongs = Math.floor(totalUsable * 0.20);
        let crossref = Math.floor(totalUsable * 0.20);
        let directive = Math.floor(totalUsable * 0.20);
        // Elastic Surplus Rebalancing
        if (mode === 'verses_only') {
            const surplus = strongs + Math.floor(directive * 0.75);
            strongs = 0;
            directive = Math.floor(directive * 0.25);
            scripture += Math.floor(surplus * 0.85);
            crossref += Math.floor(surplus * 0.15);
        }
        else if (!hasStrongs && !hasCrossrefs) {
            const surplus = strongs + crossref;
            strongs = 0;
            crossref = 0;
            scripture += Math.floor(surplus * 0.65);
            directive += Math.floor(surplus * 0.35);
        }
        else if (!hasStrongs) {
            const surplus = strongs;
            strongs = 0;
            scripture += Math.floor(surplus * 0.60);
            crossref += Math.floor(surplus * 0.40);
        }
        else if (!hasCrossrefs) {
            const surplus = crossref;
            crossref = 0;
            scripture += Math.floor(surplus * 0.70);
            strongs += Math.floor(surplus * 0.30);
        }
        // Zero-drift remainder allocation: assigns integer rounding remainder to scripture
        const allocated = scripture + strongs + crossref + directive;
        if (allocated < totalUsable) {
            scripture += (totalUsable - allocated);
        }
        return { scripture, strongs, crossref, directive, totalUsable };
    }
}
export class NeuralThinkingEngine {
    /**
     * 🧠 Builds Chain-of-Thought (CoT) thinking protocol for reasoning LLMs
     */
    static buildThinkingGuidance(isReasoningModel, language = 'ukr') {
        if (!isReasoningModel)
            return '';
        const isUkr = language === 'ukr' || language === 'uk';
        if (isUkr) {
            return `\n[ПРОТОКОЛ МИСЛЕННЯ REASONING (CoT) ДЛЯ <think>]:
1. Канонічна фіксація: Перевір наведені вірші у першоджерелі (UBIO / Огієнко). Заборонено модифікувати текст цитати.
2. Етимологічний контроль: Співстав поняття з грецьким (LXX / NT) чи єврейським (Tanakh) значенням без секулярного спотворення.
3. Доктринальна гармонія: Забезпеч цілісність відповіді у світлі загальнохристиянського консенсусу (символи віри).
4. Пастирська чуйність: Якщо warmth >= 70%, виключи менторську сухість; формулюй думку зі співчуттям, підбадьоренням і духовною надією.
5. Форматування: Переконайся у валідності Markdown та додай кінцевий бейдж метрик.`;
        }
        return `\n[REASONING CHAIN-OF-THOUGHT PROTOCOL FOR <think>]:
1. Canonical Verification: Verify retrieved verses against primary textual witnesses. Quote text verbatim.
2. Linguistic Scrutiny: Validate Greek/Hebrew lemmas without anachronistic modern semantic drift.
3. Doctrinal Harmony: Anchor exposition in historic ecumenical consensus.
4. Pastoral Calibration: Balance doctrinal truth with restorative warmth and grace.
5. Markdown Validation: Enforce clean Markdown blockquotes and localized telemetry footer.`;
    }
    /**
     * 🛡️ Generates zero-leakage telemetry footers
     */
    static generateTelemetryFooter(params) {
        const { showMetrics, complexityScore, effectiveMode, accuracyScore, language = 'ukr' } = params;
        if (!showMetrics)
            return '';
        const isUkr = language === 'ukr' || language === 'uk';
        const complexityTitle = isUkr ? "Складність" : "Complexity";
        const modeTitle = isUkr ? "Режим" : "Mode";
        const accuracyTitle = isUkr ? "Точність" : "Accuracy";
        const badge = `📊 **${complexityTitle}:** \`${complexityScore}/100\` | ⚖️ **${modeTitle}:** \`${effectiveMode}\` | 🛡️ **${accuracyTitle}:** \`${accuracyScore}\``;
        const machineTag = `[[METRICS: complexity=${complexityScore}; mode=${effectiveMode}; accuracy=${accuracyScore}]]`;
        return `\n---\n${badge}\n<!-- ${machineTag} -->`;
    }
}
