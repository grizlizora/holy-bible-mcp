import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ASK_TOOLS: Tool[] = [
  {
    name: "ask_holy_bible",
    description: "MASTER TOOL FOR ALL GENERAL, PHILOSOPHICAL, ETHICAL, AND CONCEPT QUESTIONS (e.g. 'що таке любов', 'чому люди страждають'). ALWAYS CALL THIS TOOL ON TURN 1.",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "The user's exact question or topic" },
        language: { type: "string", description: "3-letter language code ('ukr' for Ukrainian, 'eng' for English)" },
        mode: { type: "string", description: "Response mode ('auto', 'verses_only', 'minimal', 'short', 'medium', 'detailed', 'deep')" },
        parameter_size_b: { type: "number", description: "Model parameter size in billions (e.g. 4.0, 8.0, 14.0)" },
        modelName: { type: "string", description: "Selected model name identifier" },
        isSmallModel: { type: "boolean", description: "Whether the executing model is a compact model" },
        modelMetadata: { type: "object", description: "Optional execution context metadata" }
      },
      required: ["question"]
    }
  },
  {
    name: "build_biblical_context",
    description: "Generates structured biblical context JSON with relevant verses, complexity score, sensitivity profile, and effective mode.",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "User question or prompt topic" },
        mode: { type: "string", description: "Desired depth mode" },
        language: { type: "string", description: "Language ('ukr', 'eng', 'spa', 'deu', 'fra', 'pol')" },
        warmth: { type: "number", description: "Pastoral sensitivity (0 to 100)" }
      },
      required: ["question"]
    }
  },
  {
    name: "find_scriptures_by_life_situation",
    description: "Pastoral counseling tool matching real-world human trials (anxiety, grief, burnout, loneliness, conflict) with verified scripture anchors.",
    inputSchema: {
      type: "object",
      properties: {
        situation_description: { type: "string", description: "Description of the life trial or struggle" },
        emotion: { type: "string", description: "Primary emotion ('anxiety', 'grief', 'loneliness', 'anger', 'auto')" },
        language: { type: "string", description: "Response language ('ukr', 'eng')" }
      },
      required: ["situation_description"]
    }
  }
];
