const stemMap = {
    'q': 'Qal', 'N': 'Niphal', 'p': 'Piel', 'P': 'Pual', 'h': 'Hiphil', 'H': 'Hophal',
    't': 'Hithpael', 'o': 'Polel', 'O': 'Polal', 'r': 'Hithpolel'
};
const conjMap = {
    'p': 'Perfect (Qatal)', 'i': 'Imperfect (Yiqtol)', 'w': 'Wayyiqtol (Sequential Imperfect)',
    'q': 'Weqatal (Sequential Perfect)', 'v': 'Imperative', 'r': 'Active Participle (Koteb)',
    's': 'Passive Participle (Katub)', 'c': 'Infinitive Construct', 'a': 'Infinitive Absolute',
    'j': 'Jussive', 'h': 'Cohortative'
};
const stateMap = { 'a': 'Absolute', 'c': 'Construct', 'd': 'Determined', 'e': 'Emphatic' };
const numMap = { 's': 'Singular', 'p': 'Plural', 'd': 'Dual' };
const HEBREW_PARSE_CACHE = new Map();
const MAX_HEBREW_CACHE = 5000;
/**
 * 🔍 Parses Hebrew WLC morphological codes (e.g. 'V-q-3ms', 'HR/Ncfsa', 'Vqw3ms') with 5,000 LRU cache
 */
export function parseHebrewMorphCode(code) {
    const raw = code.trim();
    if (HEBREW_PARSE_CACHE.has(raw)) {
        const cached = HEBREW_PARSE_CACHE.get(raw);
        HEBREW_PARSE_CACHE.delete(raw);
        HEBREW_PARSE_CACHE.set(raw, cached);
        return cached;
    }
    const prefixes = [];
    // Separate prefixes separated by '/'
    const segments = raw.split('/');
    const mainSegment = segments.pop() || raw;
    for (const pfx of segments) {
        if (pfx === 'HC' || pfx === 'C')
            prefixes.push('Conjunction (וְ)');
        else if (pfx === 'HR' || pfx === 'R')
            prefixes.push('Preposition (בְּ, לְ, כְּ, מִ)');
        else if (pfx === 'HT' || pfx === 'T')
            prefixes.push('Article (הַ)');
        else if (pfx === 'Hd' || pfx === 'd')
            prefixes.push('Interrogative (הֲ)');
    }
    const [stemPart, suffixPart] = mainSegment.split('+');
    // A. Verb Parsing (e.g. V-q-p-3ms, V-q-3ms, Vqw3ms)
    if (stemPart.startsWith('V')) {
        const vClean = stemPart.replace(/^V/, '').replace(/-/g, '');
        const stemChar = vClean[0] || 'q';
        const conjChar = vClean[1] || 'p';
        const stem = stemMap[stemChar] || `Stem (${stemChar})`;
        const tense = conjMap[conjChar] || `Conjugation (${conjChar})`;
        const pn = vClean.slice(2);
        const person = ['1', '2', '3'].includes(pn[0]) ? `${pn[0]} Person` : '';
        const gender = pn.includes('m') ? 'Masculine' : pn.includes('f') ? 'Feminine' : pn.includes('c') ? 'Common' : '';
        const number = pn.includes('s') ? 'Singular' : pn.includes('p') ? 'Plural' : '';
        const pfxDesc = prefixes.length > 0 ? ` [Prefix: ${prefixes.join(' + ')}]` : '';
        const sfxDesc = suffixPart ? ` + [Suffix: ${suffixPart}]` : '';
        return {
            code: raw,
            pos: 'Verb',
            stem,
            tense,
            person,
            gender,
            number,
            description: `Verb - ${stem} ${tense}${person ? ` (${person} ${gender} ${number})` : ''}${pfxDesc}${sfxDesc}`.trim()
        };
    }
    // B. Noun Parsing (e.g. Ncmsa, Ncfsc, Np)
    if (stemPart.startsWith('N')) {
        const nClean = stemPart.slice(1);
        const isProper = nClean.startsWith('p');
        const gen = nClean[1] === 'm' ? 'Masculine' : nClean[1] === 'f' ? 'Feminine' : 'Common';
        const num = numMap[nClean[2]] || '';
        const state = stateMap[nClean[3]] || '';
        const pfxDesc = prefixes.length > 0 ? ` [Prefix: ${prefixes.join(' + ')}]` : '';
        const sfxDesc = suffixPart ? ` + [Suffix: ${suffixPart}]` : '';
        const res = {
            code: raw,
            pos: isProper ? 'Proper Noun' : 'Noun',
            gender: isProper ? undefined : gen,
            number: isProper ? undefined : num,
            state: isProper ? undefined : state,
            description: `${isProper ? 'Proper Noun' : `Noun (${gen} ${num} ${state})`}${pfxDesc}${sfxDesc}`.trim()
        };
        if (HEBREW_PARSE_CACHE.size >= MAX_HEBREW_CACHE) {
            const oldest = HEBREW_PARSE_CACHE.keys().next().value;
            if (oldest)
                HEBREW_PARSE_CACHE.delete(oldest);
        }
        HEBREW_PARSE_CACHE.set(raw, res);
        return res;
    }
    const res = {
        code: raw,
        pos: 'Hebrew Grammar / Particle',
        description: `Hebrew Grammar: ${raw}`
    };
    if (HEBREW_PARSE_CACHE.size >= MAX_HEBREW_CACHE) {
        const oldest = HEBREW_PARSE_CACHE.keys().next().value;
        if (oldest)
            HEBREW_PARSE_CACHE.delete(oldest);
    }
    HEBREW_PARSE_CACHE.set(raw, res);
    return res;
}
