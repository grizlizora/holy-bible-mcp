import { OSIS_BOOK_NAMES, OSIS_ALIAS_MAP, getLocalizedBookNameFromDict } from './data/osis_dictionary.js';
export { OSIS_BOOK_NAMES, OSIS_ALIAS_MAP };
export function getLocalizedBookName(osisCode, lang = 'ukr') {
    return getLocalizedBookNameFromDict(osisCode, lang);
}
export function formatBiblicalDisplayTitle(input, lang = 'ukr') {
    if (!input)
        return '';
    const cleanInput = input.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    const match = cleanInput.match(/^([1-3]?\s*[\p{L}\p{M}]+)\s+(\d+(?:[.:]\d+(?:-[0-9]+)?)?)$/u);
    if (match) {
        const rawBook = match[1].trim().toUpperCase().replace(/\s+/g, '');
        const chapterVerse = match[2].trim();
        const osis = OSIS_ALIAS_MAP[rawBook] || rawBook;
        const localizedBook = getLocalizedBookName(osis, lang);
        return `${localizedBook} ${chapterVerse}`;
    }
    return cleanInput;
}
export function toCanonicalReferenceKey(str) {
    if (!str)
        return '';
    let s = str.trim().toUpperCase().replace(/[-–—]/g, '-').replace(/_/g, ' ');
    const m = s.match(/^([1-3]?\s*[\p{L}\p{M}]+)\s*(.*)$/u);
    if (m) {
        const rawBook = m[1].replace(/\s+/g, '');
        const chapterVerse = m[2].replace(/\s+/g, '');
        const osis = OSIS_ALIAS_MAP[rawBook] || rawBook;
        return `${osis}_${chapterVerse}`;
    }
    return s.replace(/\s+/g, '');
}
