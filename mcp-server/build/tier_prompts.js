import { UNIVERSAL_BIBLICAL_MAPPING_RULE } from './archetypes.js';
export const BOLD_SYNTAX_MANDATE = `CRITICAL BOLD SYNTAX MANDATE: Write numbered items like "1. **Header** — description". NEVER put double-asterisks before numbers (ABSOLUTELY FORBIDDEN: "** 1. **", "**1. **", "** 2. **").`;
export const UKRAINIAN_CANONICAL_TRAJECTORY = `Structure your response with an introductory overview paragraph followed by 4 detailed bullet points matching the canonical 4-part trajectory:
1. **Сутність та якір** (Core Essence & Scripture Anchor);
2. **Духовний механізм** (Internal Spiritual Mechanism);
3. **Практичний вияв** (Practical Daily Manifestation);
4. **Вічний плід** (Ultimate Eternal Fruit).
Include scripture citations at the end of each bullet formatted with Ukrainian book names (e.g. 1 Коринфянам 13:4).`;
export const ENGLISH_CANONICAL_TRAJECTORY = `Structure your response with an introductory overview paragraph followed by 4 detailed bullet points matching the canonical 4-part trajectory:
1. **Core Essence & Anchor**;
2. **Internal Mechanism**;
3. **Practical Manifestation**;
4. **Ultimate Fruit**.
Include scripture citations at the end of each bullet formatted with standard OSIS codes (e.g. 1CO 13:4).`;
export const PROMPT_TEMPLATES = {
    minimal: `⚡ MINIMAL MODE (Under 40 words):
- State the direct answer in ONE clear sentence.
- Include exactly ONE relevant verse quote/reference.
- Zero introductory fluff or meta commentary.
${BOLD_SYNTAX_MANDATE}`,
    short: `📝 SHORT MODE (Under 100 words):
- Start with a direct definition/answer.
- Provide 1-2 key scripture verses with brief explanation.
- End with one practical takeaway sentence.
${BOLD_SYNTAX_MANDATE}`,
    medium: `⚖️ MEDIUM MODE (Balanced Theological Answer):
- Concise overview paragraph.
- 2-3 key scripture passages with contextual breakdown.
- Clear practical application for daily Christian living.
${BOLD_SYNTAX_MANDATE}
${UNIVERSAL_BIBLICAL_MAPPING_RULE}`,
    detailed: `🔍 DETAILED MODE (In-Depth Theological Analysis):
- Full contextual analysis with Hebrew/Greek etymology and Strong's codes.
- 3-5 scripture passages from OT and NT.
- Systematic breakdown of spiritual mechanisms and modern application.
${BOLD_SYNTAX_MANDATE}
${UNIVERSAL_BIBLICAL_MAPPING_RULE}`,
    deep: `🏛️ DEEP MODE (360° Canonical Research):
- Full 4-stage trajectory: OT Shadow -> NT Fulfillment -> Practical Application -> Eschatological/Eternal Fruit.
- Comprehensive Strong's etymology (Hebrew H#### / Greek G####).
- Multi-dimensional worldview analysis (Axioms of Agency, Truth, Sub-creation).
${BOLD_SYNTAX_MANDATE}
${UNIVERSAL_BIBLICAL_MAPPING_RULE}`,
    verses_only: `📜 VERSES ONLY MODE:
- Return ONLY direct verbatim scripture quotes from the database.
- Do NOT add any human commentary, reflection, or introduction.`
};
/**
 * 🎛️ Dynamic Open-Source 4-Tier Prompt Builder Engine
 * Dynamically builds tier-tuned system & user prompts for models from 4B to 70B+
 */
export function buildTierPrompt(options) {
    const { tier = 'tier2', mode = 'medium', language = 'ukr', topic = '', complexityScore = 60 } = options;
    const isUkr = language === 'ukr';
    const trajectory = isUkr ? UKRAINIAN_CANONICAL_TRAJECTORY : ENGLISH_CANONICAL_TRAJECTORY;
    const langRule = isUkr ? 'Respond EXCLUSIVELY in Ukrainian.' : 'Respond EXCLUSIVELY in English.';
    const template = PROMPT_TEMPLATES[mode] || PROMPT_TEMPLATES.medium;
    let tierGuidance = '';
    if (tier === 'tier1') {
        tierGuidance = `[TIER 1 OPTIMIZATION (<=8.5B)]:
- Output high-density concise prose. Maximize direct scripture grounding. Start IMMEDIATELY with the core definition.
- Zero rhetorical preamble. Max Think Chars: 1500.`;
    }
    else if (tier === 'tier1_5') {
        tierGuidance = `[TIER 1.5 OPTIMIZATION (8.5B-10.5B)]:
- Output clear, balanced prose. Focus on practical application and exact scripture fidelity. Max Think Chars: 2000.`;
    }
    else if (tier === 'tier2') {
        tierGuidance = `[TIER 2 OPTIMIZATION (10.5B-13.5B)]:
- Provide thorough analytical exposition. Explore Hebrew/Greek etymology and canonical parallels. Max Think Chars: 3500.`;
    }
    else {
        tierGuidance = `[TIER 3 OPTIMIZATION (>13.5B / 70B)]:
- Provide deep multi-dimensional theological synthesis. Connect Old Testament shadows, Covenantal trajectory, and existential Christian living. Max Think Chars: 4500.`;
    }
    return `You are an AI Super-Assistant grounded in Biblical Scripture.
Topic/Question: "${topic}"

${langRule}
${template}

${trajectory}

${tierGuidance}

[QUERY COMPLEXITY RATING: ${complexityScore}/100 | MODE: ${mode.toUpperCase()}]`;
}
