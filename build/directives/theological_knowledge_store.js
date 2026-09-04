/**
 * 🏛️ TheologicalKnowledgeStore — Facade for loaded Directives Database
 */
import { DirectiveStore } from "./directive_store.js";
export class TheologicalKnowledgeStore {
    static instance;
    static getInstance() {
        if (!TheologicalKnowledgeStore.instance) {
            TheologicalKnowledgeStore.instance = new TheologicalKnowledgeStore();
        }
        return TheologicalKnowledgeStore.instance;
    }
    getTranslations() {
        return DirectiveStore.getInstance().getTranslations();
    }
    getTranslation(id) {
        return DirectiveStore.getInstance().getTranslation(id);
    }
    getTrenchSynonym(strongsId) {
        return DirectiveStore.getInstance().getTrenchSynonym(strongsId);
    }
    getMessianicProphecies(topic) {
        return DirectiveStore.getInstance().getMessianicProphecies(topic);
    }
    getThematicChain(theme) {
        return DirectiveStore.getInstance().getThematicChain(theme);
    }
    getServerMetadata(key) {
        return DirectiveStore.getInstance().getServerMetadata(key);
    }
}
