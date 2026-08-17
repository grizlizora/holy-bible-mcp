export class TierResolver {
    tierMap = new Map();
    tierRanges = [];
    getTierDirective(tierKey) {
        return this.tierMap.get(tierKey);
    }
    resolveTierByParamSize(paramSizeB) {
        for (const range of this.tierRanges) {
            const max = range.maxParamSizeB ?? Infinity;
            if (paramSizeB >= range.minParamSizeB && paramSizeB < max) {
                return range;
            }
        }
        return this.tierMap.get('tier1') || this.tierRanges[0] || this.getFallbackTier();
    }
    getFallbackTier() {
        return {
            tierId: 'tier1',
            nameDisplay: 'Compact Mobile/Desktop Model',
            minParamSizeB: 0,
            maxParamSizeB: 4,
            defaultNumCtx: 4096,
            defaultNumPredict: 512,
            minP: 0.05,
            baseTemp: 0.3,
            topP: 0.85,
            repeatPenalty: 1.15,
            frequencyPenalty: 0.0,
            presencePenalty: 0.0,
            repeatLastN: 64,
            maxThinkChars: 0,
            supportsCot: false,
            maxAllowedMode: 'short',
            systemDirective: 'Concise pastoral & theological mode',
            thinkingDirective: ''
        };
    }
}
