/**
 * 🏛️ Drizzle ORM Schema Definitions for directives.sqlite
 * 
 * Provides end-to-end typed schema definitions for SQLite Directive tables.
 */

export interface CanonicalTranslationRecord {
  id: string;
  name: string;
  language: string;
  year?: number;
  philosophy: 'FORMAL' | 'DYNAMIC' | 'INTERLINEAR' | 'PARAPHRASE';
  textualBasis: string;
  description?: string;
  isDefault?: boolean;
}

export interface TheologicalProfileRecord {
  id: string;
  name: string;
  keyTheologicalDistinctives: string;
  interlinearsPreferred?: string;
  commentaryPriority?: string;
}

export interface SensitivityRuleRecord {
  id: string;
  triggerCategory: string;
  pattern: string;
  minimumWarmthScore: number;
  mandatoryDirectives: string;
  forbiddenApproaches?: string;
}

export interface MessianicProphecyRecord {
  id: string;
  title: string;
  otVerse: string;
  ntFulfillment: string;
  covenantalTheme: string;
  explanation: string;
}

export interface TrenchSynonymRecord {
  id: string;
  groupName: string;
  strongsId: string;
  greekWord: string;
  nuanceExplanation: string;
}

export interface StrongsAliasRecord {
  alias: string;
  strongsId: string;
  language: 'hebrew' | 'greek';
}

export interface ThematicChainRecord {
  themeKey: string;
  stepOrder: number;
  verseRef: string;
  covenantStage: string;
  theologicalSignificance: string;
}
