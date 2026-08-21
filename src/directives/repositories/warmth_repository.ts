import { WarmthDirective, WarmthLevelKey } from "../types.js";

export class WarmthRepository {
  public warmthRanges: WarmthDirective[] = [];

  public getAllWarmthRanges(): WarmthDirective[] {
    return this.warmthRanges;
  }

  public registerWarmth(item: WarmthDirective): void {
    this.warmthRanges.push(item);
  }

  public resolveWarmth(score: number, lang = "ukr") {
    const bounded = Math.max(0, Math.min(100, score));
    const matched = this.warmthRanges.find(r => bounded >= r.minScore && bounded <= r.maxScore);
    const langKey = (lang === "eng" || lang === "en") ? "en" : (lang === "ru" ? "ru" : "uk");

    if (!matched) {
      return {
        levelId: "warm" as WarmthLevelKey,
        score: bounded,
        label: langKey === "en" ? "Empathetic Pastoral" : "Теплий та пастирський",
        directive: "Respond with theological grounding, empathy, and pastoral warmth.",
        tempDeltaBias: 0.1,
        icon: "heart"
      };
    }

    return {
      levelId: matched.levelId,
      score: bounded,
      label: (matched.labels as any)?.[langKey] || (matched.labels as any)?.uk || "Пастирський",
      directive: (matched.directives as any)?.[langKey] || (matched.directives as any)?.uk || "",
      tempDeltaBias: matched.tempDeltaBias || 0,
      icon: matched.iconName || "heart"
    };
  }

  public clear(): void {
    this.warmthRanges = [];
  }
}
