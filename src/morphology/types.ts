export interface MorphologyBreakdown {
  code: string;
  pos: string;
  stem?: string;
  tense?: string;
  voice?: string;
  mood?: string;
  person?: string;
  number?: string;
  gender?: string;
  caseGrammatical?: string;
  state?: string;
  description: string;
}

export interface InterlinearWordToken {
  order: number;
  surface: string;
  unaccented: string;
  transliteration: string;
  lemma: string;
  strongsId: string | null;
  gloss: string;
  morphology?: MorphologyBreakdown;
}

export interface InterlinearVerseResult {
  reference: {
    osis: string;
    book: string;
    chapter: number;
    verse: number;
    language: string;
    direction: 'rtl' | 'ltr';
  };
  parallelVerse?: {
    translation: string;
    text: string;
  };
  wordsCount: number;
  words: InterlinearWordToken[];
  theologicalNotes?: string[];
}

export interface StrongsEtymologyResult {
  strongsId: string;
  language: string;
  lemma: string;
  transliteration: string;
  pronunciation: string;
  strongsDefinition: string;
  kjvDistribution?: Record<string, number>;
  detailedLexicon?: string;
  derivation?: string;
  rootStrongsId?: string | null;
  trenchSynonyms?: {
    group: string;
    distinction: string;
    theologicalSignificance: string;
  };
  hebrewGreekCounterpart?: {
    strongsId: string;
    lemma: string;
    transliteration: string;
  };
  sampleOccurrences?: Array<{
    ref: string;
    text: string;
  }>;
}
