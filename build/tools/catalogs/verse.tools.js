export const VERSE_TOOLS = [
    {
        name: "get_verse",
        description: "Retrieve exact verse by book abbreviation, chapter, and verse number, or full reference string (e.g. 'JN 3:16').",
        inputSchema: {
            type: "object",
            properties: {
                book: { type: "string", description: "Book name or OSIS abbreviation (e.g. 'JN', 'GEN')" },
                chapter: { type: "number", description: "Chapter number" },
                verse: { type: "number", description: "Verse number" },
                language: { type: "string", description: "Translation language ('ukr', 'eng', 'ru')" }
            }
        }
    },
    {
        name: "get_chapter_context",
        description: "Retrieve complete chapter text for immediate context understanding.",
        inputSchema: {
            type: "object",
            properties: {
                book: { type: "string", description: "Book name or abbreviation" },
                chapter: { type: "number", description: "Chapter number" },
                language: { type: "string", description: "Language code" }
            },
            required: ["book", "chapter"]
        }
    },
    {
        name: "get_parallel_verses",
        description: "Retrieves aligned parallel scripture text across up to 15 translations (Ukrainian, English, Greek, Hebrew, Latin).",
        inputSchema: {
            type: "object",
            properties: {
                book: { type: "string", description: "Book name or OSIS code" },
                chapter: { type: "number", description: "Chapter number" },
                verse: { type: "number", description: "Verse number" },
                end_verse: { type: "number", description: "Optional ending verse number" },
                translations: { type: "array", items: { type: "string" }, description: "Translations array (e.g. ['UBIO', 'UKRK', 'KJV', 'BSB'])" }
            },
            required: ["book", "chapter", "verse"]
        }
    },
    {
        name: "compare_translations_diff",
        description: "Word-level Myers LCS Diff analysis comparing two Bible translations, highlighting lexical nuances and philosophy differences.",
        inputSchema: {
            type: "object",
            properties: {
                book: { type: "string", description: "Book name or OSIS code" },
                chapter: { type: "number", description: "Chapter number" },
                verse: { type: "number", description: "Verse number" },
                base_translation: { type: "string", description: "Base translation ID (default 'UBIO')" },
                target_translation: { type: "string", description: "Target translation ID (default 'UKRK')" }
            },
            required: ["book", "chapter", "verse"]
        }
    },
    {
        name: "get_translation_metadata",
        description: "Retrieves historical, philosophical, and textual basis metadata for Bible translations (or 'all' for complete catalog).",
        inputSchema: {
            type: "object",
            properties: {
                translation_id: { type: "string", description: "Translation ID (e.g. 'UBIO', 'UKRK', 'KJV', 'all')" }
            }
        }
    }
];
