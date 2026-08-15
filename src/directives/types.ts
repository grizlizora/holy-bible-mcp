export type ModelTierKey = 'tier1' | 'tier1_5' | 'tier2' | 'tier3';
export type ModeKey = 'minimal' | 'short' | 'verses_only' | 'medium' | 'detailed' | 'deep' | 'unrestricted';
export type WarmthLevelKey = 'academic' | 'balanced' | 'warm' | 'deep_love';

export interface ModelTierDirective {
  tierId: ModelTierKey;
  nameDisplay: string;
  minParamSizeB: number;
  maxParamSizeB: number | null;
  defaultNumCtx: number;
  defaultNumPredict: number;
  minP: number;
  baseTemp: number;
  topP: number;
  repeatPenalty: number;
  frequencyPenalty: number;
  presencePenalty: number;
  repeatLastN: number;
  maxThinkChars: number;
  supportsCot: boolean;
  maxAllowedMode: ModeKey;
  systemDirective: string;
  thinkingDirective?: string;
}

export interface ModeDirective {
  modeKey: ModeKey;
  displayNames: Record<string, string>;
  descriptions: Record<string, string>;
  iconName: string;
  minWords: number;
  maxWords: number | null;
  maxVerses: number;
  complexityMin: number;
  complexityMax: number;
  structureMandate: string;
  templateBody: string;
  accuracyMatrix: {
    tier1: number;
    tier1_5: number;
    tier2: number;
    tier3: number;
  };
}

export interface WarmthDirective {
  levelId: WarmthLevelKey;
  minScore: number;
  maxScore: number;
  iconName: string;
  tempDeltaBias: number;
  labels: Record<string, string>;
  directives: Record<string, string>;
}

export interface MetricsSchema {
  languageCode: string;
  complexityTitle: string;
  modeTitle: string;
  accuracyTitle: string;
  badgeTemplate: string;
}

export interface PromptModule {
  moduleId: string;
  category: string;
  content: string;
  tags: string[];
}
