export class UkrainianMorphologyEngine {
    static IRREGULAR_VERB_MAP = {
        "бути": ["є", "був", "була", "було", "були", "буде", "будуть", "єсь", "бувши", "будемо"],
        "іти": ["йшов", "йшла", "йшло", "йшли", "іду", "ідеш", "іде", "ідемо", "ідуть", "пішов", "пішла", "пішли", "піде"],
        "дати": ["дам", "даси", "дасть", "дамо", "дасте", "дадуть", "давай", "дав", "дала"],
        "їсти": ["їм", "їси", "їсть", "їмо", "їсте", "їдять", "їв", "їла"],
        "могти": ["можу", "можеш", "може", "можемо", "можуть", "міг", "могла", "могли"]
    };
    static MULTI_ADJ_ENDINGS = /(?:ньому|ського|цького|ськими|цькими|шими|ими|іми|ого|ього|ому|им|ім|их|іх|ої|ьої|ій)$/iu;
    static MULTI_NOUN_ENDINGS = /(?:ами|ями|ові|еві|єві|ою|ею|єю|ів|ев|єв|ей|ам|ям|ом|ем|єм|ах|ях)$/iu;
    static MULTI_VERB_ENDINGS = /(?:вшись|чись|тесь|тися|ться|тиму|тиме|тимеш|тимуть|лися|лась|лись|лося|ли|ла|ло|ти|ть)$/iu;
    static SINGLE_ENDINGS = /(?:[аяеєиіїуюо])$/iu;
    static normalizeOrthography(text) {
        return text
            .toLowerCase()
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[’ʼ`"]/g, "'")
            .replace(/ґ/g, "г");
    }
    static extractStem(word) {
        let w = this.normalizeOrthography(word);
        // 1. Check irregular verbs first (even for short forms like 'є', 'був', 'їм')
        for (const [lemma, forms] of Object.entries(this.IRREGULAR_VERB_MAP)) {
            if (forms.includes(w) || w === lemma)
                return lemma;
        }
        if (w.length <= 3)
            return w;
        w = w.replace(/(?:ся|сь)$/iu, "");
        // 2. Multi-character inflectional suffixes (longest match first)
        if (this.MULTI_ADJ_ENDINGS.test(w)) {
            w = w.replace(this.MULTI_ADJ_ENDINGS, "");
        }
        else if (this.MULTI_NOUN_ENDINGS.test(w)) {
            w = w.replace(this.MULTI_NOUN_ENDINGS, "");
        }
        else if (this.MULTI_VERB_ENDINGS.test(w)) {
            w = w.replace(this.MULTI_VERB_ENDINGS, "");
        }
        else if (this.SINGLE_ENDINGS.test(w)) {
            w = w.replace(this.SINGLE_ENDINGS, "");
        }
        return w.length >= 2 ? w : word.toLowerCase();
    }
    static generateFtsQuery(rawQuery) {
        const tokens = rawQuery.trim().split(/\s+/).filter(t => t.length > 0);
        const clauses = [];
        for (const token of tokens) {
            const clean = this.normalizeOrthography(token).replace(/[^\p{L}\p{N}]/gu, "");
            if (clean.length < 2)
                continue;
            const stem = this.extractStem(clean);
            const alt = stem.replace(/і/g, "о");
            const uniqueForms = new Set([clean, stem, alt].filter(f => f.length >= 2));
            const disjunctions = Array.from(uniqueForms).map(f => "\"" + f + "\"*");
            clauses.push("(" + disjunctions.join(" OR ") + ")");
        }
        return clauses.length > 0 ? clauses.join(" AND ") : "\"\"";
    }
}
