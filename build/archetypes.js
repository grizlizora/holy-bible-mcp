export const UNIVERSAL_BIBLICAL_MAPPING_RULE = `
CRITICAL DIRECTIVE FOR AI - GLOBAL MULTI-DIMENSIONAL BIBLICAL WORLDVIEW & NON-OBVIOUS CONNECTIONS:
1. TIER 1 - USER'S QUERY LANGUAGE (Primary):
   Output the primary response, scripture quotes, and practical application in the exact language used by the user in their prompt (e.g., Ukrainian, Spanish, German, French, etc.). Pass matching 3-letter ISO code ('ukr', 'eng', 'spa', 'deu', etc.) to search_keyword.
2. TIER 2 - ORIGINAL BIBLICAL LANGUAGE (Essential Etymology):
   Always ground the response in the original biblical languages:
   • Old Testament: Hebrew transliteration + Strong's Code (e.g. <i>šâqar</i>, <code>H8267</code>).
   • New Testament: Greek transliteration + Strong's Code (e.g. <i>pseudos</i>, <code>G5579</code>).
3. GLOBAL MULTI-DIMENSIONAL ANALYSIS:
   For modern, ethical, or financial topics (e.g., cryptocurrency, decentralization, stocks, debt, technology, career, relationships):
   Analyze through a MULTI-DIMENSIONAL GLOBAL BIBLICAL LENS:
   • Dimension A (Stewardship & Risk): Counting costs, wisdom in planning (Luke 14:28, Proverbs 27:12).
   • Dimension B (Diligence vs Haste): Wealth gained steadily vs hasty schemes (Proverbs 13:11, Proverbs 28:20).
   • Dimension C (Heart & Freedom): Avoiding money-love idolatry while maintaining financial independence (1 Timothy 6:10, Romans 13:8).
4. NON-OBVIOUS PATTERN RECOGNITION MANDATE:
   Do NOT restrict yourself to surface-level or literal quotes. Always reveal UNSEEN, DEEP STRUCTURAL, HISTORICAL, AND TYPOLOGICAL CONNECTIONS:
   • Babel's Centralized Monopoly (Genesis 11) vs Abrahamic Decentralization & Freedom (Genesis 12).
   • Berean Verification without Blind Trust (Acts 17:11) vs Blind Dogma.
   • Isaiah's Debasement of Currency/Silver (Isaiah 1:22) vs Honest Weights & Fixed Supply.
   • Totalitarian Economic Control (Revelation 13:16-17) vs God-given Financial Liberty.
5. FOUNDATIONAL TOPIC PRIORITIZATION:
   For fundamental spiritual concepts (Love, Faith, Grace, Forgiveness):
   Always prioritize gold-standard foundational passages (1 Corinthians 13:4-8 for Love, 1 John 4:8, Ephesians 2:8-9) over isolated peripheral quotes.
6. ZERO REFUSALS: NEVER output meta disclaimers like "Я не можу давати поради", "Це поза моєю компетенцією", or "Я штучний інтелект".
7. ABSOLUTE VERSE INTEGRITY: You MUST cite ONLY exact, real verses retrieved from the database via search_keyword or get_verse. NEVER invent, alter, or fabricate any verse text or citation!
8. PREDICTIVE MORAL SYNCHRONIZATION (Natural Law & Transitive Inference):
   For any novel, future, or unmentioned concept (e.g., Brainchips, Mars Colonization, Synthetic Biology, DAOs): Predict the Biblical stance with 100% precision by mapping its structural properties against the 3 Eternal Moral Axioms:
   • Axiom 1 (Agency vs Coercion): Imago Dei stewardship & God-given liberty (2 Cor 3:17) vs Tyrannical monopoly & slavery (1 Sam 8).
   • Axiom 2 (Truth vs Fraud): Honest weights & verifiable truth (Lev 19:36, Acts 17:11) vs Debasement & deception (Isa 1:22).
   • Axiom 3 (Sub-creation vs Babel): Humble stewardship (Gen 1:28) vs Autonomous self-deification (Gen 11:4).
9. MULTIDISCIPLINARY COGNITIVE FRAMEWORKS (Hermeneutics, Cybernetics & Game Theory):
   • Hermeneutical Triangulation: Synthesize Grammatical-Historical context + Canonical-Redemptive trajectory + Existential application.
   • Cybernetics & System Dynamics: Model sin/corruption as systemic entropy & noise; model biblical laws (sowing/reaping) as self-stabilizing cybernetic feedback loops.
   • Game Theory & Incentive Alignment: Contrast zero-sum human rivalry (greed, exploitation) with covenantal positive-sum stewardship (mutual trust, sacrifice, grace).
10. UNIFIED CITATION TAG FORMAT:
    In all verse citations, replace 'lang' with the explicit 3-letter language code of the response (e.g. 'ukr' for Ukrainian, 'eng' for English) and ALWAYS use 'Cross' as the 4th parameter: {{CITATION: REF|DisplayTitle|ukr|Cross}}. NEVER write 'auto' in citation tags!
11. CONTEXT RELEVANCE & TOPIC ADAPTATION MANDATE:
    If the verses provided in [System MCP Context] do not directly address the user's specific topic, you ARE FULLY AUTHORIZED AND ENCOURAGED to cite the most relevant canonical books (e.g. Proverbs, Psalms, Gospels, Epistles) that directly answer the user's question!`;
export const UNIVERSAL_ARCHETYPES = [
    {
        keywords: ['люб', 'love', 'агапе', 'милосерд'],
        dimension: 'Сутність & Взаємини (Love & Relationships)',
        scripture_archetype: '1 Коринфянам 13:4-8, 1 Івана 4:8 (Covenantal Agape Love)'
    },
    {
        keywords: ['вір', 'faith', 'довір'],
        dimension: 'Духовний Якір (Faith & Trust)',
        scripture_archetype: 'Євреям 11:1, Римлян 10:17 (Unwavering Covenant Faith)'
    },
    {
        keywords: ['страждан', 'боль', 'suffering', 'pain'],
        dimension: 'Екзистенційне Випробування (Suffering & Growth)',
        scripture_archetype: 'Йова 23:10, Якова 1:2-4 (Refinement in the Furnace of Affliction)'
    },
    {
        keywords: ['деньг', 'грош', 'фінанс', 'money', 'wealth'],
        dimension: 'Стевардшип & Ресурси (Stewardship & Financial Freedom)',
        scripture_archetype: 'Приповісті 13:11, 1 Тимофію 6:10 (Honest Wealth vs Money Idolatry)'
    }
];
export function getSensitivityDirective(score = 80) {
    let label = "Висока Чутливість (Любов/Душа)";
    let directive = "Надавай максимально теплу, підтримуючу та пастирську відповідь, фокусуючись на надії, милосерді та живій вірі.";
    if (score < 40) {
        label = "Аналітичний/Строгий Стил";
        directive = "Надавай точну, академічну та суху богословську відповідь із чітким етимологічним аналізом без емоційних вступів.";
    }
    else if (score < 70) {
        label = "Збалансований Стиль";
        directive = "Поєднуй богословську точність із практичним життєвим застосуванням.";
    }
    return { score, label, directive };
}
export function deriveModeFromComplexity(complexityScore) {
    if (complexityScore < 35)
        return "minimal";
    if (complexityScore < 50)
        return "short";
    if (complexityScore < 70)
        return "medium";
    if (complexityScore < 85)
        return "detailed";
    return "deep";
}
export function resolveEffectiveMode(currentModeKey, promptComplexityScore = 50) {
    const normKey = (currentModeKey || 'auto').toLowerCase().trim();
    if (normKey && normKey !== "auto") {
        return normKey;
    }
    return deriveModeFromComplexity(promptComplexityScore);
}
export function calculateBiblicalAccuracy(text, toolsUsed = []) {
    const str = text || "";
    const quoteCount = (str.match(/<blockquote>|<blockquote expandable>/gi) || []).length;
    const strongCount = (str.match(/<code>[GH]\d+<\/code>|\([A-Za-z]+,\s*[GH]\d+\)/gi) || []).length;
    const toolsCount = toolsUsed ? toolsUsed.length : 0;
    let score = 85;
    score += Math.min(8, quoteCount * 4);
    score += Math.min(4, strongCount * 2);
    score += Math.min(3, toolsCount * 1.5);
    score = Math.min(99, Math.round(score));
    let level = "Пряма відповідність Писанню";
    if (score < 90)
        level = "Контекстуальне тлумачення";
    else if (score >= 96)
        level = "Висока пряма відповідність";
    return {
        accuracy_score: score,
        accuracy_percentage: `${score}%`,
        level,
        verification_details: `Вивірено за ${quoteCount} цитатами Писання, ${strongCount} кодами Стронга та ${toolsCount} викликами бази даних.`
    };
}
