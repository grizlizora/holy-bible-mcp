import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { TOOL_DEFINITIONS } from "./definitions.js";
import { handleAskHolyBible } from "./handlers/ask_holy_bible.handler.js";
import { handleSearchKeyword, handleSearchSemantic, handleSearchTopic, handleSearchScriptureHybrid, handleFindByLifeSituation } from "./handlers/search.handlers.js";
import { handleGetVerse, handleGetChapterContext, handleGetParallelVerses, handleCompareTranslationsDiff, handleGetTranslationMetadata } from "./handlers/verse.handlers.js";
import { handleGetStrongsDefinition, handleGetInterlinearVerse, handleGetStrongsEtymology } from "./handlers/morphology.handlers.js";
import { handleGetCommentary, handleGetCrossReferences, handleFindThematicScriptureChain, handleGetProphecyFulfillmentPairs } from "./handlers/commentary.handlers.js";
import { handleSetRelevanceSensitivity, handleSetResponseMode, handleSetShowMetrics, handleGetP2pSwarmStatus, handleGetMcpCapabilities, handleGetModelRecommendations, handleExtractVectorContext, handleSanitizeScriptureMarkdown } from "./handlers/system.handlers.js";
export function registerToolHandlers(server) {
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return { tools: TOOL_DEFINITIONS };
    });
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        try {
            if (name === "ask_holy_bible" || name === "build_biblical_context") {
                return await handleAskHolyBible(args);
            }
            if (name === "search_keyword") {
                return await handleSearchKeyword(args);
            }
            if (name === "get_verse") {
                return await handleGetVerse(args);
            }
            if (name === "get_chapter_context") {
                return await handleGetChapterContext(args);
            }
            if (name === "get_commentary") {
                return await handleGetCommentary(args);
            }
            if (name === "search_semantic") {
                return await handleSearchSemantic(args);
            }
            if (name === "search_topic") {
                return await handleSearchTopic(args);
            }
            if (name === "get_strongs_definition") {
                return await handleGetStrongsDefinition(args);
            }
            if (name === "set_relevance_sensitivity") {
                return await handleSetRelevanceSensitivity(args);
            }
            if (name === "set_response_mode") {
                return await handleSetResponseMode(args);
            }
            if (name === "set_show_metrics") {
                return await handleSetShowMetrics(args);
            }
            if (name === "get_p2p_swarm_status") {
                return await handleGetP2pSwarmStatus();
            }
            if (name === "get_mcp_capabilities") {
                return await handleGetMcpCapabilities(args);
            }
            if (name === "get_model_recommendations") {
                return await handleGetModelRecommendations(args);
            }
            if (name === "extract_vector_context") {
                return await handleExtractVectorContext(args);
            }
            if (name === "sanitize_scripture_markdown") {
                return await handleSanitizeScriptureMarkdown(args);
            }
            if (name === "get_interlinear_verse") {
                return await handleGetInterlinearVerse(args);
            }
            if (name === "get_strongs_etymology" || name === "analyze_greek_hebrew_word") {
                return await handleGetStrongsEtymology(args);
            }
            if (name === "get_cross_references") {
                return await handleGetCrossReferences(args);
            }
            if (name === "find_thematic_scripture_chain") {
                return await handleFindThematicScriptureChain(args);
            }
            if (name === "get_prophecy_fulfillment_pairs") {
                return await handleGetProphecyFulfillmentPairs(args);
            }
            if (name === "search_scripture_hybrid") {
                return await handleSearchScriptureHybrid(args);
            }
            if (name === "find_scriptures_by_life_situation") {
                return await handleFindByLifeSituation(args);
            }
            if (name === "get_parallel_verses") {
                return await handleGetParallelVerses(args);
            }
            if (name === "compare_translations_diff") {
                return await handleCompareTranslationsDiff(args);
            }
            if (name === "get_translation_metadata") {
                return await handleGetTranslationMetadata(args);
            }
            throw new Error(`Unknown tool: ${name}`);
        }
        catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${error.message}` }],
                isError: true
            };
        }
    });
}
