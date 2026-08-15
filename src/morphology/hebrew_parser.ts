import { MorphologyBreakdown } from "./types.js";

const stemMap: Record<string, string> = {
  'q': 'Qal', 'N': 'Niphal', 'p': 'Piel', 'P': 'Pual', 'h': 'Hiphil', 'H': 'Hophal',
  't': 'Hithpael', 'o': 'Polel', 'O': 'Polal', 'r': 'Hithpolel'
};

const conjMap: Record<string, string> = {
  'p': 'Perfect (Qatal)', 'i': 'Imperfect (Yiqtol)', 'w': 'Wayyiqtol (Sequential Imperfect)',
  'q': 'Weqatal (Sequential Perfect)', 'v': 'Imperative', 'r': 'Active Participle (Koteb)',
  's': 'Passive Participle (Katub)', 'c': 'Infinitive Construct', 'a': 'Infinitive Absolute',
  'j': 'Jussive', 'h': 'Cohortative'
};

const stateMap: Record<string, string> = { 'a': 'Absolute', 'c': 'Construct', 'd': 'Determined', 'e': 'Emphatic' };
const numMap: Record<string, string> = { 's': 'Singular', 'p': 'Plural', 'd': 'Dual' };

/**
 * 🔍 Parses Hebrew WLC morphological codes (e.g. 'V-q-3ms', 'HR/Ncfsa', 'Vqw3ms')
 */
export function parseHebrewMorphCode(code: string): MorphologyBreakdown {
  const raw = code.trim();
  const prefixes: string[] = [];

  // Separate prefixes separated by '/'
  const segments = raw.split('/');
  const mainSegment = segments.pop() || raw;

  for (const pfx of segments) {
    if (pfx === 'HC' || pfx === 'C') prefixes.push('Conjunction (וְ)');
    else if (pfx === 'HR' || pfx === 'R') prefixes.push('Preposition (בְּ, לְ, כְּ, מִ)');
    else if (pfx === 'HT' || pfx === 'T') prefixes.push('Article (הַ)');
    else if (pfx === 'Hd' || pfx === 'd') prefixes.push('Interrogative (הֲ)');
  }

  const [stemPart, suffixPart] = mainSegment.split('+');

  // A. Verb Parsing (e.g. V-q-3ms, Vqw3ms)
  if (stemPart.startsWith('V')) {
    const vClean = stemPart.replace(/^V-?/, '');
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

    return {
      code: raw,
      pos: isProper ? 'Proper Noun' : 'Noun',
      gender: isProper ? undefined : gen,
      number: isProper ? undefined : num,
      state: isProper ? undefined : state,
      description: `${isProper ? 'Proper Noun' : `Noun (${gen} ${num} ${state})`}${pfxDesc}${sfxDesc}`.trim()
    };
  }

  return {
    code: raw,
    pos: 'Hebrew Grammar / Particle',
    description: `Hebrew Grammar: ${raw}`
  };
}
