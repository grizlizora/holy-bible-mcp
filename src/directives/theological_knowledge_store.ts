/**
 * Open-Source Theological Knowledge Tables Loaded from SQLite Directives DB
 */

export class TheologicalKnowledgeStore {
  public translationsMap = new Map<string, any>();
  public trenchMap = new Map<string, any>();
  public propheciesList: any[] = [];
  public thematicChainsMap = new Map<string, any[]>();
  public metadataMap = new Map<string, any>();

  public getTranslations(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [k, v] of this.translationsMap.entries()) {
      result[k] = v;
    }
    return result;
  }

  public getTranslation(id: string): any {
    return this.translationsMap.get(id.toUpperCase());
  }

  public getTrenchSynonym(strongsId: string): any {
    const norm = strongsId.trim().toUpperCase();
    const letter = norm[0] || 'G';
    const numPart = parseInt(norm.slice(1), 10) || 1;
    const padded = letter + String(numPart).padStart(4, '0');
    const raw = letter + String(numPart);
    return this.trenchMap.get(padded) || this.trenchMap.get(raw) || this.trenchMap.get(norm);
  }

  public getMessianicProphecies(topic?: string): any[] {
    if (!topic || topic === 'all') return [...this.propheciesList];
    const clean = topic.toLowerCase();
    return this.propheciesList.filter(p => 
      p.topic.toLowerCase().includes(clean) || 
      p.prophecy.osis.toLowerCase().includes(clean) || 
      p.fulfillment.osis.toLowerCase().includes(clean)
    );
  }

  public getThematicChain(theme: string): any[] {
    const clean = theme.toLowerCase();
    for (const [k, list] of this.thematicChainsMap.entries()) {
      if (clean.includes(k) || k.includes(clean)) return list;
    }
    return [];
  }

  public getServerMetadata(key: string): any {
    return this.metadataMap.get(key);
  }
}
