export class UkrainianMorphologyEngine {
  private static readonly IRREGULAR_VERB_MAP: Record<string, string[]> = {
    "бути": ["є", "був", "була", "було", "були", "буде", "будуть", "єсь", "бувши", "будемо"],
    "іти": ["йшов", "йшла", "йшло", "йшли", "іду", "ідеш", "іде", "ідемо", "ідуть", "пішов", "пішла", "пішли", "піде"],
    "дати": ["дам", "даси", "дасть", "дамо", "дасте", "дадуть", "давай", "дав", "дала"],
    "їсти": ["їм", "їси", "їсть", "їмо", "їсте", "їдять", "їв", "їла"],
    "могти": ["можу", "можеш", "може", "можемо", "можуть", "міг", "могла", "могли"]
  };

  private static readonly INVERTED_IRREGULAR_MAP: Map<string, string> = (() => {
    const map = new Map<string, string>();
    for (const [lemma, forms] of Object.entries(UkrainianMorphologyEngine.IRREGULAR_VERB_MAP)) {
      map.set(lemma, lemma);
      for (const form of forms) {
        map.set(form, lemma);
      }
    }
    return map;
  })();

  private static readonly MULTI_ADJ_ENDINGS = /(?:ньому|ського|цького|ськими|цькими|шими|ими|іми|ого|ього|ому|им|ім|их|іх|ої|ьої|ій)$/iu;
  private static readonly MULTI_NOUN_ENDINGS = /(?:ами|ями|ові|еві|єві|ою|ею|єю|ів|ев|єв|ей|ам|ям|ом|ем|єм|ах|ях)$/iu;
  private static readonly MULTI_VERB_ENDINGS = /(?:вшись|чись|тесь|тися|ться|тиму|тиме|тимеш|тимуть|лися|лась|лись|лося|ли|ла|ло|ти|ть)$/iu;
  private static readonly SINGLE_ENDINGS = /(?:[аяеєиіїуюо])$/iu;

  public static normalizeOrthography(text: string): string {
    return text
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’ʼ`"]/g, "'")
      .replace(/ґ/g, "г");
  }

  public static extractStem(word: string): string {
    let w = this.normalizeOrthography(word);

    // 1. Check irregular verbs first (O(1) static lookup)
    const irregular = this.INVERTED_IRREGULAR_MAP.get(w);
    if (irregular) return irregular;

    if (w.length <= 3) return w;

    w = w.replace(/(?:ся|сь)$/iu, "");

    // 2. Multi-character inflectional suffixes (longest match first)
    if (this.MULTI_ADJ_ENDINGS.test(w)) {
      w = w.replace(this.MULTI_ADJ_ENDINGS, "");
    } else if (this.MULTI_NOUN_ENDINGS.test(w)) {
      w = w.replace(this.MULTI_NOUN_ENDINGS, "");
    } else if (this.MULTI_VERB_ENDINGS.test(w)) {
      w = w.replace(this.MULTI_VERB_ENDINGS, "");
    } else if (this.SINGLE_ENDINGS.test(w)) {
      w = w.replace(this.SINGLE_ENDINGS, "");
    }

    return w.length >= 2 ? w : word.toLowerCase();
  }

  public static generateFtsQuery(rawQuery: string): string {
    const tokens = rawQuery.trim().split(/\s+/).filter(t => t.length > 0);
    const clauses = [];

    for (const token of tokens) {
      const clean = this.normalizeOrthography(token).replace(/[^\p{L}\p{N}]/gu, "");
      if (clean.length < 2) continue;
      
      const stem = this.extractStem(clean);
      const alt = stem.replace(/і/g, "о");
      
      const uniqueForms = new Set([clean, stem, alt].filter(f => f.length >= 2));
      const disjunctions = Array.from(uniqueForms).map(f => "\"" + f + "\"*" );
      clauses.push("(" + disjunctions.join(" OR ") + ")");
    }

    return clauses.length > 0 ? clauses.join(" AND ") : "\"\"";
  }
}
