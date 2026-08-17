/**
 * Warmth Directive Resolver
 */
import { WarmthDirective } from "./types.js";

export class WarmthResolver {
  public warmthRanges: WarmthDirective[] = [];

  public resolveWarmth(score: number, lang = 'ukr'): {
    score: number;
    levelId: string;
    label: string;
    directive: string;
    tempDeltaBias: number;
    iconName: string;
  } {
    const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
    let matched = this.warmthRanges.find(r => clampedScore >= r.minScore && clampedScore <= r.maxScore);

    if (!matched && this.warmthRanges.length > 0) {
      matched = this.warmthRanges[0];
    }

    if (!matched) {
      return {
        score: clampedScore,
        levelId: 'warmth_moderate',
        label: clampedScore >= 50 ? 'Пастирська чуйність' : 'Академічна точність',
        directive: 'Збалансований біблійний коментар із точними посиланнями.',
        tempDeltaBias: 0.0,
        iconName: 'HeartHandshake'
      };
    }

    const langKey = lang === 'eng' || lang === 'en' ? 'eng' : (lang === 'ru' ? 'ru' : 'ukr');
    const label = matched.labels[langKey] || matched.labels['ukr'] || matched.labels['eng'] || 'Warmth';
    const directive = matched.directives[langKey] || matched.directives['ukr'] || matched.directives['eng'] || '';

    return {
      score: clampedScore,
      levelId: matched.levelId,
      label,
      directive,
      tempDeltaBias: matched.tempDeltaBias,
      iconName: matched.iconName
    };
  }
}
