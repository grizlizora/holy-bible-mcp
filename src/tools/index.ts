/**
 * 🛠️ MCP Tool Registry & Dispatcher (Registry 2.0)
 * 
 * Declarative O(1) Map dispatcher for all 28 MCP tools with Zod schema validation.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { TOOL_DEFINITIONS } from "./definitions.js";
import { validateToolArgs } from "./schemas/tool_schemas.js";
import { handleAskHolyBible } from "./handlers/ask_holy_bible.handler.js";
import {
  handleSearchKeyword,
  handleSearchSemantic,
  handleSearchTopic,
  handleSearchScriptureHybrid,
  handleFindByLifeSituation
} from "./handlers/search.handlers.js";
import {
  handleGetVerse,
  handleGetChapterContext,
  handleGetParallelVerses,
  handleCompareTranslationsDiff,
  handleGetTranslationMetadata
} from "./handlers/verse.handlers.js";
import {
  handleGetStrongsDefinition,
  handleGetInterlinearVerse,
  handleGetStrongsEtymology
} from "./handlers/morphology.handlers.js";
import {
  handleGetCommentary,
  handleGetCrossReferences,
  handleFindThematicScriptureChain,
  handleGetProphecyFulfillmentPairs
} from "./handlers/commentary.handlers.js";
import {
  handleSetRelevanceSensitivity,
  handleSetResponseMode,
  handleSetShowMetrics,
  handleGetP2pSwarmStatus,
  handleGetMcpCapabilities,
  handleGetModelRecommendations,
  handleExtractVectorContext,
  handleSanitizeScriptureMarkdown
} from "./handlers/system.handlers.js";

type ToolHandler = (args: any) => Promise<any>;

export function registerToolHandlers(server: Server): void {
  const handlerMap = new Map<string, ToolHandler>([
    ["ask_holy_bible", handleAskHolyBible],
    ["build_biblical_context", handleAskHolyBible],
    ["search_keyword", handleSearchKeyword],
    ["get_verse", handleGetVerse],
    ["get_chapter_context", handleGetChapterContext],
    ["get_commentary", handleGetCommentary],
    ["search_semantic", handleSearchSemantic],
    ["search_topic", handleSearchTopic],
    ["get_strongs_definition", handleGetStrongsDefinition],
    ["set_relevance_sensitivity", handleSetRelevanceSensitivity],
    ["set_response_mode", handleSetResponseMode],
    ["set_show_metrics", handleSetShowMetrics],
    ["get_p2p_swarm_status", handleGetP2pSwarmStatus],
    ["get_mcp_capabilities", handleGetMcpCapabilities],
    ["get_model_recommendations", handleGetModelRecommendations],
    ["extract_vector_context", handleExtractVectorContext],
    ["sanitize_scripture_markdown", handleSanitizeScriptureMarkdown],
    ["get_interlinear_verse", handleGetInterlinearVerse],
    ["get_strongs_etymology", handleGetStrongsEtymology],
    ["analyze_greek_hebrew_word", handleGetStrongsEtymology],
    ["get_cross_references", handleGetCrossReferences],
    ["find_thematic_scripture_chain", handleFindThematicScriptureChain],
    ["get_prophecy_fulfillment_pairs", handleGetProphecyFulfillmentPairs],
    ["search_scripture_hybrid", handleSearchScriptureHybrid],
    ["find_scriptures_by_life_situation", handleFindByLifeSituation],
    ["get_parallel_verses", handleGetParallelVerses],
    ["compare_translations_diff", handleCompareTranslationsDiff],
    ["get_translation_metadata", handleGetTranslationMetadata]
  ]);

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOL_DEFINITIONS };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = handlerMap.get(name);

    if (!handler) {
      return {
        content: [{ type: "text", text: `Error: Unknown tool "${name}"` }],
        isError: true
      };
    }

    // Zod validation middleware
    const validation = validateToolArgs(name, args);
    if (!validation.success) {
      return {
        content: [{ type: "text", text: validation.error }],
        isError: true
      };
    }

    try {
      return await handler(validation.data);
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message || error}` }],
        isError: true
      };
    }
  });
}
