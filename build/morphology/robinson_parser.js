const tenseMap = { P: 'Present', I: 'Imperfect', F: 'Future', A: 'Aorist', X: 'Perfect', Y: 'Pluperfect' };
const voiceMap = { A: 'Active', M: 'Middle', P: 'Passive', E: 'Middle/Passive', D: 'Deponent' };
const moodMap = { I: 'Indicative', S: 'Subjunctive', O: 'Optative', M: 'Imperative', N: 'Infinitive', P: 'Participle' };
const caseMap = { N: 'Nominative', G: 'Genitive', D: 'Dative', A: 'Accusative', V: 'Vocative' };
const numberMap = { S: 'Singular', P: 'Plural', D: 'Dual' };
const genderMap = { M: 'Masculine', F: 'Feminine', N: 'Neuter' };
const pronounPosMap = {
    'P': 'Personal Pronoun', 'R': 'Relative Pronoun', 'D': 'Demonstrative Pronoun',
    'X': 'Indefinite Pronoun', 'I': 'Interrogative Pronoun', 'F': 'Reflexive Pronoun',
    'C': 'Reciprocal Pronoun', 'K': 'Correlative Pronoun', 'Q': 'Correlative/Interrogative'
};
const particleMap = {
    'CONJ': 'Conjunction', 'PREP': 'Preposition', 'ADV': 'Adverb', 'ADV-C': 'Comparative Adverb',
    'ADV-S': 'Superlative Adverb', 'PRT': 'Particle', 'PRT-N': 'Negative Particle', 'COND': 'Conditional Particle',
    'INJ': 'Interjection', 'INT': 'Interjection'
};
const GREEK_PARSE_CACHE = new Map();
const MAX_GREEK_CACHE = 5000;
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
    // 1. Verbs (e.g. V-AAI-3S, V-PAP-NSM, V-AAN)
    if (basePos === 'V') {
        const form = parts[1] || '';
        const t = tenseMap[form[0]] || form[0];
        const v = voiceMap[form[1]] || form[1];
        const m = moodMap[form[2]] || form[2];
        if (form[2] === 'P') {
            // Participle: Form is V-[T][V]P-[Case][Num][Gen]
            const cng = parts[2] || '';
            const c = caseMap[cng[0]] || '';
            const n = numberMap[cng[1]] || '';
            const g = genderMap[cng[2]] || '';
            return {
                code: raw,
                pos: 'Verb',
                tense: t,
                voice: v,
                mood: 'Participle',
                caseGrammatical: c,
                number: n,
                gender: g,
                description: `Verb - ${t} ${v} Participle, ${c} ${g} ${n}`.trim()
            };
        }
        else if (form[2] === 'N') {
            // Infinitive
            return {
                code: raw,
                pos: 'Verb',
                tense: t,
                voice: v,
                mood: 'Infinitive',
                description: `Verb - ${t} ${v} Infinitive`.trim()
            };
        }
        else {
            // Finite Verb
            const pn = parts[2] || '';
            const p = pn[0] === '1' ? '1st' : pn[0] === '2' ? '2nd' : pn[0] === '3' ? '3rd' : '';
            const n = numberMap[pn[1]] || '';
            return {
                code: raw,
                pos: 'Verb',
                tense: t,
                voice: v,
                mood: m,
                person: p ? `${p} Person` : '',
                number: n,
                description: `Verb - ${t} ${v} ${m}${p ? ` (${p} Person ${n})` : ''}`.trim()
            };
        }
    }
    // 2. Indeclinables & Proper Nouns
    if (raw === 'N-PRI')
        return { code: raw, pos: 'Proper Noun', description: 'Proper Noun (Indeclinable)' };
    if (raw === 'N-LI')
        return { code: raw, pos: 'Letter', description: 'Greek Letter (Indeclinable)' };
    if (raw === 'N-OI')
        return { code: raw, pos: 'Numeral', description: 'Numeral (Indeclinable)' };
    if (raw === 'HEB')
        return { code: raw, pos: 'Hebrew Word', description: 'Hebrew Loanword in Greek' };
    if (raw === 'ARAM')
        return { code: raw, pos: 'Aramaic Word', description: 'Aramaic Word in Greek' };
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
        return {
            code: raw,
            pos: posName,
            person,
            caseGrammatical: c,
            number: n,
            gender: g,
            description: `${posName}${person ? ` (${person})` : ''} - ${c} ${g} ${n}`.trim()
        };
    }
    // 4. Nouns, Adjectives, Definite Articles
    if (['N', 'A', 'T'].includes(basePos)) {
        const pos = basePos === 'N' ? 'Noun' : basePos === 'A' ? 'Adjective' : 'Definite Article';
        const cng = parts[1] || '';
        const c = caseMap[cng[0]] || cng[0];
        const n = numberMap[cng[1]] || cng[1];
        const g = genderMap[cng[2]] || cng[2];
        const res = {
            code: raw,
            pos,
            caseGrammatical: c,
            number: n,
            gender: g,
            description: `${pos} - ${c} ${g} ${n}`.trim()
        };
        if (GREEK_PARSE_CACHE.size >= MAX_GREEK_CACHE) {
            const oldest = GREEK_PARSE_CACHE.keys().next().value;
            if (oldest)
                GREEK_PARSE_CACHE.delete(oldest);
        }
        GREEK_PARSE_CACHE.set(raw, res);
        return res;
    }
    // 5. Particles & Prepositions
    const desc = particleMap[raw] || raw;
    const res = { code: raw, pos: desc, description: desc };
    if (GREEK_PARSE_CACHE.size >= MAX_GREEK_CACHE) {
        const oldest = GREEK_PARSE_CACHE.keys().next().value;
        if (oldest)
            GREEK_PARSE_CACHE.delete(oldest);
    }
    GREEK_PARSE_CACHE.set(raw, res);
    return res;
}
