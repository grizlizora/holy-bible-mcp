import { ModeDirective, ModeKey } from "../types.js";

export class ModeRepository {
  public modeMap = new Map<ModeKey, ModeDirective>();

  public getModeDirective(modeKey: ModeKey): ModeDirective | undefined {
    return this.modeMap.get(modeKey);
  }

  public getMode(modeKey: string): ModeDirective | undefined {
    return this.modeMap.get(modeKey as ModeKey);
  }

  public getAllModes(): ModeDirective[] {
    return Array.from(this.modeMap.values());
  }

  public registerMode(item: ModeDirective): void {
    this.modeMap.set(item.modeKey, item);
  }

  public resolveModeFromComplexity(complexityScore: number, paramSizeB?: number): string {
    const autoModes = Array.from(this.modeMap.values()).filter(m => m.modeKey !== 'unrestricted' && m.modeKey !== 'verses_only');
    const sorted = autoModes.sort((a, b) => a.complexityMin - b.complexityMin);
    for (const m of sorted) {
      if (complexityScore >= m.complexityMin && complexityScore <= m.complexityMax) {
        if (paramSizeB && paramSizeB <= 8.5 && m.modeKey === 'deep') {
          return 'detailed';
        }
        return m.modeKey;
      }
    }
    return 'medium';
  }

  public clear(): void {
    this.modeMap.clear();
  }
}
