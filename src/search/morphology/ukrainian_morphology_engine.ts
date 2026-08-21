export class UkrainianMorphologyEngine {
  private static readonly IRREGULAR_VERB_MAP: Record<string, string[]> = {
    "бути": ["є", "був", "була", "було", "були", "буде", "будуть", "єсь", "бувши", "будемо"],
    "іти": ["йшов", "йшла", "йшло", "йшли", "іду", "ідеш", "іде", "ідемо", "ідуть", "пішов", "пішла", "пішли", "піде"],
    "дати": ["дам", "даси", "дасть", "дамо", "дасте", "дадуть", "давай", "дав", "дала"],
    "їсти": ["їм", "їси", "їсть", "їмо", "їсте", "їдять", "їв", "їла"],
    "могти": ["можу", "можеш", "може", "можемо", "можуть", "міг", "могла", "могли"]
  };

  private static readonly NOUN_ENDINGS = /(?:ами|ями|ою|ею|єю|ові|еві|єві|ів|ев|єв|ей|ам|ям|ом|ем|єм|ах|ях|и|і|ї|е|є|у|ю|а|я|о)$/iu;
  private static readonly VERB_ENDINGS = /(?:вшись|чись|тесь|тися|ться|тиму|тиме|тимеш|тимуть|лися|лась|лись|лося|ли|ла|ло|ти|ть|в|й|мо|те)$/iu;
  private static readonly ADJ_ENDINGS = /(?:ими|іми|ого|ього|ому|ньому|им|ім|их|іх|ої|ьої|ій|а|я|е|є|і|и)$/iu;

  public static normalizeOrthography(text: string): string {
    return text
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’ʼ`"]/g, "'")
      .replace(/ґ/g, "г");
  }

  public static extractStem(word: string): string {
    let w = this.normalizeOrthography(word);
    if (w.length <= 3) return w;

    for (const [lemma, forms] of Object.entries(this.IRREGULAR_VERB_MAP)) {
      if (forms.includes(w) || w === lemma) return lemma;
    }

    w = w.replace(/(?:ся|сь)$/iu, "");

    if (this.ADJ_ENDINGS.test(w)) {
      w = w.replace(this.ADJ_ENDINGS, "");
    } else if (this.VERB_ENDINGS.test(w)) {
      w = w.replace(this.VERB_ENDINGS, "");
    } else if (this.NOUN_ENDINGS.test(w)) {
      w = w.replace(this.NOUN_ENDINGS, "");
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
