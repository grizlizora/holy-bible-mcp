import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const MORPHOLOGY_TOOLS: Tool[] = [
  {
    name: "get_strongs_definition",
    description: "Look up original Greek/Hebrew root etymology, transliteration, and definition via Strong's Concordance.",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: {
      type: "object",
      properties: {
        word_id: { type: "string", description: "Strong's number (e.g. 'H1254', 'G26')" }
      },
      required: ["word_id"]
    }
  },
  {
    name: "get_strongs_etymology",
    description: "Comprehensive Strong's Concordance, BDB/Thayer lexicon, and Trench's Synonyms (e.g. Agape vs Phileo, Logos vs Rhema, Hesed, Shalom).",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: {
      type: "object",
      properties: {
        strongs_id: { type: "string", description: "Strong's ID (e.g. 'G26', 'G0025', 'H1254', 'H7225')" }
      },
      required: ["strongs_id"]
    }
  },
  {
    name: "get_interlinear_verse",
    description: "Retrieves word-by-word original Hebrew (WLC) or Greek (NA28/LXX) interlinear text with Strong's numbers, transliterations, lemmas, and grammatical morphology.",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: {
      type: "object",
      properties: {
        book: { type: "string", description: "Book name or OSIS code (e.g. 'John', 'JHN', 'Gen', 'Genesis')" },
        chapter: { type: "number", description: "Chapter number" },
        verse: { type: "number", description: "Verse number" },
        parallel_translation: { type: "string", description: "Target parallel modern translation (default 'UBIO')" }
      },
      required: ["book", "chapter", "verse"]
    }
  },
  {
    name: "analyze_greek_hebrew_word",
    description: "Morphological and root analysis for raw original language words, lemmas, or transliterations.",
    annotations: { readOnlyHint: true, idempotentHint: true },
    inputSchema: {
      type: "object",
      properties: {
        word: { type: "string", description: "Greek or Hebrew word, lemma, or transliteration" }
      },
      required: ["word"]
    }
  }
];
