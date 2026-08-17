/**
 * Open-Source Theological Knowledge Tables Loaded from SQLite Directives DB
 */
export class TheologicalKnowledgeStore {
    translationsMap = new Map();
    trenchMap = new Map();
    propheciesList = [];
    thematicChainsMap = new Map();
    metadataMap = new Map();
    getTranslations() {
        const result = {};
        for (const [k, v] of this.translationsMap.entries()) {
            result[k] = v;
        }
        return result;
    }
    getTranslation(id) {
        return this.translationsMap.get(id.toUpperCase());
    }
    getTrenchSynonym(strongsId) {
        const norm = strongsId.trim().toUpperCase();
        const letter = norm[0] || 'G';
        const numPart = parseInt(norm.slice(1), 10) || 1;
        const padded = letter + String(numPart).padStart(4, '0');
        const raw = letter + String(numPart);
        return this.trenchMap.get(padded) || this.trenchMap.get(raw) || this.trenchMap.get(norm);
    }
    getMessianicProphecies(topic) {
        if (!topic || topic === 'all')
            return [...this.propheciesList];
        const clean = topic.toLowerCase();
        return this.propheciesList.filter(p => p.topic.toLowerCase().includes(clean) ||
            p.prophecy.osis.toLowerCase().includes(clean) ||
            p.fulfillment.osis.toLowerCase().includes(clean));
    }
    getThematicChain(theme) {
        const clean = theme.toLowerCase();
        for (const [k, list] of this.thematicChainsMap.entries()) {
            if (clean.includes(k) || k.includes(clean))
                return list;
        }
        return [];
    }
    getServerMetadata(key) {
        return this.metadataMap.get(key);
    }
}
