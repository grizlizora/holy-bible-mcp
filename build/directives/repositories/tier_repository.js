export class TierRepository {
    tierMap = new Map();
    tierRanges = [];
    getTierDirective(tierKey) {
        return this.tierMap.get(tierKey);
    }
    resolveTierByParamSize(paramSizeB) {
        const sorted = [...this.tierRanges].sort((a, b) => a.minParamSizeB - b.minParamSizeB);
        for (const t of sorted) {
            if (paramSizeB >= t.minParamSizeB && (t.maxParamSizeB === null || paramSizeB <= t.maxParamSizeB)) {
                return t;
            }
        }
        return sorted[sorted.length - 1] || this.getFallbackTier();
    }
    registerTier(item) {
        this.tierMap.set(item.tierId, item);
        this.tierRanges.push(item);
    }
    clear() {
        this.tierMap.clear();
        this.tierRanges = [];
    }
    getFallbackTier() {
        return {
            tierId: "tier1",
            nameDisplay: "Standard Small (0–4B)",
            minParamSizeB: 0,
            maxParamSizeB: 4.5,
            defaultNumCtx: 4096,
            defaultNumPredict: 1024,
            minP: 0.05,
            baseTemp: 0.4,
            topP: 0.9,
            repeatPenalty: 1.1,
            frequencyPenalty: 0.1,
            presencePenalty: 0.0,
            repeatLastN: 64,
            maxThinkChars: 400,
            supportsCot: false,
            maxAllowedMode: "short",
            systemDirective: "Concise standard reasoning for low-parameter models.",
            thinkingDirective: "Direct answer without nested reasoning tags."
        };
    }
}
