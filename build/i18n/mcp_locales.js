/**
 * 🌍 Multilingual MCP Descriptions & Tool Locales
 *
 * Languages:
 * - UK: Ukrainian (Default)
 * - EN: English
 * - HE: Hebrew
 * - EL: Greek
 */
export const MCP_LOCALES = {
    uk: {
        ask_holy_bible: 'Головний інструмент побудови теологічного та біблійного контексту з 11.9M віршів та 800+ мов.',
        search_keyword: 'Пошук віршів за ключовими словами у SQLite FTS5 (підтримка морфології та синонімів).',
        get_verse: 'Отримання точного тексту вірша або діапазону за канонічним посиланням (OSIS).',
        get_chapter_context: 'Отримання повного розділу книги з паралельними посиланнями та контекстом.',
        get_strongs_definition: 'Отримання словникової статті Стронга (іврит/грецька) з етимологією та синонімами Тренча.',
        search_semantic: 'Семантичний векторний пошук споріднених за змістом біблійних уривків.',
        compare_translations_diff: 'Послівне diff-порівняння 15 канонічних перекладів (LCS Myers алгоритм).'
    },
    en: {
        ask_holy_bible: 'Primary theological and biblical grounding engine across 11.9M verses and 800+ languages.',
        search_keyword: 'High-speed SQLite FTS5 keyword search with morphological stemming and synonyms.',
        get_verse: 'Retrieve exact verse text or range by canonical OSIS reference.',
        get_chapter_context: 'Retrieve complete chapter context with cross-references and surrounding narrative.',
        get_strongs_definition: "Strong's Hebrew/Greek lexicon entry with Trench's Synonyms and etymology.",
        search_semantic: 'Dense semantic vector search across canonical scripture passages.',
        compare_translations_diff: 'Word-by-word diff comparison across 15 translations using Myers LCS.'
    }
};
export function getMcpDescription(toolName, lang = 'uk') {
    return MCP_LOCALES[lang]?.[toolName] || MCP_LOCALES.uk[toolName] || '';
}
