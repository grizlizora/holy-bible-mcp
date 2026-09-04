/**
 * 🏛️ TheologicalKnowledgeStore — Facade for loaded Directives Database
 */

import { DirectiveStore } from "./directive_store.js";

export class TheologicalKnowledgeStore {
  private static instance: TheologicalKnowledgeStore;

  public static getInstance(): TheologicalKnowledgeStore {
    if (!TheologicalKnowledgeStore.instance) {
      TheologicalKnowledgeStore.instance = new TheologicalKnowledgeStore();
    }
    return TheologicalKnowledgeStore.instance;
  }

  public getTranslations(): Record<string, any> {
    return DirectiveStore.getInstance().getTranslations();
  }

  public getTranslation(id: string): any {
    return DirectiveStore.getInstance().getTranslation(id);
  }

  public getTrenchSynonym(strongsId: string): any {
    return DirectiveStore.getInstance().getTrenchSynonym(strongsId);
  }

  public getMessianicProphecies(topic?: string): any[] {
    return DirectiveStore.getInstance().getMessianicProphecies(topic);
  }

  public getThematicChain(theme: string): any[] {
    return DirectiveStore.getInstance().getThematicChain(theme);
  }

  public getServerMetadata(key: string): any {
    return DirectiveStore.getInstance().getServerMetadata(key);
  }
}
