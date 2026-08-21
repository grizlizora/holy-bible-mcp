/**
 * 🎯 Capabilities Facade (capabilities.ts)
 * 
 * Modular re-export facade uniting:
 * - ModelParamExtractor
 * - ModelTierMatrix
 * - AdaptiveBudgetEngine
 */

export * from './capabilities/types.js';
export { extractModelParamSizeB } from './capabilities/model_param_extractor.js';
export { resolveModelTier, resolveModelTier as getModelTier } from './capabilities/model_tier_matrix.js';
export {
  isSmallModelByParamSize,
  detectModelFamily,
  estimatePromptComplexity,
  computeAdaptiveModelBudget
} from './capabilities/adaptive_budget_engine.js';
