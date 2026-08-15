import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListPromptsRequestSchema, GetPromptRequestSchema, McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { extractModelParamSizeB, ModelTier } from "./capabilities.js";
import { DirectiveStore } from "./directives/directive_store.js";
import { getSensitivityDirective } from "./archetypes.js";

export interface PromptBuildOptions {
  topic: string;
  language?: string;
  detailLevel?: string;
  modelTier?: ModelTier;
  modelName?: string;
}

export class PromptRepositoryEngine {
  public static getPromptTemplates(): Record<string, string> {
    const store = DirectiveStore.getInstance();
    const modes = store.getAllModes();
    const result: Record<string, string> = {};
    for (const m of modes) {
      result[m.modeKey] = m.templateBody || m.structureMandate;
    }
    return result;
  }

  public static buildHydratedStudyPrompt(options: PromptBuildOptions): string {
    const { topic, language = 'ukr', detailLevel = 'medium', modelName } = options;
    const isUkr = language === 'ukr' || language === 'uk';
    const sizeB = modelName ? (extractModelParamSizeB(modelName) || 14) : 14;
    const store = DirectiveStore.getInstance();
    const tier = store.resolveTierByParamSize(sizeB);

    const modeObj = store.getMode(detailLevel as any) || store.getMode('medium');
    let baseTemplate = modeObj?.templateBody || modeObj?.structureMandate || '';

    if (tier?.systemDirective) {
      baseTemplate += `\n${tier.systemDirective}`;
    }

    const langRules = isUkr
      ? `STRICT LANGUAGE & CITATION RULE: Respond EXCLUSIVELY in Ukrainian. Structure your response with an introductory overview paragraph followed by 4 detailed bullet points matching the canonical 4-part trajectory: 1. **Сутність та якір**; 2. **Духовний механізм**; 3. **Практичний вияв**; 4. **Вічний плід**. Include scripture citations at the end of each bullet formatted as Ukrainian book names (e.g. 1 Коринфянам 13:4).`
      : `STRICT LANGUAGE & CITATION RULE: Respond in prompt language (${language}). Structure your response with an introductory overview paragraph followed by 4 detailed bullet points: 1. **Core Essence & Anchor**; 2. **Internal Mechanism**; 3. **Practical Manifestation**; 4. **Ultimate Fruit**. Include scripture citations at the end of each bullet.`;

    return `Study Topic: "${topic}"\n\n${langRules}\n\n${baseTemplate}`;
  }
}

export function registerPromptHandlers(server: Server): void {
  // 1. List All Available Prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: "theological_exegesis",
          description: "Generates an in-depth Historical-Grammatical & Canonical Exegesis on a scripture passage or doctrinal topic.",
          arguments: [
            { name: "topic_or_verse", description: "Scripture passage or theological topic (e.g. 'Romans 8:28' or 'Justification by Faith')", required: true },
            { name: "target_audience", description: "Target audience: 'academic' | 'pastoral' | 'seeker' | 'general'", required: false },
            { name: "depth", description: "Expository depth: 'introductory' | 'comprehensive' | 'scholarly'", required: false },
            { name: "language", description: "Output language code ('ukr', 'eng')", required: false }
          ]
        },
        {
          name: "parallel_translation_comparison",
          description: "Compares a single verse across multiple canonical translations (KJV, UBIO, NIV, ESV, SYNOD) with manuscript and linguistic analysis.",
          arguments: [
            { name: "verse", description: "Exact verse reference (e.g. 'John 1:1', 'Івана 3:16')", required: true },
            { name: "translations", description: "Comma-separated translations (e.g. 'KJV,UBIO,NIV,ESV,SYNOD')", required: false },
            { name: "analysis_focus", description: "Focus of comparison: 'lexical' | 'doctrinal' | 'stylistic'", required: false }
          ]
        },
        {
          name: "pastoral_devotional",
          description: "Generates empathetic pastoral encouragement and devotional reflection for a specific life situation.",
          arguments: [
            { name: "life_situation", description: "The trial, circumstance, or question (e.g. 'grief over loss', 'loneliness', 'anxiety about future')", required: true },
            { name: "emotional_state", description: "Current emotional state of the reader", required: false },
            { name: "warmth", description: "Warmth & empathy score (0-100, default 80)", required: false },
            { name: "language", description: "Target language ('ukr', 'eng')", required: false }
          ]
        },
        {
          name: "original_languages_deep_dive",
          description: "Performs exhaustive original Greek or Hebrew word study with Strong's Concordance, morphological breakdown, and Septuagint (LXX) usage.",
          arguments: [
            { name: "query", description: "Strong's number (e.g. 'G26', 'H1254') or biblical lemma/word", required: true },
            { name: "focus_aspects", description: "Focus area: 'morphology' | 'syntax' | 'theological_weight'", required: false },
            { name: "language", description: "Response language ('ukr', 'eng')", required: false }
          ]
        },
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

  // 2. Get & Hydrate Specific Prompt
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "theological_exegesis": {
        const passage = String(args?.topic_or_verse || "Romans 8:28");
        const audience = String(args?.target_audience || "pastoral");
        const depth = String(args?.depth || "comprehensive");
        const lang = String(args?.language || "ukr");

        const promptText = `
[ROLE & CONTEXT: THEOLOGICAL EXEGESIS ENGINE]
Target Passage / Doctrine: "${passage}"
Audience Calibration: ${audience.toUpperCase()}
Analytical Depth: ${depth.toUpperCase()}
Target Language: ${lang.toUpperCase()}

Execute a rigorous, Christ-centered, historical-grammatical exegesis structured strictly as follows:
1. **Historical & Canonical Setting**: Author, recipients, historical setting, literary genre, and immediately preceding/succeeding context.
2. **Original Language & Morphological Nuances**: Key Greek/Hebrew terms, grammatical structure, significant verb tenses (e.g. Aorist, Imperfect), and lexical range.
3. **Core Exegetical Proposition**: The central theological truth revealed by the Holy Spirit through the author.
4. **Doctrinal & Redemptive Trajectory**: How this passage points to Christ, aligns with systematic theology (Grace, Covenant, Redemption), and harmonizes with the broader canon.
5. **Applied Praxis & Pastoral Exhortation**: Direct, convicting, yet grace-infused applications for faith, ethics, and community life.

Citations Mandate: Quote verified scripture verses accurately with full chapter and verse references.
`;
        return {
          description: `Theological Exegesis on ${passage}`,
          messages: [{ role: "user", content: { type: "text", text: promptText.trim() } }]
        };
      }

      case "parallel_translation_comparison": {
        const verse = String(args?.verse || "John 3:16");
        const translations = String(args?.translations || "KJV, UBIO, NIV, ESV, SYNOD");
        const focus = String(args?.analysis_focus || "lexical");

        const promptText = `
[ROLE & CONTEXT: COMPARATIVE TRANSLATION SCHOLAR]
Verse Reference: "${verse}"
Target Comparison Translations: ${translations}
Analytical Focus: ${focus.toUpperCase()}

Perform an objective, scholarly comparison across the requested translations:
1. **Parallel Table Display**: Output the exact text of "${verse}" in each requested translation formatted as a clean Markdown table.
2. **Textual Basis & Manuscript Traditions**: Detail differences arising from underlying manuscripts (e.g. Textus Receptus, Byzantine Majority Text, Nestle-Aland / UBS Critical Text).
3. **Translation Philosophy Analysis**: Distinguish Formal Equivalence (word-for-word) vs Dynamic Equivalence (thought-for-thought) nuances.
4. **Key Lexical Highlights**: Explain specific vocabulary choices and original language nuances.
5. **Synthesis & Clarity Recommendation**: Summarize how each translation enriches the reader's understanding.
`;
        return {
          description: `Parallel Translation Comparison for ${verse}`,
          messages: [{ role: "user", content: { type: "text", text: promptText.trim() } }]
        };
      }

      case "pastoral_devotional": {
        const lifeSituation = String(args?.life_situation || "facing difficult trials");
        const emotionalState = String(args?.emotional_state || "anxious and weary");
        const warmthScore = parseInt(String(args?.warmth || "80"), 10);
        const lang = String(args?.language || "ukr");

        const warmthDirective = getSensitivityDirective(warmthScore, lang);

        const promptText = `
[ROLE & CONTEXT: EMPATHETIC PASTORAL SHEPHERD]
Life Situation: "${lifeSituation}"
Emotional State: "${emotionalState}"
Warmth & Empathy Calibration: ${warmthDirective.label} (${warmthDirective.score}/100)

${warmthDirective.directive}

Construct an authentic, grace-filled pastoral devotional that brings healing and truth:
1. **Empathetic Presence & Validation**: Acknowledge the emotional weight and reality of this trial with profound Christian love and zero judgment.
2. **Scriptural Anchor & God's Character**: Present 2-3 authentic scripture promises highlighting God's faithfulness, sovereign goodness, and lovingkindness.
3. **Spiritual Reframing**: Provide a gentle, gospel-centered perspective on how God works in suffering and weakness.
4. **Practical Step of Faith**: Give 1-2 practical, actionable steps for today (e.g. prayer of release, scripture meditation, seeking Christian fellowship).
5. **Pastoral Prayer of Blessing**: Close with a heartfelt, conversational prayer addressing the Lord directly on behalf of the person.
`;
        return {
          description: `Pastoral Devotional for: ${lifeSituation}`,
          messages: [{ role: "user", content: { type: "text", text: promptText.trim() } }]
        };
      }

      case "original_languages_deep_dive": {
        const query = String(args?.query || "G26");
        const focus = String(args?.focus_aspects || "theological_weight");
        const lang = String(args?.language || "ukr");

        const promptText = `
[ROLE & CONTEXT: BIBLICAL HEBREW & GREEK PHILOLOGIST]
Query / Lemma / Strong's: "${query}"
Focus Aspect: ${focus.toUpperCase()}
Language: ${lang.toUpperCase()}

Execute an exhaustive original-language philological study:
1. **Lemma & Identification**: Original script (Hebrew/Greek), transliteration, Strong's concordance number, root etymology, and pronunciation.
2. **Semantic Range & Lexicon Definitions**: Thayer's / Brown-Driver-Briggs definitions and historical lexical development.
3. **Old Testament Septuagint (LXX) or New Testament Usage**: How the term translates across covenants and its frequency in canonical corpora (Pauline, Johannine, Pentateuch).
4. **Theological Significance**: Doctrinal depth and covenantal weight of this term in redemptive history.
5. **Exemplary Biblical Occurrences**: 3 pivotal verses featuring this term with word-in-context analysis.
`;
        return {
          description: `Original Languages Deep Dive for: ${query}`,
          messages: [{ role: "user", content: { type: "text", text: promptText.trim() } }]
        };
      }

      case "holy_bible_study": {
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
          messages: [{ role: "user", content: { type: "text", text: hydratedText } }]
        };
      }

      case "biblical_guidance_prompt": {
        const question = String(args?.question || "");
        const promptText = `
[ROLE: ETERNAL MORAL AXIOMS COUNSEL]
Question: "${question}"

Evaluate this ethical question through the lens of the 3 Eternal Moral Axioms:
1. **Agency vs Coercion (Свобода вибору проти примусу)**: God respects human free will and covenant love.
2. **Truth vs Deceit (Істина проти обману)**: Alignment with God's revealed truth vs rationalized compromise.
3. **Sub-creation vs Babel (Творення на славу Бога проти Вавилону)**: Building life for eternal fruit vs self-exaltation.
Provide actionable biblical wisdom grounded in scripture.
`;
        return {
          description: `Biblical Guidance Prompt for: ${question}`,
          messages: [{ role: "user", content: { type: "text", text: promptText.trim() } }]
        };
      }

      default:
        throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt name: ${name}`);
    }
  });
}
