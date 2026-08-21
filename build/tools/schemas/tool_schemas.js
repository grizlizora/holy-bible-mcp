import { z } from "zod";
const ParamSizeSchema = z.union([z.number(), z.string()]).optional().transform((val) => {
    if (typeof val === "string") {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? undefined : parsed;
    }
    return val;
});
export const AskHolyBibleSchema = z.object({
    question: z.string().optional(),
    userMessage: z.string().optional(),
    language: z.string().optional().default("ukr"),
    lang: z.string().optional(),
    mode: z.enum(["auto", "verses_only", "minimal", "short", "medium", "detailed", "deep", "unrestricted"]).optional().default("auto"),
    warmth: z.number().min(0).max(100).optional(),
    parameter_size_b: ParamSizeSchema,
    paramSizeB: ParamSizeSchema,
    modelName: z.string().optional(),
    selectedModel: z.string().optional(),
    isSmallModel: z.boolean().optional(),
    warmthControlEnabled: z.boolean().optional(),
    modesControlEnabled: z.boolean().optional(),
    settings: z.record(z.string(), z.any()).optional(),
    modelMetadata: z.record(z.string(), z.any()).optional()
}).passthrough();
export const SearchKeywordSchema = z.object({
    keyword: z.string().min(1, "Keyword cannot be empty"),
    translation: z.string().optional(),
    limit: z.number().optional().default(10)
});
export const GetVerseSchema = z.object({
    book: z.string().optional(),
    chapter: z.number().optional(),
    verse: z.number().optional(),
    language: z.string().optional()
});
export const GetChapterContextSchema = z.object({
    book: z.string().min(1, "Book cannot be empty"),
    chapter: z.number(),
    language: z.string().optional()
});
export const GetCommentarySchema = z.object({
    book: z.string().min(1, "Book cannot be empty"),
    chapter: z.number(),
    verse: z.number()
});
export const GetStrongsDefinitionSchema = z.object({
    word_id: z.string().min(1, "word_id cannot be empty")
});
export const SearchSemanticSchema = z.object({
    concept: z.string().min(1, "concept cannot be empty")
});
export const SearchTopicSchema = z.object({
    topic: z.string().min(1, "topic cannot be empty"),
    limit: z.number().optional().default(10)
});
export const SetRelevanceSensitivitySchema = z.object({
    score: z.number().min(0).max(100)
});
export const SetResponseModeSchema = z.object({
    mode: z.enum(["auto", "minimal", "short", "medium", "detailed", "deep", "verses_only"])
});
export const SetShowMetricsSchema = z.object({
    enabled: z.boolean().optional(),
    status: z.enum(["on", "off"]).optional()
});
export const GetP2pSwarmStatusSchema = z.object({});
export const GetMcpCapabilitiesSchema = z.object({
    client_host: z.string().optional(),
    client_name: z.string().optional()
});
export const GetModelRecommendationsSchema = z.object({
    model_name: z.string().min(1),
    parameter_size_b: ParamSizeSchema,
    user_message: z.string().optional(),
    warmth: z.number().min(0).max(100).optional()
});
export const ExtractVectorContextSchema = z.object({
    query: z.string().min(1),
    full_text: z.string().min(1),
    max_tokens: z.number().optional(),
    filename: z.string().optional()
});
export const BuildBiblicalContextSchema = z.object({
    question: z.string().min(1),
    mode: z.string().optional(),
    language: z.string().optional(),
    warmth: z.number().min(0).max(100).optional()
});
export const SanitizeScriptureMarkdownSchema = z.object({
    markdown_text: z.string()
});
export const GetInterlinearVerseSchema = z.object({
    book: z.string().min(1),
    chapter: z.number(),
    verse: z.number(),
    parallel_translation: z.string().optional().default("UBIO")
});
export const GetStrongsEtymologySchema = z.object({
    strongs_id: z.string().min(1)
});
export const AnalyzeGreekHebrewWordSchema = z.object({
    word: z.string().min(1)
});
export const GetCrossReferencesSchema = z.object({
    book: z.string().min(1),
    chapter: z.number(),
    verse: z.number(),
    category: z.string().optional().default("all"),
    max_results: z.number().optional().default(5)
});
export const FindThematicScriptureChainSchema = z.object({
    theme: z.string().min(1),
    starting_verse: z.string().optional().default("GEN.3.15")
});
export const GetProphecyFulfillmentPairsSchema = z.object({
    topic: z.string().optional().default("all")
});
export const SearchScriptureHybridSchema = z.object({
    query: z.string().min(1),
    language: z.string().optional().default("ukr"),
    mode: z.enum(["balanced", "exact", "semantic", "theological"]).optional().default("balanced"),
    top_k: z.number().optional().default(10)
});
export const FindScripturesByLifeSituationSchema = z.object({
    situation_description: z.string().min(1),
    emotion: z.string().optional().default("auto"),
    language: z.string().optional().default("ukr")
});
export const GetParallelVersesSchema = z.object({
    book: z.string().min(1),
    chapter: z.number(),
    verse: z.number(),
    end_verse: z.number().optional(),
    translations: z.array(z.string()).optional()
});
export const CompareTranslationsDiffSchema = z.object({
    book: z.string().min(1),
    chapter: z.number(),
    verse: z.number(),
    base_translation: z.string().optional().default("UBIO"),
    target_translation: z.string().optional().default("UKRK")
});
export const GetTranslationMetadataSchema = z.object({
    translation_id: z.string().optional().default("all")
});
export const TOOL_SCHEMAS = {
    ask_holy_bible: AskHolyBibleSchema,
    search_keyword: SearchKeywordSchema,
    get_verse: GetVerseSchema,
    get_chapter_context: GetChapterContextSchema,
    get_commentary: GetCommentarySchema,
    get_strongs_definition: GetStrongsDefinitionSchema,
    search_semantic: SearchSemanticSchema,
    search_topic: SearchTopicSchema,
    set_relevance_sensitivity: SetRelevanceSensitivitySchema,
    set_response_mode: SetResponseModeSchema,
    set_show_metrics: SetShowMetricsSchema,
    get_p2p_swarm_status: GetP2pSwarmStatusSchema,
    get_mcp_capabilities: GetMcpCapabilitiesSchema,
    get_model_recommendations: GetModelRecommendationsSchema,
    extract_vector_context: ExtractVectorContextSchema,
    build_biblical_context: BuildBiblicalContextSchema,
    sanitize_scripture_markdown: SanitizeScriptureMarkdownSchema,
    get_interlinear_verse: GetInterlinearVerseSchema,
    get_strongs_etymology: GetStrongsEtymologySchema,
    analyze_greek_hebrew_word: AnalyzeGreekHebrewWordSchema,
    get_cross_references: GetCrossReferencesSchema,
    find_thematic_scripture_chain: FindThematicScriptureChainSchema,
    get_prophecy_fulfillment_pairs: GetProphecyFulfillmentPairsSchema,
    search_scripture_hybrid: SearchScriptureHybridSchema,
    find_scriptures_by_life_situation: FindScripturesByLifeSituationSchema,
    get_parallel_verses: GetParallelVersesSchema,
    compare_translations_diff: CompareTranslationsDiffSchema,
    get_translation_metadata: GetTranslationMetadataSchema
};
export function validateToolArgs(toolName, args) {
    const schema = TOOL_SCHEMAS[toolName];
    if (!schema) {
        return { success: true, data: args };
    }
    const result = schema.safeParse(args || {});
    if (!result.success) {
        const errorDetails = result.error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join("; ");
        return { success: false, error: `Invalid arguments for tool ${toolName}: ${errorDetails}` };
    }
    return { success: true, data: result.data };
}
