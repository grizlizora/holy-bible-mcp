import { ListResourcesRequestSchema, ListResourceTemplatesRequestSchema, ReadResourceRequestSchema, McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { ResourceUriParser } from "./resources/resource_uri_parser.js";
import { ChapterResourceHandler } from "./resources/handlers/chapter_resource_handler.js";
import { StrongsResourceHandler } from "./resources/handlers/strongs_resource_handler.js";
import { CrossrefResourceHandler } from "./resources/handlers/crossref_resource_handler.js";
import { InterlinearResourceHandler } from "./resources/handlers/interlinear_resource_handler.js";
/**
 * 🔒 In-flight Promise Registry & LRU Resource Cache to prevent dogpiling and race conditions
 */
class ResourcePoolManager {
    static inFlightRequests = new Map();
    static resourceCache = new Map();
    static MAX_CACHE_ENTRIES = 1000;
    static TTL_MS = 600_000; // 10 minutes
    static async executeWithLock(uri, fetchFn) {
        // 1. Check in-memory cache
        const cached = this.resourceCache.get(uri);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.data;
        }
        // 2. Check for in-flight active request for the same URI (Singleflight de-duplication)
        let inFlight = this.inFlightRequests.get(uri);
        if (inFlight) {
            return inFlight;
        }
        // 3. Execute with de-duplication lock
        inFlight = (async () => {
            try {
                const result = await fetchFn();
                // Cache result
                if (this.resourceCache.size >= this.MAX_CACHE_ENTRIES) {
                    const firstKey = this.resourceCache.keys().next().value;
                    if (firstKey)
                        this.resourceCache.delete(firstKey);
                }
                this.resourceCache.set(uri, { data: result, expiresAt: Date.now() + this.TTL_MS });
                return result;
            }
            finally {
                this.inFlightRequests.delete(uri);
            }
        })();
        this.inFlightRequests.set(uri, inFlight);
        return inFlight;
    }
    static clearCache() {
        this.resourceCache.clear();
        this.inFlightRequests.clear();
    }
}
/**
 * 📜 MCP Resources Repository Subsystem for Holy Bible MCP
 * Exposes canonical scripture chapters, Strong's concordance articles,
 * cross-reference networks, and word-by-word interlinear text via standard MCP URIs.
 *
 * Features:
 * - Singleflight in-flight request de-duplication
 * - Thread-safe resource reading pool
 * - Zero race-condition concurrent reader
 */
export function registerResourceHandlers(server) {
    // 1. Dynamic Resource Templates Discovery Handler
    server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
        return {
            resourceTemplates: [
                {
                    uriTemplate: "bible://{translation}/{book}/{chapter}",
                    name: "Canonical Scripture Chapter Reader",
                    description: "Full chapter text formatted with verse citations (e.g. bible://kjv/JHN/3, bible://ubio/GEN/1, bible://web/PSA/23)",
                    mimeType: "text/markdown"
                },
                {
                    uriTemplate: "bible://strongs/{number}",
                    name: "Strong's Exhaustive Concordance Entry",
                    description: "Greek & Hebrew lexical lemma, transliteration, pronunciation and definition (e.g. bible://strongs/G26 for Agape, bible://strongs/H1254 for Bara)",
                    mimeType: "application/json"
                },
                {
                    uriTemplate: "bible://crossref/{book}/{chapter}/{verse}",
                    name: "Biblical Cross-References Network",
                    description: "Curated parallel verses, prophecy links, and doctrinal cross-references (e.g. bible://crossref/JHN/3/16, bible://crossref/ROM/8/28)",
                    mimeType: "application/json"
                },
                {
                    uriTemplate: "bible://interlinear/{book}/{chapter}/{verse}",
                    name: "Original Language Interlinear Verse",
                    description: "Word-by-word original Hebrew/Greek with English/Ukrainian gloss, lemmas, and Strong's mapping (e.g. bible://interlinear/GEN/1/1)",
                    mimeType: "application/json"
                }
            ]
        };
    });
    // 2. Curated Essential Resources List Handler
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
        return {
            resources: [
                {
                    uri: "bible://kjv/JHN/3",
                    name: "Gospel of John: Chapter 3 (KJV)",
                    description: "Full chapter: Nicodemus discourse, New Birth, and God's love for the world.",
                    mimeType: "text/markdown"
                },
                {
                    uri: "bible://ubio/PSA/23",
                    name: "Псалом 23 (Огієнко)",
                    description: "Пастирський псалом абсолютного уповання на Господа: «Господь то мій Пастир...».",
                    mimeType: "text/markdown"
                },
                {
                    uri: "bible://kjv/EXO/20",
                    name: "The Ten Commandments (Exodus 20 KJV)",
                    description: "The Decalogue given at Mount Sinai.",
                    mimeType: "text/markdown"
                },
                {
                    uri: "bible://ubio/1CO/13",
                    name: "Гімн Любові (1 Коринфянам 13 Огієнко)",
                    description: "Канонічне визначення жертовної любові (Агапе).",
                    mimeType: "text/markdown"
                },
                {
                    uri: "bible://kjv/ROM/8",
                    name: "Romans 8: Life in the Spirit (KJV)",
                    description: "No condemnation in Christ, the witness of the Spirit, and unbreakable divine love.",
                    mimeType: "text/markdown"
                },
                {
                    uri: "bible://strongs/G26",
                    name: "Strong's G26: Agape (ἀγάπη)",
                    description: "Unconditional, self-sacrificing covenant love.",
                    mimeType: "application/json"
                },
                {
                    uri: "bible://strongs/H1254",
                    name: "Strong's H1254: Bara (בָּרָא)",
                    description: "Divine ex-nihilo creative act in Genesis 1:1.",
                    mimeType: "application/json"
                }
            ]
        };
    });
    // 3. Universal Resource Reader Handler with Race Condition Protection
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const uri = request.params.uri;
        const parsed = ResourceUriParser.parse(uri);
        if (!parsed) {
            throw new McpError(ErrorCode.InvalidRequest, `Unsupported resource URI scheme: ${uri}`);
        }
        return ResourcePoolManager.executeWithLock(uri, async () => {
            try {
                switch (parsed.type) {
                    case "chapter":
                        return await ChapterResourceHandler.handle(uri, parsed);
                    case "strongs":
                        return await StrongsResourceHandler.handle(uri, parsed);
                    case "crossref":
                        return await CrossrefResourceHandler.handle(uri, parsed);
                    case "interlinear":
                        return await InterlinearResourceHandler.handle(uri, parsed);
                    default:
                        throw new McpError(ErrorCode.InvalidRequest, `Unhandled resource type for URI: ${uri}`);
                }
            }
            catch (err) {
                if (err instanceof McpError)
                    throw err;
                throw new McpError(ErrorCode.InvalidRequest, err.message || `Error reading resource: ${uri}`);
            }
        });
    });
}
export { ResourcePoolManager };
