const tenseMap = {
    P: 'Present',
    '2P': '2nd Present',
    I: 'Imperfect',
    F: 'Future',
    '2F': '2nd Future',
    A: 'Aorist',
    '2A': '2nd Aorist',
    X: 'Perfect',
    R: 'Perfect',
    '2X': '2nd Perfect',
    '2R': '2nd Perfect',
    Y: 'Pluperfect',
    L: 'Pluperfect',
    '2Y': '2nd Pluperfect',
    '2L': '2nd Pluperfect'
};
const voiceMap = {
    A: 'Active',
    M: 'Middle',
    P: 'Passive',
    E: 'Middle/Passive',
    D: 'Deponent',
    O: 'Passive Deponent',
    N: 'Middle/Passive Deponent',
    Q: 'Impersonal Active'
};
const moodMap = {
    I: 'Indicative',
    S: 'Subjunctive',
    O: 'Optative',
    M: 'Imperative',
    N: 'Infinitive',
    P: 'Participle'
};
const caseMap = {
    N: 'Nominative',
    G: 'Genitive',
    D: 'Dative',
    A: 'Accusative',
    V: 'Vocative'
};
const numberMap = {
    S: 'Singular',
    P: 'Plural',
    D: 'Dual'
};
const genderMap = {
    M: 'Masculine',
    F: 'Feminine',
    N: 'Neuter'
};
const pronounPosMap = {
    P: 'Personal Pronoun',
    R: 'Relative Pronoun',
    D: 'Demonstrative Pronoun',
    X: 'Indefinite Pronoun',
    I: 'Interrogative Pronoun',
    F: 'Reflexive Pronoun',
    C: 'Reciprocal Pronoun',
    K: 'Correlative Pronoun',
    Q: 'Correlative/Interrogative'
};
const particleMap = {
    CONJ: 'Conjunction',
    PREP: 'Preposition',
    ADV: 'Adverb',
    'ADV-C': 'Comparative Adverb',
    'ADV-S': 'Superlative Adverb',
    'ADV-I': 'Interrogative Adverb',
    'ADV-K': 'Correlative Adverb',
    'ADV-N': 'Negative Adverb',
    PRT: 'Particle',
    'PRT-N': 'Negative Particle',
    COND: 'Conditional Particle',
    INJ: 'Interjection',
    INT: 'Interjection'
};
const GREEK_PARSE_CACHE = new Map();
const MAX_GREEK_CACHE = 5000;
function saveToGreekCache(key, res) {
    if (GREEK_PARSE_CACHE.size >= MAX_GREEK_CACHE) {
        const oldest = GREEK_PARSE_CACHE.keys().next().value;
        if (oldest)
            GREEK_PARSE_CACHE.delete(oldest);
    }
    GREEK_PARSE_CACHE.set(key, res);
    return res;
}
/**
 * 🔍 Parses Greek Robinson morphological codes into human-readable descriptions (with 5,000 LRU Cache)
 */
export function parseGreekMorphCode(code) {
    const raw = code.trim().toUpperCase();
    if (GREEK_PARSE_CACHE.has(raw)) {
        const cached = GREEK_PARSE_CACHE.get(raw);
        GREEK_PARSE_CACHE.delete(raw);
        GREEK_PARSE_CACHE.set(raw, cached);
        return cached;
    }
    const parts = raw.split('-');
    const basePos = parts[0];
    // 1. Verbs (e.g. V-AAI-3S, V-2AAI-3S, V-PAP-NSM, V-2PAP-NSM, V-AAN, V-2AAN, V-AAO-3S, V-RAI-3S)
    if (basePos === 'V') {
        const form = parts[1] || '';
        let tenseToken = '';
        let voiceChar = '';
        let moodChar = '';
        if (form.startsWith('2')) {
            tenseToken = form.slice(0, 2); // '2A', '2F', '2R', etc.
            voiceChar = form[2] || '';
            moodChar = form[3] || '';
        }
        else {
            tenseToken = form[0] || '';
            voiceChar = form[1] || '';
            moodChar = form[2] || '';
        }
        const t = tenseMap[tenseToken] || tenseToken;
        const v = voiceMap[voiceChar] || voiceChar;
        const m = moodMap[moodChar] || moodChar;
        if (moodChar === 'P') {
            // Participle: Form is V-[T][V]P-[Case][Num][Gen]
            const cng = parts[2] || '';
            const c = caseMap[cng[0]] || '';
            const n = numberMap[cng[1]] || '';
            const g = genderMap[cng[2]] || '';
            const descDetails = [c, g, n].filter(Boolean).join(' ');
            const res = {
                code: raw,
                pos: 'Verb',
                tense: t,
                voice: v,
                mood: 'Participle',
                caseGrammatical: c || undefined,
                number: n || undefined,
                gender: g || undefined,
                description: `Verb - ${t} ${v} Participle${descDetails ? `, ${descDetails}` : ''}`.trim()
            };
            return saveToGreekCache(raw, res);
        }
        else if (moodChar === 'N') {
            // Infinitive
            const res = {
                code: raw,
                pos: 'Verb',
                tense: t,
                voice: v,
                mood: 'Infinitive',
                description: `Verb - ${t} ${v} Infinitive`.trim()
            };
            return saveToGreekCache(raw, res);
        }
        else {
            // Finite Verb (Indicative, Subjunctive, Optative, Imperative)
            const pn = parts[2] || '';
            const p = pn[0] === '1' ? '1st' : pn[0] === '2' ? '2nd' : pn[0] === '3' ? '3rd' : '';
            const n = numberMap[pn[1]] || '';
            const agreement = [p ? `${p} Person` : '', n].filter(Boolean).join(' ');
            const res = {
                code: raw,
                pos: 'Verb',
                tense: t,
                voice: v,
                mood: m,
                person: p ? `${p} Person` : undefined,
                number: n || undefined,
                description: `Verb - ${t} ${v} ${m}${agreement ? ` (${agreement})` : ''}`.trim()
            };
            return saveToGreekCache(raw, res);
        }
    }
    // 2. Indeclinables & Proper Nouns
    if (raw === 'N-PRI')
        return saveToGreekCache(raw, { code: raw, pos: 'Proper Noun', description: 'Proper Noun (Indeclinable)' });
    if (raw === 'N-LI')
        return saveToGreekCache(raw, { code: raw, pos: 'Letter', description: 'Greek Letter (Indeclinable)' });
    if (raw === 'N-OI' || raw === 'A-NUI')
        return saveToGreekCache(raw, { code: raw, pos: 'Numeral', description: 'Numeral (Indeclinable)' });
    if (raw === 'HEB')
        return saveToGreekCache(raw, { code: raw, pos: 'Hebrew Word', description: 'Hebrew Loanword in Greek' });
    if (raw === 'ARAM')
        return saveToGreekCache(raw, { code: raw, pos: 'Aramaic Word', description: 'Aramaic Word in Greek' });
    // 3. Pronouns
    if (pronounPosMap[basePos]) {
        const posName = pronounPosMap[basePos];
        const tail = parts[1] || '';
        let person = '';
        let cng = tail;
        if (['1', '2', '3'].includes(tail[0])) {
            person = `${tail[0]} Person`;
            cng = tail.slice(1);
        }
        const c = caseMap[cng[0]] || '';
        const n = numberMap[cng[1]] || '';
        const g = genderMap[cng[2]] || '';
        const descDetails = [c, g, n].filter(Boolean).join(' ');
        const res = {
            code: raw,
            pos: posName,
            person: person || undefined,
            caseGrammatical: c || undefined,
            number: n || undefined,
            gender: g || undefined,
            description: `${posName}${person ? ` (${person})` : ''}${descDetails ? ` - ${descDetails}` : ''}`.trim()
        };
        return saveToGreekCache(raw, res);
    }
    // 4. Nouns, Adjectives, Definite Articles
    if (['N', 'A', 'T'].includes(basePos)) {
        const pos = basePos === 'N' ? 'Noun' : basePos === 'A' ? 'Adjective' : 'Definite Article';
        const cng = parts[1] || '';
        const c = caseMap[cng[0]] || cng[0];
        const n = numberMap[cng[1]] || cng[1];
        const g = genderMap[cng[2]] || cng[2];
        const descDetails = [c, g, n].filter(Boolean).join(' ');
        const res = {
            code: raw,
            pos,
            caseGrammatical: c || undefined,
            number: n || undefined,
            gender: g || undefined,
            description: `${pos}${descDetails ? ` - ${descDetails}` : ''}`.trim()
        };
        return saveToGreekCache(raw, res);
    }
    // 5. Particles, Prepositions & Adverbs
    const desc = particleMap[raw] || raw;
    const res = { code: raw, pos: desc, description: desc };
    return saveToGreekCache(raw, res);
}
