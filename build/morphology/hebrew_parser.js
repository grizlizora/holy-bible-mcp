const hebrewStemMap = {
    'q': 'Qal', 'N': 'Niphal', 'p': 'Piel', 'P': 'Pual', 'h': 'Hiphil', 'H': 'Hophal',
    't': 'Hithpael', 'o': 'Polel', 'O': 'Polal', 'r': 'Hithpolel'
};
const aramaicStemMap = {
    'q': 'Peal (Ground)', 'Q': 'Peil (Passive Peal)', 't': 'Ithpeel',
    'p': 'Pael (Intensive)', 'P': 'Ithpaal', 'a': 'Aphel (Causative)',
    'A': 'Ittaphal', 'h': 'Haphil (Causative)', 'H': 'Hophal',
    's': 'Shaphel', 'S': 'Ishtaphel'
};
const conjMap = {
    'p': 'Perfect (Qatal)', 'i': 'Imperfect (Yiqtol)', 'w': 'Wayyiqtol (Sequential Imperfect)',
    'q': 'Weqatal (Sequential Perfect)', 'v': 'Imperative', 'r': 'Active Participle (Koteb)',
    's': 'Passive Participle (Katub)', 'c': 'Infinitive Construct', 'a': 'Infinitive Absolute',
    'j': 'Jussive', 'h': 'Cohortative'
};
const stateMap = {
    'a': 'Absolute',
    'c': 'Construct',
    'd': 'Determined / Emphatic',
    'e': 'Emphatic'
};
const numMap = { 's': 'Singular', 'p': 'Plural', 'd': 'Dual' };
const HEBREW_PARSE_CACHE = new Map();
const MAX_HEBREW_CACHE = 5000;
/**
 * 🔍 Parses Hebrew & Aramaic WLC morphological codes (e.g. 'V-q-3ms', 'A-V-q-3ms', 'HR/Ncfsa', 'AC/AR/Ncmse')
 */
export function parseHebrewMorphCode(code, isAramaicOverride) {
    const raw = code.trim();
    const cacheKey = `${raw}::${isAramaicOverride ?? 'auto'}`;
    if (HEBREW_PARSE_CACHE.has(cacheKey)) {
        const cached = HEBREW_PARSE_CACHE.get(cacheKey);
        HEBREW_PARSE_CACHE.delete(cacheKey);
        HEBREW_PARSE_CACHE.set(cacheKey, cached);
        return cached;
    }
    const isAramaic = isAramaicOverride === true ||
        raw.startsWith('A-') ||
        raw.startsWith('A/') ||
        raw.startsWith('AC/') ||
        raw.startsWith('AR/') ||
        raw.startsWith('AT/') ||
        raw.startsWith('Ad/') ||
        raw.startsWith('ARAM') ||
        raw.includes('/A');
    const prefixes = [];
    // Separate prefixes separated by '/'
    const segments = raw.split('/');
    const mainSegment = segments.pop() || raw;
    for (const pfx of segments) {
        if (pfx === 'HC' || pfx === 'C')
            prefixes.push('Hebrew Conjunction (וְ)');
        else if (pfx === 'AC')
            prefixes.push('Aramaic Conjunction (וַ / וּ)');
        else if (pfx === 'HR' || pfx === 'R')
            prefixes.push('Hebrew Preposition (בְּ, לְ, כְּ, מִ)');
        else if (pfx === 'AR')
            prefixes.push('Aramaic Preposition (בְּ, לְ, מִן, עַל)');
        else if (pfx === 'HT' || pfx === 'T')
            prefixes.push('Hebrew Article (הַ)');
        else if (pfx === 'AT')
            prefixes.push('Aramaic Determiner / Postpositive (א-)');
        else if (pfx === 'Ad' || pfx === 'd')
            prefixes.push('Aramaic Relative (דִּי)');
        else if (pfx === 'Hd')
            prefixes.push('Hebrew Interrogative (הֲ)');
        else if (pfx === 'Hs' || pfx === 's')
            prefixes.push('Hebrew Relative Prefix (שֶׁ-)');
        else if (pfx === 'Hk' || pfx === 'k')
            prefixes.push('Hebrew Comparative Prefix (כְּ-)');
        else if (pfx === 'Ak')
            prefixes.push('Aramaic Comparative Prefix (כְּ-)');
    }
    let cleanMain = mainSegment.replace(/^A-/, '').replace(/^H-/, '');
    const [stemPart, suffixPart] = cleanMain.split('+');
    // A. Verb Parsing (e.g. V-q-p-3ms, V-q-3ms, Vqw3ms)
    if (stemPart.startsWith('V')) {
        const vClean = stemPart.replace(/^V/, '').replace(/-/g, '');
        const stemChar = vClean[0] || 'q';
        let conjChar = 'p';
        let pn = '';
        if (conjMap[vClean[1]]) {
            conjChar = vClean[1];
            pn = vClean.slice(2);
        }
        else {
            pn = vClean.slice(1);
        }
        const stem = isAramaic
            ? (aramaicStemMap[stemChar] || `Aramaic Stem (${stemChar})`)
            : (hebrewStemMap[stemChar] || `Stem (${stemChar})`);
        const tense = conjMap[conjChar] || `Conjugation (${conjChar})`;
        const person = ['1', '2', '3'].includes(pn[0]) ? `${pn[0]} Person` : '';
        const gender = pn.includes('m') ? 'Masculine' : pn.includes('f') ? 'Feminine' : pn.includes('c') ? 'Common' : '';
        const number = pn.includes('s') ? 'Singular' : pn.includes('p') ? 'Plural' : (pn.includes('d') ? 'Dual' : '');
        const pfxDesc = prefixes.length > 0 ? ` [Prefix: ${prefixes.join(' + ')}]` : '';
        const sfxDesc = suffixPart ? ` + [Suffix: ${suffixPart}]` : '';
        const langLabel = isAramaic ? 'Biblical Aramaic Verb' : 'Verb';
        const res = {
            code: raw,
            pos: 'Verb',
            stem,
            tense,
            person,
            gender,
            number,
            description: `${langLabel} - ${stem} ${tense}${person ? ` (${person} ${gender} ${number})` : ''}${pfxDesc}${sfxDesc}`.trim()
        };
        if (HEBREW_PARSE_CACHE.size >= MAX_HEBREW_CACHE) {
            const oldest = HEBREW_PARSE_CACHE.keys().next().value;
            if (oldest)
                HEBREW_PARSE_CACHE.delete(oldest);
        }
        HEBREW_PARSE_CACHE.set(cacheKey, res);
        return res;
    }
    // B. Noun Parsing (e.g. Ncmsa, Ncfsc, Np, Ncmse)
    if (stemPart.startsWith('N')) {
        const nClean = stemPart.slice(1);
        const isProper = nClean.startsWith('p');
        const gen = nClean[1] === 'm' ? 'Masculine' : nClean[1] === 'f' ? 'Feminine' : 'Common';
        const num = numMap[nClean[2]] || '';
        const state = stateMap[nClean[3]] || (nClean[3] ? `State (${nClean[3]})` : '');
        const pfxDesc = prefixes.length > 0 ? ` [Prefix: ${prefixes.join(' + ')}]` : '';
        const sfxDesc = suffixPart ? ` + [Suffix: ${suffixPart}]` : '';
        const langPrefix = isAramaic ? 'Aramaic ' : '';
        const res = {
            code: raw,
            pos: isProper ? `${langPrefix}Proper Noun` : `${langPrefix}Noun`,
            gender: isProper ? undefined : gen,
            number: isProper ? undefined : num,
            state: isProper ? undefined : state,
            description: `${isProper ? `${langPrefix}Proper Noun` : `${langPrefix}Noun (${gen} ${num} ${state})`}${pfxDesc}${sfxDesc}`.trim()
        };
        if (HEBREW_PARSE_CACHE.size >= MAX_HEBREW_CACHE) {
            const oldest = HEBREW_PARSE_CACHE.keys().next().value;
            if (oldest)
                HEBREW_PARSE_CACHE.delete(oldest);
        }
        HEBREW_PARSE_CACHE.set(cacheKey, res);
        return res;
    }
    const res = {
        code: raw,
        pos: isAramaic ? 'Biblical Aramaic Word' : 'Hebrew Grammar / Particle',
        description: isAramaic ? `Biblical Aramaic Grammar: ${raw}` : `Hebrew Grammar: ${raw}`
    };
    if (HEBREW_PARSE_CACHE.size >= MAX_HEBREW_CACHE) {
        const oldest = HEBREW_PARSE_CACHE.keys().next().value;
        if (oldest)
            HEBREW_PARSE_CACHE.delete(oldest);
    }
    HEBREW_PARSE_CACHE.set(cacheKey, res);
    return res;
}
export function parseAramaicMorphCode(code) {
    return parseHebrewMorphCode(code, true);
}
