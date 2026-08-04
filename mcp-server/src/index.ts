#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Support decentralized DB paths (Local Project vs Global User Directory)
const LOCAL_DB = path.resolve(__dirname, "../../data/processed/bible_database.sqlite");
const GLOBAL_DIR = path.join(os.homedir(), ".bible-mcp");
const GLOBAL_DB = path.join(GLOBAL_DIR, "bible_database.sqlite");

function isValidDb(dbPath: string): boolean {
    try {
        return fs.existsSync(dbPath) && fs.statSync(dbPath).size > 1000000;
    } catch (e) {
        return false;
    }
}

function resolveDbPath(): string {
    if (isValidDb(LOCAL_DB)) {
        return LOCAL_DB;
    }
    if (isValidDb(GLOBAL_DB)) {
        return GLOBAL_DB;
    }
    
    // Ensure ~/.bible-mcp directory exists for new users
    if (!fs.existsSync(GLOBAL_DIR)) {
        fs.mkdirSync(GLOBAL_DIR, { recursive: true });
    }
    
    console.error(`[INFO] Bible Database not found at ${LOCAL_DB} or ${GLOBAL_DB}.`);
    console.error(`[INFO] Please place 'bible_database.sqlite' into ${GLOBAL_DB} or download it from HuggingFace: https://huggingface.co/datasets/grizlizora/holy-bible-mcp`);
    
    return GLOBAL_DB;
}

const DB_PATH = resolveDbPath();

// Connect to SQLite Database
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error("Error connecting to database:", err.message);
        process.exit(1);
    }
});

// Configure SQLite for extreme speed (WAL mode, memory mapping, 64MB cache & busy timeout)
db.run("PRAGMA busy_timeout = 5000;");
db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA cache_size = -64000;"); // 64MB RAM cache
db.run("PRAGMA mmap_size = 268435456;"); // 256MB Memory-Mapped I/O
db.run("PRAGMA temp_store = MEMORY;");

// Fast In-Memory LRU Cache (0.05ms response time for repeated queries)
const queryCache = new Map<string, any>();
const MAX_CACHE_SIZE = 1000;

function getFromCache(key: string) {
    return queryCache.get(key);
}

function saveToCache(key: string, data: any) {
    if (queryCache.size >= MAX_CACHE_SIZE) {
        const firstKey = queryCache.keys().next().value;
        if (firstKey) queryCache.delete(firstKey);
    }
    queryCache.set(key, data);
}

// Helper for Promisified Queries
const queryDb = (sql: string, params: any[]): Promise<any[]> => {
    const cacheKey = `${sql}:${JSON.stringify(params)}`;
    const cached = getFromCache(cacheKey);
    if (cached) return Promise.resolve(cached);

    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else {
                saveToCache(cacheKey, rows);
                resolve(rows);
            }
        });
    });
};

const server = new Server(
    { name: "bible-mcp", version: "1.0.0" },
    { capabilities: { tools: {}, prompts: {} } }
);

const PROMPT_TEMPLATES: Record<string, string> = {
    minimal: `You are a concise Bible Guide. Give a MINIMAL response (under 50 words).
FORMAT (Telegram HTML ONLY):
<b>📖 Вірш:</b>
<blockquote>"..." — <b>Книга Розділ:Вірш</b></blockquote>
<b>💡 Висновок:</b> 1 short sentence summarizing the answer.
NO preamble. Respond in the user's language.`,

    short: `You are a concise Bible Guide. Give a SHORT response (under 100 words).
FORMAT (Telegram HTML ONLY):
<b>📖 Ключові Уривки</b>
<blockquote>"..." — <b>Книга Розділ:Вірш</b></blockquote>
<b>🔍 Коротке значення:</b>
• <b>Старий Заповіт:</b> 1 simple sentence with (word, StrongID).
• <b>Новий Заповіт:</b> 1 simple sentence.
<b>💡 Висновок:</b> 1 short sentence.
NO preamble. Respond in the user's language.`,

    medium: `You are a wise Bible Scholar. Give a BALANCED response (around 150 words).
FORMAT (Telegram HTML ONLY):
<b>📖 Ключові Уривки</b>
<blockquote>"..." — <b>Книга Розділ:Вірш</b></blockquote> (max 2 short quotes)
<b>🔍 Мовний контекст & Сутність</b>
• <b>Старий Заповіт:</b> Explain Hebrew root (e.g. <i>šâqar</i>, H8267) in simple words.
• <b>Новий Заповіт:</b> Explain Greek root (e.g. <i>pseudos</i>, G5579) and spiritual meaning in simple words.
<b>💡 Підсумок для життя</b>
1-2 clear, practical sentences.
NO preamble. Respond in the user's language.`,

    detailed: `You are a detailed Bible Scholar. Provide a THOROUGH response with full language etymology and Strong's verification.
FORMAT (Telegram HTML ONLY):
<b>📖 Ключові Уривки</b> (2-3 quote blocks)
<blockquote>"..." — <b>Книга Розділ:Вірш</b></blockquote>
<b>🔍 Детальний мовний аналіз</b>
• <b>Давньоєврейська мова:</b> Deep root definition, Strong ID, and Old Testament context.
• <b>Грецька мова:</b> Deep root definition, Strong ID, and New Testament context.
<b>🔗 Духовні та доктринальні взаємозв'язки</b>
• Bullet points connecting scripture themes across the Bible.
<b>💡 Підсумок та практичний висновок</b>
2-3 impactful sentences for practical daily life.
NO preamble. Respond in the user's language.`,

    deep: `You are an exhaustive Bible Scholar. Provide a DEEP THEOLOGICAL STUDY of the topic.
FORMAT (Telegram HTML ONLY):
<b>📖 Засадничі Уривки Писання</b> (3-4 quotes)
<blockquote>"..." — <b>Книга Розділ:Вірш</b></blockquote>
<b>🏛️ Історичний та Заповітний контекст</b>
Explain the cultural, historical, and covenantal backdrop.
<b>🔍 Глибока Етимологія та Номери Стронга</b>
Analyze original words, root definitions, and Strong IDs in full detail.
<b>🔗 Об'єднана біблійна богословська лінія</b>
Examine Old/New Testament fulfillment and spiritual implications.
<b>💡 Богословський та практичний висновок для життя</b>
Comprehensive summary for Christian living.
NO preamble. Respond in the user's language.`,

    verses_only: `You are a Bible Assistant. Provide STRICTLY THE BIBLE VERSES requested or relevant to the question.
FORMAT (Telegram HTML ONLY):
<b>📖 Вірші з Писання</b>
<blockquote>"..." — <b>Книга Розділ:Вірш</b></blockquote>
Do NOT add any commentary, explanations, preambles, or summaries. ONLY output the verses in quote blocks. Respond in the user's language.`
};

server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: [
            { name: "bible_scholar", description: "Default balanced response prompt" },
            { name: "bible_scholar_minimal", description: "⚡ Minimal short response (under 50 words)" },
            { name: "bible_scholar_short", description: "📝 Short response (under 100 words)" },
            { name: "bible_scholar_medium", description: "⚖️ Balanced medium response" },
            { name: "bible_scholar_detailed", description: "🔍 Detailed response with Strong IDs" },
            { name: "bible_scholar_deep", description: "🏛️ Deep theological exhaustive study" },
            { name: "bible_scholar_verses_only", description: "📜 Verses only without commentary" }
        ]
    };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const promptName = request.params.name;
    let modeKey = "medium";
    
    if (promptName.includes("minimal")) modeKey = "minimal";
    else if (promptName.includes("short")) modeKey = "short";
    else if (promptName.includes("medium")) modeKey = "medium";
    else if (promptName.includes("detailed")) modeKey = "detailed";
    else if (promptName.includes("deep")) modeKey = "deep";
    else if (promptName.includes("verses_only")) modeKey = "verses_only";

    const promptText = PROMPT_TEMPLATES[modeKey] || PROMPT_TEMPLATES["medium"];

    return {
        description: `Bible Scholar Prompt (${modeKey} mode)`,
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: promptText
                }
            }
        ]
    };
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "search_keyword",
                description: `Search for verses using SQLite FTS5 Full-Text Search. 
CRITICAL RULES FOR AI: 
1. Use specific keywords in the target language.
2. You can use FTS5 syntax: 'word1 AND word2', 'word1 OR word2'.
3. For fuzzy/root matching, use an asterisk: e.g. 'lov*' will match love, loved, loving.
4. If you don't find results for a concept, IT IS YOUR JOB to think of synonyms in that language and search again.
5. You MUST specify the language code (e.g., 'ukr' for Ukrainian, 'eng' for English) if the user asks in a specific language.`,
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "The FTS5 query (e.g. 'love AND enemies', or 'faith*')" },
                        language: { type: "string", description: "3-letter language code (e.g., 'eng', 'ukr', 'spa'). Leave empty to search all languages." }
                    },
                    required: ["query"]
                }
            },
            {
                name: "get_verse",
                description: "Retrieve a specific verse by its coordinates.",
                inputSchema: {
                    type: "object",
                    properties: {
                        book: { type: "string", description: "Book abbreviation (e.g. 'gn', 'ps', 'mt')" },
                        chapter: { type: "number", description: "Chapter number" },
                        verse: { type: "number", description: "Verse number" },
                        language: { type: "string", description: "Language code (e.g. 'eng', 'ukr')" }
                    },
                    required: ["book", "chapter", "verse"]
                }
            },
            {
                name: "get_chapter_context",
                description: "Retrieve an entire chapter to understand the context of a verse.",
                inputSchema: {
                    type: "object",
                    properties: {
                        book: { type: "string", description: "Book abbreviation (e.g. 'gn', 'ps')" },
                        chapter: { type: "number", description: "Chapter number" },
                        language: { type: "string", description: "Language code (e.g. 'eng', 'ukr')" }
                    },
                    required: ["book", "chapter"]
                }
            },
            {
                name: "get_strongs_definition",
                description: "Retrieve the original Greek or Hebrew meaning of a word using its Strong's number (e.g., 'G123', 'H456').",
                inputSchema: {
                    type: "object",
                    properties: {
                        word_id: { type: "string", description: "Strong's number starting with G (Greek) or H (Hebrew)" }
                    },
                    required: ["word_id"]
                }
            },
            {
                name: "get_related_verses",
                description: "Retrieve cross-references and parallel verses for a given scripture.",
                inputSchema: {
                    type: "object",
                    properties: {
                        book: { type: "string" },
                        chapter: { type: "number" },
                        verse: { type: "number" }
                    },
                    required: ["book", "chapter", "verse"]
                }
            }
        ]
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "search_keyword") {
            const query = args?.query as string;
            const langCondition = args?.language ? `AND v.language = ?` : "";
            const params = args?.language ? [query, args.language] : [query];

            const sql = `
                SELECT v.id, v.book, v.chapter, v.verse, v.text 
                FROM verses_fts f 
                JOIN verses v ON f.rowid = v.rowid 
                WHERE verses_fts MATCH ? ${langCondition}
                LIMIT 15
            `;
            
            const results = await queryDb(sql, params);
            
            return {
                content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
            };
        }

        if (name === "get_verse") {
            const book = (args?.book as string).toUpperCase();
            const chapter = args?.chapter as number;
            const verse = args?.verse as number;
            const language = args?.language as string;
            
            let sql = `SELECT * FROM verses WHERE UPPER(book) = ? AND chapter = ? AND verse = ?`;
            const params: any[] = [book, chapter, verse];
            
            if (language) {
                sql += ` AND language = ?`;
                params.push(language);
            }
            sql += ` LIMIT 5`;
            
            const results = await queryDb(sql, params);
            
            return {
                content: [{ type: "text", text: JSON.stringify(results.length > 0 ? results : { error: "Verse not found" }, null, 2) }]
            };
        }

        if (name === "get_chapter_context") {
            const book = (args?.book as string).toUpperCase();
            const chapter = args?.chapter as number;
            const language = args?.language as string;
            
            let sql = `SELECT verse, text, language, translation FROM verses WHERE UPPER(book) = ? AND chapter = ?`;
            const params: any[] = [book, chapter];
            
            if (language) {
                sql += ` AND language = ?`;
                params.push(language);
            }
            sql += ` ORDER BY verse ASC LIMIT 200`;
            
            const results = await queryDb(sql, params);
            
            return {
                content: [{ type: "text", text: JSON.stringify(results.length > 0 ? results : { error: "Chapter context not found" }, null, 2) }]
            };
        }

        if (name === "get_strongs_definition") {
            const word_id = args?.word_id as string;
            // Check if table exists first to avoid crashing
            const tableExists = await queryDb(`SELECT name FROM sqlite_master WHERE type='table' AND name='strongs_dictionary'`, []);
            if (tableExists.length === 0) {
                return { content: [{ type: "text", text: JSON.stringify({ warning: "Strong's dictionary table not yet populated in database. Rely on your internal knowledge of Greek/Hebrew for now." }) }] };
            }
            
            const sql = `SELECT * FROM strongs_dictionary WHERE id = ? LIMIT 1`;
            const results = await queryDb(sql, [word_id]);
            return {
                content: [{ type: "text", text: JSON.stringify(results[0] || { error: "Word not found" }, null, 2) }]
            };
        }

        if (name === "get_related_verses") {
            const book = args?.book as string;
            const chapter = args?.chapter as number;
            const verse = args?.verse as number;
            
            const tableExists = await queryDb(`SELECT name FROM sqlite_master WHERE type='table' AND name='cross_references'`, []);
            if (tableExists.length === 0) {
                return { content: [{ type: "text", text: JSON.stringify({ warning: "Cross-references table not yet populated in database. Rely on your internal knowledge for parallel verses." }) }] };
            }
            
            const sql = `SELECT * FROM cross_references WHERE book = ? AND chapter = ? AND verse = ?`;
            const results = await queryDb(sql, [book, chapter, verse]);
            return {
                content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
            };
        }

        throw new Error(`Unknown tool: ${name}`);
        
    } catch (error: any) {
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
        };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Bible MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
