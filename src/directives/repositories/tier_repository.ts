import { ModelTierDirective, ModelTierKey, ModeKey } from "../types.js";

export class TierRepository {
  public tierMap = new Map<ModelTierKey, ModelTierDirective>();
  public tierRanges: ModelTierDirective[] = [];

  public getTierDirective(tierKey: ModelTierKey): ModelTierDirective | undefined {
    return this.tierMap.get(tierKey);
  }

  public resolveTierByParamSize(paramSizeB: number): ModelTierDirective {
    const sorted = [...this.tierRanges].sort((a, b) => a.minParamSizeB - b.minParamSizeB);
    for (const t of sorted) {
      if (paramSizeB >= t.minParamSizeB && (t.maxParamSizeB === null || paramSizeB <= t.maxParamSizeB)) {
        return t;
      }
    }
    return sorted[sorted.length - 1] || this.getFallbackTier();
  }

  public registerTier(item: ModelTierDirective): void {
    this.tierMap.set(item.tierId, item);
    this.tierRanges.push(item);
  }

  public clear(): void {
    this.tierMap.clear();
    this.tierRanges = [];
  }

  public getFallbackTier(): ModelTierDirective {
    return {
      tierId: "tier1",
      nameDisplay: "Standard Small (0–4B)",
      minParamSizeB: 0,
      maxParamSizeB: 4.5,
      defaultNumCtx: 4096,
      defaultNumPredict: 1024,
      minP: 0.05,
      baseTemp: 0.4,
      topP: 0.9,
      repeatPenalty: 1.1,
      frequencyPenalty: 0.1,
      presencePenalty: 0.0,
      repeatLastN: 64,
      maxThinkChars: 400,
      supportsCot: false,
      maxAllowedMode: "short" as ModeKey,
      systemDirective: "Concise standard reasoning for low-parameter models.",
      thinkingDirective: "Direct answer without nested reasoning tags."
    };
  }
}
