import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const SEARCH_TOOLS: Tool[] = [
  {
    name: "search_keyword",
    description: "Perform accurate full-text search (FTS5) across Old & New Testaments.",
    inputSchema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "Keyword or phrase to search" },
        translation: { type: "string", description: "Translation code" },
        limit: { type: "number", description: "Max verses (default 10)" }
      },
      required: ["keyword"]
    }
  },
  {
    name: "search_semantic",
    description: "Search canonical verses mapped to existential/theological themes (anxiety, grief, forgiveness).",
    inputSchema: {
      type: "object",
      properties: {
        concept: { type: "string", description: "Existential or theological theme" }
      },
      required: ["concept"]
    }
  },
  {
    name: "search_topic",
    description: "Retrieve canonical verses categorized under major biblical topics.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Theme/Topic" },
        limit: { type: "number", description: "Max verses" }
      },
      required: ["topic"]
    }
  },
  {
    name: "search_scripture_hybrid",
    description: "Hybrid search combining SQLite FTS5 BM25 lexical search, Ukrainian morphology lemmatization, and vector conceptual relevance.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query or existential/theological question" },
        language: { type: "string", description: "Language code ('ukr', 'eng')" },
        mode: { type: "string", description: "'balanced', 'exact', 'semantic', 'theological'" },
        top_k: { type: "number", description: "Max results (default 10)" }
      },
      required: ["query"]
    }
  },
  {
    name: "extract_vector_context",
    description: "⚡ 100M Token Vector Reasoning & Hierarchical Semantic Chunker Engine. Extracts relevant semantic chunks from large documents/attachments.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query or topic" },
        full_text: { type: "string", description: "Full document text to chunk and rank" },
        max_tokens: { type: "number", description: "Maximum token budget" },
        filename: { type: "string", description: "Source document filename" }
      },
      required: ["query", "full_text"]
    }
  }
];
