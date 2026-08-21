export interface ModelCapabilities {
  supportsImages: boolean;
  supportsAudio: boolean;
  supportsVideo: boolean;
  parameterSize?: number | null;
  isSmallModel?: boolean;
  isReasoningModel?: boolean;
  supportsThinking?: boolean;
}

export interface PromptComplexityResult {
  score: number;
  level: 'simple' | 'moderate' | 'deep' | 'unthrottled';
  multiplier: number;
  reason: string;
}

export type LLMFamily = 'qwen' | 'phi' | 'llama' | 'deepseek' | 'gemma' | 'generic';

export type ModelTier = 'tier1' | 'tier1_5' | 'tier2' | 'tier3';

export interface AdaptiveBudget {
  numCtx: number;
  numPredict: number;
  temperature: number;
  topP: number;
  minP: number;
  repeatPenalty: number;
  frequencyPenalty: number;
  presencePenalty: number;
  repeatLastN: number;
  maxThinkChars: number;
  parameterSizeB: number;
  family: LLMFamily;
  complexity: PromptComplexityResult;
  tier: ModelTier;
}
