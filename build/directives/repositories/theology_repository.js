export class TheologyRepository {
    translationsMap = new Map();
    trenchMap = new Map();
    propheciesList = [];
    thematicChainsMap = new Map();
    metadataMap = new Map();
    commentariesList = [];
    semanticConceptsList = [];
    getTranslations() {
        const obj = {};
        for (const [k, v] of this.translationsMap.entries()) {
            obj[k] = v;
        }
        return obj;
    }
    getTranslation(id) {
        return this.translationsMap.get(id.toUpperCase());
    }
    getTrenchSynonym(strongsId) {
        const clean = strongsId.toUpperCase();
        if (this.trenchMap.has(clean)) {
            return this.trenchMap.get(clean);
        }
        const letter = clean[0] || "G";
        const num = parseInt(clean.slice(1), 10);
        if (!isNaN(num)) {
            const padded = letter + String(num).padStart(4, "0");
            const unpadded = letter + String(num);
            return this.trenchMap.get(padded) || this.trenchMap.get(unpadded);
        }
        return undefined;
    }
    getMessianicProphecies(topic) {
        if (!topic)
            return this.propheciesList;
        return this.propheciesList.filter(p => (p.topic || "").toLowerCase().includes(topic.toLowerCase()));
    }
    getThematicChain(theme) {
        return this.thematicChainsMap.get(theme) || [];
    }
    getServerMetadata(key) {
        return this.metadataMap.get(key);
    }
    getCommentaries(book, chapter, verse) {
        const upperBook = book.toUpperCase();
        return this.commentariesList.filter((c) => c.book.toUpperCase() === upperBook && c.chapter === chapter && c.verse === verse);
    }
    getSemanticConcepts(query, limit = 5) {
        const q = query.toLowerCase().trim();
        if (!q)
            return this.semanticConceptsList.slice(0, limit);
        return this.semanticConceptsList
            .filter((sc) => sc.concept_name.toLowerCase().includes(q) ||
            sc.keywords.toLowerCase().includes(q) ||
            (sc.theological_principle && sc.theological_principle.toLowerCase().includes(q)))
            .slice(0, limit);
    }
    clear() {
        this.translationsMap.clear();
        this.trenchMap.clear();
        this.propheciesList = [];
        this.thematicChainsMap.clear();
        this.metadataMap.clear();
        this.commentariesList = [];
        this.semanticConceptsList = [];
    }
}
