import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListPromptsRequestSchema, GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { extractModelParamSizeB, ModelTier } from "./capabilities.js";
import { DirectiveStore } from "./directives/directive_store.js";

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
            }
          }
        ]
      };
    }

    throw new Error(`Unknown prompt: ${name}`);
  });
}

export function buildMetricsFooterDirective(params: {
  showMetrics: boolean;
  modesControlEnabled?: boolean;
  language?: string;
  complexityScore?: number;
  modeLabel?: string;
  accuracyScore?: number | string;
  effectiveDetailLevel?: string;
}): string {
  const {
    showMetrics,
    modesControlEnabled = true,
    language,
    complexityScore = 65,
    modeLabel,
    accuracyScore = '96.5%',
    effectiveDetailLevel = 'medium'
  } = params;

  const envShowMetrics = process.env.SHOW_METRICS ? !['off', 'false', '0'].includes(process.env.SHOW_METRICS.toLowerCase()) : true;
  const isMetricsEnabled = showMetrics && envShowMetrics;

  // 🛡️ ZERO-LEAKAGE: Return empty string when metrics are disabled (no prompt leakage)
  if (!isMetricsEnabled) {
    return "";
  }

  const detectedLang = language ? language.toLowerCase().trim().slice(0, 3) : 'auto';
  
  const METRICS_TITLES: Record<string, { complexity: string; mode: string; accuracy: string }> = {
    ukr: { complexity: "Складність", mode: "Режим", accuracy: "Точність" },
    uk:  { complexity: "Складність", mode: "Режим", accuracy: "Точність" },
    eng: { complexity: "Complexity", mode: "Mode", accuracy: "Accuracy" },
    en:  { complexity: "Complexity", mode: "Mode", accuracy: "Accuracy" },
    spa: { complexity: "Complejidad", mode: "Modo", accuracy: "Precisión" },
    es:  { complexity: "Complejidad", mode: "Modo", accuracy: "Precisión" },
    deu: { complexity: "Komplexität", mode: "Modus", accuracy: "Genauigkeit" },
    de:  { complexity: "Komplexität", mode: "Modus", accuracy: "Genauigkeit" },
    fra: { complexity: "Complexité", mode: "Mode", accuracy: "Précision" },
    fr:  { complexity: "Complexité", mode: "Mode", accuracy: "Précision" },
    pol: { complexity: "Złożoność", mode: "Tryb", accuracy: "Dokładność" },
    pl:  { complexity: "Złożoność", mode: "Tryb", accuracy: "Dokładność" },
    por: { complexity: "Complexidade", mode: "Modo", accuracy: "Precisão" },
    pt:  { complexity: "Complexidade", mode: "Modo", accuracy: "Precisão" },
    ita: { complexity: "Complessità", mode: "Modalità", accuracy: "Precisione" },
    it:  { complexity: "Complessità", mode: "Modalità", accuracy: "Precisione" }
  };

  const MODE_TRANSLATIONS: Record<string, Record<string, string>> = {
    minimal:     { ukr: "⚡ Мінімально", eng: "⚡ Minimal", spa: "⚡ Mínimo", deu: "⚡ Minimal", fra: "⚡ Minimal", pol: "⚡ Minimalnie", por: "⚡ Mínimo", ita: "⚡ Minimo" },
    short:       { ukr: "📝 Скорочено", eng: "📝 Short", spa: "📝 Corto", deu: "📝 Kurz", fra: "📝 Court", pol: "📝 Skrócony", por: "📝 Curto", ita: "📝 Breve" },
    medium:      { ukr: "⚖️ Середньо", eng: "⚖️ Balanced", spa: "⚖️ Equilibrado", deu: "⚖️ Ausgewogen", fra: "⚖️ Équilibré", pol: "⚖️ Zrównoważony", por: "⚖️ Equilibrado", ita: "⚖️ Bilanciato" },
    detailed:    { ukr: "🔍 Детально", eng: "🔍 Detailed", spa: "🔍 Detallado", deu: "🔍 Detailliert", fra: "🔍 Détaillé", pol: "🔍 Szczegółowy", por: "🔍 Detalhado", ita: "🔍 Dettagliato" },
    deep:        { ukr: "🏛️ Поглиблено", eng: "🏛️ Deep", spa: "🏛️ Profundo", deu: "🏛️ Tiefgehend", fra: "🏛️ Profond", pol: "🏛️ Głęboki", por: "🏛️ Profundo", ita: "🏛️ Profondo" },
    verses_only: { ukr: "📜 Тільки Вірші", eng: "📜 Verses Only", spa: "📜 Solo Versículos", deu: "📜 Nur Verse", fra: "📜 Versets Seulement", pol: "📜 Tylko Wersety", por: "📜 Apenas Versículos", ita: "📜 Solo Versetti" }
  };

  const isKnown = detectedLang !== 'auto' && Boolean(METRICS_TITLES[detectedLang] || METRICS_TITLES[detectedLang.slice(0, 2)]);
  const titles = isKnown ? (METRICS_TITLES[detectedLang] || METRICS_TITLES[detectedLang.slice(0, 2)]) : { complexity: "Complexity", mode: "Mode", accuracy: "Accuracy" };
  const modeValDict = MODE_TRANSLATIONS[effectiveDetailLevel] || MODE_TRANSLATIONS.medium;
  const finalModeStr = isKnown && titles ? (modeValDict[detectedLang] || modeValDict[detectedLang.slice(0, 2)] || modeLabel) : modeLabel;

  if (modesControlEnabled && effectiveDetailLevel !== 'unrestricted' && finalModeStr) {
    return `\n---\n[UNIVERSAL METRICS FOOTER DIRECTIVE]:
At the very end of your response, output a clean single-line Markdown badge footer in the EXACT language of the user prompt:
---
📊 **${titles.complexity}:** \`${complexityScore}/100\` | ⚖️ **${titles.mode}:** \`${finalModeStr}\` | 🛡️ **${titles.accuracy}:** \`${accuracyScore}\``;
  }

  return `\n---\n[UNIVERSAL METRICS FOOTER DIRECTIVE]:
At the very end of your response, output a clean single-line Markdown badge footer in the EXACT language of the user prompt:
---
📊 **${titles.complexity}:** \`${complexityScore}/100\` | 🛡️ **${titles.accuracy}:** \`${accuracyScore}\``;
}
