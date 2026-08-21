import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const THEOLOGY_TOOLS: Tool[] = [
  {
    name: "get_commentary",
    description: "Retrieve patristic and classic historical commentaries (Chrysostom, Henry, Ohiyenko).",
    inputSchema: {
      type: "object",
      properties: {
        book: { type: "string", description: "Book abbreviation" },
        chapter: { type: "number", description: "Chapter number" },
        verse: { type: "number", description: "Verse number" }
      },
      required: ["book", "chapter", "verse"]
    }
  },
  {
    name: "get_cross_references",
    description: "Retrieves top-ranked theological cross-references from the 344,000+ TSK graph with PageRank ranking and anti-flooding diversity.",
    inputSchema: {
      type: "object",
      properties: {
        book: { type: "string", description: "Book name or OSIS code" },
        chapter: { type: "number", description: "Chapter number" },
        verse: { type: "number", description: "Verse number" },
        category: { type: "string", description: "Filter: 'all', 'messianic_prophecy', 'typology_antitype', 'direct_quotation', 'doctrinal_corroboration'" },
        max_results: { type: "number", description: "Max references to return (default 5)" }
      },
      required: ["book", "chapter", "verse"]
    }
  },
  {
    name: "find_thematic_scripture_chain",
    description: "Traces progressive revelation of a biblical doctrine or theme across covenants (e.g. 'Living Water', 'Passover Lamb', 'Seed of the Woman').",
    inputSchema: {
      type: "object",
      properties: {
        theme: { type: "string", description: "Thematic concept (e.g. 'вода', 'living_water', 'covenant', 'seed')" },
        starting_verse: { type: "string", description: "Optional starting verse OSIS (default 'GEN.3.15')" }
      },
      required: ["theme"]
    }
  },
  {
    name: "get_prophecy_fulfillment_pairs",
    description: "Retrieves matched pairs of Old Testament Messianic Prophecies and their New Testament historical fulfillments in Christ.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Prophecy topic or verse (e.g. 'virgin_birth', 'ISA.53.5', 'MIC.5.2', 'all')" }
      }
    }
  }
];
