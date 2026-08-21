import { ASK_TOOLS } from "./catalogs/ask.tools.js";
import { SEARCH_TOOLS } from "./catalogs/search.tools.js";
import { VERSE_TOOLS } from "./catalogs/verse.tools.js";
import { MORPHOLOGY_TOOLS } from "./catalogs/morphology.tools.js";
import { THEOLOGY_TOOLS } from "./catalogs/theology.tools.js";
import { SYSTEM_TOOLS } from "./catalogs/system.tools.js";
export { ASK_TOOLS, SEARCH_TOOLS, VERSE_TOOLS, MORPHOLOGY_TOOLS, THEOLOGY_TOOLS, SYSTEM_TOOLS };
export const TOOL_DEFINITIONS = [
    ...ASK_TOOLS,
    ...SEARCH_TOOLS,
    ...VERSE_TOOLS,
    ...MORPHOLOGY_TOOLS,
    ...THEOLOGY_TOOLS,
    ...SYSTEM_TOOLS
];
