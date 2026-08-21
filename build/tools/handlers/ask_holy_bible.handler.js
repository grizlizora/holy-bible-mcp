import { resolveEffectiveMode } from "../../archetypes.js";
import { estimatePromptComplexity, extractModelParamSizeB } from "../../capabilities.js";
import { DirectiveStore } from "../../directives/directive_store.js";
import { resolveLanguageCode, extractBiblicalSearchKeywords, getGlobalConfig } from "../../services/language_resolver.js";
import { VerseContextRetriever } from "./ask_holy_bible/verse_context_retriever.js";
import { TelemetryCalculator } from "./ask_holy_bible/telemetry_calculator.js";
import { PromptContextComposer } from "./ask_holy_bible/prompt_context_composer.js";
export async function handleAskHolyBible(args) {
    const question = String(args?.question || args?.userMessage || "що таке любов");
    const lang = String(args?.language || args?.lang || "auto");
    const settings = args?.settings || {};
    const envModesControl = process.env.MODES_CONTROL || process.env.MCP_MODES_CONTROL;
    const envWarmthControl = process.env.WARMTH_CONTROL || process.env.MCP_WARMTH_CONTROL;
    const modesEnvActive = envModesControl ? !["off", "false", "0", "no"].includes(envModesControl.toLowerCase().trim()) : true;
    const warmthEnvActive = envWarmthControl ? !["off", "false", "0", "no"].includes(envWarmthControl.toLowerCase().trim()) : true;
    const warmthControlEnabled = warmthEnvActive && settings.warmthControlEnabled !== false && args?.warmthControlEnabled !== false;
    const modesControlEnabled = modesEnvActive && settings.modesControlEnabled !== false && args?.modesControlEnabled !== false;
    const globalConfig = getGlobalConfig();
    const warmth = warmthControlEnabled
        ? (typeof args?.warmth === "number" ? args.warmth : (typeof settings.warmth === "number" ? settings.warmth : globalConfig.warmth))
        : null;
    const requestedMode = modesControlEnabled
        ? String(args?.mode || settings.detailLevel || globalConfig.mode)
        : 'unrestricted';
    const rawParamSize = TelemetryCalculator.parseParamSize(args?.parameter_size_b) ??
        TelemetryCalculator.parseParamSize(args?.modelMetadata?.parameterSize) ??
        TelemetryCalculator.parseParamSize(args?.modelMetadata?.parameter_size_b) ??
        TelemetryCalculator.parseParamSize(args?.parameterSize) ??
        TelemetryCalculator.parseParamSize(args?.paramSizeB);
    let paramSizeB;
    if (rawParamSize !== null) {
        paramSizeB = rawParamSize;
    }
    else if (args?.isSmallModel === true || args?.modelMetadata?.isSmallModel === true) {
        paramSizeB = 4.0;
    }
    else {
        const rawModelName = (typeof args?.modelMetadata?.modelName === 'string' && args.modelMetadata.modelName) ? args.modelMetadata.modelName :
            (typeof args?.selectedModel === 'string' && args.selectedModel) ? args.selectedModel :
                (typeof args?.modelName === 'string' && args.modelName && args.modelName !== question) ? args.modelName :
                    '';
        if (rawModelName) {
            paramSizeB = extractModelParamSizeB(rawModelName);
        }
        else {
            paramSizeB = 14.0;
        }
    }
    const detectedLang = resolveLanguageCode(lang, question);
    const keywords = extractBiblicalSearchKeywords(question);
    // 1. Retrieve Verses
    const verses = await VerseContextRetriever.retrieveVerses(keywords, detectedLang, 6);
    const store = DirectiveStore.getInstance();
    const tier = store.resolveTierByParamSize(paramSizeB);
    const tierName = tier.nameDisplay || 'Standard';
    const complexityScoreObj = estimatePromptComplexity(question);
    const effectiveMode = modesControlEnabled ? resolveEffectiveMode(requestedMode, complexityScoreObj.score, question, paramSizeB) : 'unrestricted';
    const maxVersesLimit = (!modesControlEnabled || effectiveMode === 'unrestricted')
        ? (paramSizeB <= 8.5 ? 2 : 4)
        : (store.getMode(effectiveMode)?.maxVerses || 6);
    const selectedVerses = verses.slice(0, maxVersesLimit);
    const sensInfo = (warmthControlEnabled && warmth !== null) ? store.resolveWarmth(warmth, detectedLang) : null;
    // 2. Compose Full Grounding Context
    const fullContextText = PromptContextComposer.compose({
        question,
        detectedLang,
        paramSizeB,
        tier,
        tierName,
        effectiveMode,
        requestedMode,
        complexityScore: complexityScoreObj.score,
        warmthControlEnabled,
        modesControlEnabled,
        sensInfo,
        verses: selectedVerses
    });
    const accuracyScoreStr = TelemetryCalculator.computeAccuracy(verses.length > 0, tier.tierId, effectiveMode);
    const isCotAllowed = Boolean(tier.supportsCot && tier.supportsCot !== 0);
    const resultObj = {
        contextText: fullContextText,
        complexityScore: complexityScoreObj.score,
        effectiveDetailLevel: effectiveMode,
        modelTier: tier.tierId,
        modelTierName: tierName,
        detectedParamSize: paramSizeB,
        supportsCot: isCotAllowed,
        maxThinkChars: isCotAllowed ? (tier.maxThinkChars || 0) : 0,
        sensitivityProfile: sensInfo,
        accuracyScore: accuracyScoreStr,
        warmthControlActive: warmthControlEnabled,
        modesControlActive: modesControlEnabled,
        verses: verses.map(v => ({ book: v.book, chapter: v.chapter, verse: v.verse, text: v.text, language: v.language }))
    };
    return {
        content: [{ type: "text", text: JSON.stringify(resultObj, null, 2) }]
    };
}
