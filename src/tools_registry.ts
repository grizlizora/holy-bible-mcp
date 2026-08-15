import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { registerToolHandlers as registerAll } from "./tools/index.js";

export const registerToolHandlers = registerAll;
export { resolveLanguageCode, extractBiblicalSearchKeywords } from "./services/language_resolver.js";
