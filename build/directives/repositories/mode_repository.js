export class ModeRepository {
    modeMap = new Map();
    getModeDirective(modeKey) {
        return this.modeMap.get(modeKey);
    }
    getMode(modeKey) {
        return this.modeMap.get(modeKey);
    }
    getAllModes() {
        return Array.from(this.modeMap.values());
    }
    registerMode(item) {
        this.modeMap.set(item.modeKey, item);
    }
    resolveModeFromComplexity(complexityScore, paramSizeB) {
        const autoModes = Array.from(this.modeMap.values()).filter(m => m.modeKey !== 'unrestricted' && m.modeKey !== 'verses_only');
        const sorted = autoModes.sort((a, b) => a.complexityMin - b.complexityMin);
        for (const m of sorted) {
            if (complexityScore >= m.complexityMin && complexityScore <= m.complexityMax) {
                if (paramSizeB && paramSizeB <= 8.5 && m.modeKey === 'deep') {
                    return 'detailed';
                }
                return m.modeKey;
            }
        }
        return 'medium';
    }
    clear() {
        this.modeMap.clear();
    }
}
