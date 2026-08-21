export class TelemetryCalculator {
  public static parseParamSize(val: any): number | null {
    if (typeof val === 'number' && !isNaN(val) && val > 0) return val;
    if (typeof val === 'string' && val.trim()) {
      const clean = val.trim().toLowerCase();
      const parsed = parseFloat(clean);
      if (!isNaN(parsed) && parsed > 0) {
        return clean.includes('m') ? Math.round((parsed / 1000) * 100) / 100 : parsed;
      }
    }
    return null;
  }

  public static computeAccuracy(
    hasVerses: boolean,
    tierId: string,
    effectiveMode: string
  ): string {
    const isTier3 = tierId === 'tier3';
    const isTier2 = tierId === 'tier2';
    const isTier1_5 = tierId === 'tier1_5';
    let accuracyNum = 96.5;
    const effMode = (effectiveMode || 'medium').toLowerCase();

    if (hasVerses) {
      if (effMode === 'verses_only') {
        accuracyNum = isTier3 ? 99.9 : isTier2 ? 99.5 : isTier1_5 ? 99.0 : 98.5;
      } else if (effMode === 'deep' || effMode === 'detailed') {
        accuracyNum = isTier3 ? 99.9 : isTier2 ? 99.0 : isTier1_5 ? 98.0 : 97.0;
      } else if (effMode === 'short' || effMode === 'minimal') {
        accuracyNum = isTier3 ? 99.5 : isTier2 ? 98.5 : isTier1_5 ? 97.0 : 95.5;
      } else {
        accuracyNum = isTier3 ? 99.9 : isTier2 ? 99.0 : isTier1_5 ? 97.5 : 96.5;
      }
    } else {
      accuracyNum = isTier3 ? 95.0 : isTier2 ? 92.0 : isTier1_5 ? 90.0 : 88.0;
    }

    return `${accuracyNum}%`;
  }
}
