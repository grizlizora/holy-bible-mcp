export interface RrfParams {
  wLex: number;
  wVec: number;
  k: number;
}

export class RrfCalculator {
  public static detectSearchIntent(query: string, mode?: string): RrfParams {
    if (mode === "exact" || /^[\"«].+[»\"]$/.test(query.trim())) {
      return { wLex: 0.85, wVec: 0.15, k: 12 };
    }
    if (mode === "semantic") {
      return { wLex: 0.20, wVec: 0.80, k: 35 };
    }

    const lower = query.toLowerCase();
    const pastoralTriggers = ["страх", "тривог", "депрес", "самотн", "гнів", "біль", "помер", "горе", "anxiety", "fear", "grief"];
    if (pastoralTriggers.some(t => lower.includes(t))) {
      return { wLex: 0.25, wVec: 0.75, k: 25 };
    }

    return { wLex: 0.50, wVec: 0.50, k: 20 };
  }

  public static computeScore(
    ftsRank: number,
    bm25Score: number,
    params: RrfParams
  ): number {
    const { wLex, wVec, k } = params;
    const bm25Raw = typeof bm25Score === "number" && !isNaN(bm25Score) ? Math.abs(bm25Score) : 1;
    const lexicalScore = wLex * (1 / (k + ftsRank));
    const vectorScore = wVec * (1 / (k + Math.max(1, Math.round(ftsRank / (bm25Raw > 0 ? bm25Raw : 1)))));
    return parseFloat((lexicalScore + vectorScore).toFixed(4));
  }
}
