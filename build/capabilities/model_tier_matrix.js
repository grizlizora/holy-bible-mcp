/**
 * 🎯 ModelTierMatrix (model_tier_matrix.ts)
 *
 * 4-Tier Model Classification Matrix:
 * - Tier 1 (1B - 7.5B): Fast edge models
 * - Tier 1.5 (8B - 10.5B): High-efficiency balanced models
 * - Tier 2 (11B - 24.5B): Mid-range reasoning models
 * - Tier 3 (25B - 671B+): Flagship MoE and dense reasoning models
 */
export function resolveModelTier(parameterSizeB) {
    if (parameterSizeB <= 8.5)
        return 'tier1';
    if (parameterSizeB <= 10.5)
        return 'tier1_5';
    if (parameterSizeB <= 24.9)
        return 'tier2';
    return 'tier3';
}
