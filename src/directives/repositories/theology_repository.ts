export interface PatristicCommentary {
  id?: number;
  book: string;
  chapter: number;
  verse: number;
  author: string;
  era?: string;
  commentary_text: string;
}

export interface SemanticConcept {
  id?: number;
  concept_key?: string;
  concept_name: string;
  keywords: string;
  book: string;
  chapter: number;
  verse: number;
  theological_principle: string;
}

export class TheologyRepository {
  public translationsMap = new Map<string, any>();
  public trenchMap = new Map<string, any>();
  public propheciesList: any[] = [];
  public thematicChainsMap = new Map<string, any[]>();
  public metadataMap = new Map<string, any>();
  public commentariesList: PatristicCommentary[] = [];
  public semanticConceptsList: SemanticConcept[] = [];

  public getTranslations(): Record<string, any> {
    const obj: Record<string, any> = {};
    for (const [k, v] of this.translationsMap.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  public getTranslation(id: string): any {
    return this.translationsMap.get(id.toUpperCase());
  }

  public getTrenchSynonym(strongsId: string): any {
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

  public getMessianicProphecies(topic?: string): any[] {
    if (!topic) return this.propheciesList;
    return this.propheciesList.filter(p => (p.topic || "").toLowerCase().includes(topic.toLowerCase()));
  }

  public getThematicChain(theme: string): any[] {
    return this.thematicChainsMap.get(theme) || [];
  }

  public getServerMetadata(key: string): any {
    return this.metadataMap.get(key);
  }

  public getCommentaries(book: string, chapter: number, verse: number): PatristicCommentary[] {
    const upperBook = book.toUpperCase();
    return this.commentariesList.filter(
      (c) => c.book.toUpperCase() === upperBook && c.chapter === chapter && c.verse === verse
    );
  }

  public getSemanticConcepts(query: string, limit = 5): SemanticConcept[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.semanticConceptsList.slice(0, limit);
    return this.semanticConceptsList
      .filter(
        (sc) =>
          sc.concept_name.toLowerCase().includes(q) ||
          sc.keywords.toLowerCase().includes(q) ||
          (sc.theological_principle && sc.theological_principle.toLowerCase().includes(q))
      )
      .slice(0, limit);
  }

  public clear(): void {
    this.translationsMap.clear();
    this.trenchMap.clear();
    this.propheciesList = [];
    this.thematicChainsMap.clear();
    this.metadataMap.clear();
    this.commentariesList = [];
    this.semanticConceptsList = [];
  }
}
