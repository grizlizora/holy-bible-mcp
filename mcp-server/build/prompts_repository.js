import { ListPromptsRequestSchema, GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { UNIVERSAL_BIBLICAL_MAPPING_RULE } from "./archetypes.js";
import { getModelTier, extractModelParamSizeB } from "./capabilities.js";
export class PromptRepositoryEngine {
    static BOLD_SYNTAX_MANDATE = `
CRITICAL MARKDOWN SYNTAX & RICH FORMATTING RULES:
1. NEVER wrap numbered list prefixes inside bold asterisks. Write "1. **Header**" NOT "** 1. **Header".
2. Use GitHub Callout Alerts for highlights:
   > [!NOTE]
   > **Історичний контекст:** ...
   > [!TIP]
   > **Пастирська порада:** ...
   > [!IMPORTANT]
   > **Богословська істина:** ...
3. Use Collapsible Sections <details><summary><b>Заголовок</b></summary>...</details> for deep optional studies.
4. Use Comparison Tables | Термін | Значення | Код | for linguistic comparisons.
5. Use Action Checklists (- [ ]) for practical life application steps.`;
    static getPromptTemplates() {
        return {
            minimal: `You are a concise Bible Guide. Give a MINIMAL response (under 40 words).
${UNIVERSAL_BIBLICAL_MAPPING_RULE}
${PromptRepositoryEngine.BOLD_SYNTAX_MANDATE}
STRICT SINGLE RESPONSE RULE:
Select EXACTLY ONE single most relevant verse quote from the provided database results.
Output section headers in the exact language used in the user's prompt (e.g. Ukrainian: <b>📖 Вірш:</b> and <b>💡 Висновок:</b>).
<b>📖 Verse / Вірш:</b>
<blockquote>"..." — <b>Book Chapter:Verse</b></blockquote>
<b>💡 Summary / Висновок:</b> <u>1 short sentence summarizing the answer.</u>`,
            verses_only: `You are a scripture extraction engine. Give a STRICT VERSES ONLY response.
${UNIVERSAL_BIBLICAL_MAPPING_RULE}
${PromptRepositoryEngine.BOLD_SYNTAX_MANDATE}
STRICT VERSES ONLY RULE:
Do NOT output long commentary, opinions, explanations, or essays. Output ONLY verified scripture verses matching the query.
Format:
> "Verse text..." — **Book Chapter:Verse**`,
            short: `You are a concise Bible Guide. Give a SHORT response (under 100 words).
${UNIVERSAL_BIBLICAL_MAPPING_RULE}
${PromptRepositoryEngine.BOLD_SYNTAX_MANDATE}
UNIVERSAL MARKDOWN FORMATTING:
• Headers: **...**
• Verses: > "..." — **Book Chapter:Verse**
• Transliterations: *šâqar*
• Strong IDs: \`H8267\` or \`G5579\`
**📖 Key Passages**
> "..." — **Book Chapter:Verse**
**🔍 Core Meaning:**
• **Old Testament:** 1 sentence with (*word*, \`H8267\`).
• **New Testament:** 1 sentence with (*word*, \`G5579\`).
**💡 Takeaway:** *1 short sentence.*`,
            medium: `You are a wise Bible Scholar. Give a BALANCED response (around 150 words).
${UNIVERSAL_BIBLICAL_MAPPING_RULE}
${PromptRepositoryEngine.BOLD_SYNTAX_MANDATE}
UNIVERSAL MARKDOWN FORMATTING SUITE:
• Section Headers: **...**
• Verses: > "..." — **Book Chapter:Verse**
• Transliterations: *šâqar*
• Strong IDs: \`H8267\` or \`G5579\`
**📖 Key Passages / Ключові Уривки**
> "..." — **Book Chapter:Verse**
**🔍 Linguistic Context & Essence / Мовний контекст & Сутність**
• **Old Testament:** Explain Hebrew root (e.g. *šâqar*, \`H8267\`).
• **New Testament:** Explain Greek root (e.g. *pseudos*, \`G5579\`).
**💡 Practical Synthesis / Підсумок для життя**
1-2 clear, practical sentences.
**🙏 For Personal Reflection:** ||Personal reflection question||`,
            detailed: `You are a detailed Bible Scholar. Provide a THOROUGH response with full language etymology, Strong's verification, and deep multi-dimensional reasoning.
${UNIVERSAL_BIBLICAL_MAPPING_RULE}
${PromptRepositoryEngine.BOLD_SYNTAX_MANDATE}
**📖 Key Scripture Passages**
> "..." — **Book Chapter:Verse**
**🔍 Detailed Linguistic & Etymological Analysis**
• **Hebrew Root Analysis:** Deep root definition, \`H8267\`.
• **Greek Root Analysis:** Deep root definition, \`G5579\`.
**🔗 Spiritual & Systemic Cross-Connections**
• Connect the topic's real-world mechanisms directly to scripture wisdom.
**💡 Synthesis & Practical Conclusion**
2-3 impactful sentences providing a balanced synthesis.
**☑ Actionable Application Steps:**
☐ Step 1
☐ Step 2`,
            deep: `You are an exhaustive Bible Scholar. Provide a DEEP THEOLOGICAL STUDY of the topic.
${UNIVERSAL_BIBLICAL_MAPPING_RULE}
${PromptRepositoryEngine.BOLD_SYNTAX_MANDATE}
**📖 Foundational Scripture Passages**
> "..." — **Book Chapter:Verse**
**🏛️ Historical & Covenantal Context**
Explain the cultural, historical, and covenantal backdrop.`
        };
    }
    static buildHydratedStudyPrompt(options) {
        const { topic, language = 'ukr', detailLevel = 'medium', modelName } = options;
        const isUkr = language === 'ukr' || language === 'uk';
        const sizeB = modelName ? (extractModelParamSizeB(modelName) || 14) : 14;
        const tier = options.modelTier || getModelTier(sizeB);
        const templates = PromptRepositoryEngine.getPromptTemplates();
        let baseTemplate = templates[detailLevel] || templates.medium;
        if (tier === 'tier1') {
            baseTemplate += `\n[TIER 1 MODEL DIRECTIVE]: Maintain ultra-concise sentences, zero decorative filler, and maximum structural clarity.`;
        }
        else if (tier === 'tier1_5') {
            baseTemplate += `\n[TIER 1.5 MODEL DIRECTIVE]: Provide balanced structured reasoning with concise scripture etymology.`;
        }
        else if (tier === 'tier2') {
            baseTemplate += `\n[TIER 2 MODEL DIRECTIVE]: Provide rich linguistic etymology and multi-dimensional covenantal analysis.`;
        }
        else if (tier === 'tier3') {
            baseTemplate += `\n[TIER 3 MODEL DIRECTIVE]: Provide deep canonical cross-mesh analysis, rich typological connections, and multi-layered hermeneutical synthesis.`;
        }
        const langRules = isUkr
            ? `STRICT LANGUAGE & CITATION RULE: Respond EXCLUSIVELY in Ukrainian. Structure your response with an introductory overview paragraph followed by 4 detailed bullet points matching the canonical 4-part trajectory: 1. **Сутність та якір**; 2. **Духовний механізм**; 3. **Практичний вияв**; 4. **Вічний плід**. Include scripture citations at the end of each bullet formatted as Ukrainian book names (e.g. 1 Коринфянам 13:4).`
            : `STRICT LANGUAGE & CITATION RULE: Respond in prompt language (${language}). Structure your response with an introductory overview paragraph followed by 4 detailed bullet points: 1. **Core Essence & Anchor**; 2. **Internal Mechanism**; 3. **Practical Manifestation**; 4. **Ultimate Fruit**. Include scripture citations at the end of each bullet.`;
        return `Study Topic: "${topic}"\n\n${langRules}\n\n${baseTemplate}`;
    }
}
export function registerPromptHandlers(server) {
    server.setRequestHandler(ListPromptsRequestSchema, async () => {
        return {
            prompts: [
                {
                    name: "holy_bible_study",
                    description: "Generates a tier-calibrated Biblical Study System Prompt complete with the 4-part canonical trajectory, bold syntax mandate, and OSIS citation rules.",
                    arguments: [
                        { name: "topic", description: "Study topic or question", required: true },
                        { name: "language", description: "Target response language ('ukr' or 'eng')", required: false },
                        { name: "detail_level", description: "Response detail level ('auto', 'verses_only', 'minimal', 'short', 'medium', 'detailed', 'deep')", required: false },
                        { name: "model_tier", description: "Target model tier ('tier1', 'tier1_5', 'tier2', 'tier3')", required: false }
                    ]
                },
                {
                    name: "biblical_guidance_prompt",
                    description: "Generates moral & worldview guidance based on the 3 Eternal Moral Axioms (Agency vs Coercion, Truth vs Deceit, Sub-creation vs Babel).",
                    arguments: [
                        { name: "question", description: "User's existential question", required: true }
                    ]
                }
            ]
        };
    });
    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        if (name === "holy_bible_study") {
            const topic = String(args?.topic || "що таке любов");
            const lang = String(args?.language || "ukr");
            const detailLevel = String(args?.detail_level || "medium");
            const hydratedText = PromptRepositoryEngine.buildHydratedStudyPrompt({
                topic,
                language: lang,
                detailLevel
            });
            return {
                description: `Holy Bible Study Prompt for topic: ${topic}`,
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: hydratedText
                        }
                    }
                ]
            };
        }
        if (name === "biblical_guidance_prompt") {
            const question = String(args?.question || "");
            return {
                description: `Biblical Guidance Prompt for: ${question}`,
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: `Question: "${question}"\n\n${UNIVERSAL_BIBLICAL_MAPPING_RULE}`
                        }
                    }
                ]
            };
        }
        throw new Error(`Unknown prompt: ${name}`);
    });
}
export function buildMetricsFooterDirective(params) {
    const { showMetrics, language, complexityScore = 65, modeLabel, accuracyScore = '96.5%', effectiveDetailLevel = 'medium' } = params;
    if (!showMetrics) {
        return `\n[METRICS FOOTER DIRECTIVE]: SHOW_METRICS IS OFF. DO NOT OUTPUT ANY METRICS BADGE OR FOOTER TEXT AT THE END OF YOUR RESPONSE.`;
    }
    const detectedLang = language ? language.toLowerCase().trim().slice(0, 3) : 'auto';
    const METRICS_TITLES = {
        ukr: { complexity: "Складність", mode: "Режим", accuracy: "Точність" },
        uk: { complexity: "Складність", mode: "Режим", accuracy: "Точність" },
        eng: { complexity: "Complexity", mode: "Mode", accuracy: "Accuracy" },
        en: { complexity: "Complexity", mode: "Mode", accuracy: "Accuracy" },
        spa: { complexity: "Complejidad", mode: "Modo", accuracy: "Precisión" },
        es: { complexity: "Complejidad", mode: "Modo", accuracy: "Precisión" },
        deu: { complexity: "Komplexität", mode: "Modus", accuracy: "Genauigkeit" },
        de: { complexity: "Komplexität", mode: "Modus", accuracy: "Genauigkeit" },
        fra: { complexity: "Complexité", mode: "Mode", accuracy: "Précision" },
        fr: { complexity: "Complexité", mode: "Mode", accuracy: "Précision" },
        pol: { complexity: "Złożoność", mode: "Tryb", accuracy: "Dokładność" },
        pl: { complexity: "Złożoność", mode: "Tryb", accuracy: "Dokładność" },
        por: { complexity: "Complexidade", mode: "Modo", accuracy: "Precisão" },
        pt: { complexity: "Complexidade", mode: "Modo", accuracy: "Precisão" },
        ita: { complexity: "Complessità", mode: "Modalità", accuracy: "Precisione" },
        it: { complexity: "Complessità", mode: "Modalità", accuracy: "Precisione" }
    };
    const MODE_TRANSLATIONS = {
        minimal: { ukr: "⚡ Мінімально", eng: "⚡ Minimal", spa: "⚡ Mínimo", deu: "⚡ Minimal", fra: "⚡ Minimal", pol: "⚡ Minimalnie", por: "⚡ Mínimo", ita: "⚡ Minimo" },
        short: { ukr: "📝 Скорочено", eng: "📝 Short", spa: "📝 Corto", deu: "📝 Kurz", fra: "📝 Court", pol: "📝 Skrócony", por: "📝 Curto", ita: "📝 Breve" },
        medium: { ukr: "⚖️ Середньо", eng: "⚖️ Balanced", spa: "⚖️ Equilibrado", deu: "⚖️ Ausgewogen", fra: "⚖️ Équilibré", pol: "⚖️ Zrównoważony", por: "⚖️ Equilibrado", ita: "⚖️ Bilanciato" },
        detailed: { ukr: "🔍 Детально", eng: "🔍 Detailed", spa: "🔍 Detallado", deu: "🔍 Detailliert", fra: "🔍 Détaillé", pol: "🔍 Szczegółowy", por: "🔍 Detalhado", ita: "🔍 Dettagliato" },
        deep: { ukr: "🏛️ Поглиблено", eng: "🏛️ Deep", spa: "🏛️ Profundo", deu: "🏛️ Tiefgehend", fra: "🏛️ Profond", pol: "🏛️ Głęboki", por: "🏛️ Profundo", ita: "🏛️ Profondo" },
        verses_only: { ukr: "📜 Тільки Вірші", eng: "📜 Verses Only", spa: "📜 Solo Versículos", deu: "📜 Nur Verse", fra: "📜 Versets Seulement", pol: "📜 Tylko Wersety", por: "📜 Apenas Versículos", ita: "📜 Solo Versetti" }
    };
    const isKnown = detectedLang !== 'auto' && Boolean(METRICS_TITLES[detectedLang] || METRICS_TITLES[detectedLang.slice(0, 2)]);
    const titles = isKnown ? (METRICS_TITLES[detectedLang] || METRICS_TITLES[detectedLang.slice(0, 2)]) : null;
    const modeValDict = MODE_TRANSLATIONS[effectiveDetailLevel] || MODE_TRANSLATIONS.medium;
    const finalModeStr = isKnown && titles ? (modeValDict[detectedLang] || modeValDict[detectedLang.slice(0, 2)] || modeLabel) : modeLabel;
    if (titles && finalModeStr) {
        return `\n---\n[UNIVERSAL METRICS FOOTER DIRECTIVE]:
At the very end of your response, output a clean single-line Markdown badge footer in the EXACT language of the user prompt:
---
📊 **${titles.complexity}:** \`${complexityScore}/100\` | ⚖️ **${titles.mode}:** \`${finalModeStr}\` | 🛡️ **${titles.accuracy}:** \`${accuracyScore}\``;
    }
    return `\n---\n[UNIVERSAL 700+ LANGUAGE DYNAMIC METRICS FOOTER DIRECTIVE]:
At the very end of your response, output a clean single-line Markdown badge footer.
CRITICAL MANDATE: Dynamically translate the 3 metric titles (Complexity, Mode, Accuracy) and mode value into the EXACT SAME LANGUAGE as the user's prompt (e.g. Ukrainian, English, Spanish, German, French, Japanese, Chinese, Turkish, etc.):
---
📊 **[Complexity in Prompt Language]:** \`${complexityScore}/100\` | ⚖️ **[Mode in Prompt Language]:** \`${effectiveDetailLevel}\` | 🛡️ **[Accuracy in Prompt Language]:** \`${accuracyScore}\``;
}
