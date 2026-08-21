import { queryDb } from "../../database.js";
import { OSIS_ALIAS_MAP } from "../../data/osis_dictionary.js";
import { DirectiveStore } from "../../directives/directive_store.js";
import { ScriptureGraphEngine } from "../../scripture_graph_engine.js";
export async function handleGetCommentary(args) {
    const book = String(args?.book || "").toUpperCase();
    const chapter = Number(args?.chapter || 1);
    const verse = Number(args?.verse || 1);
    const osisCode = OSIS_ALIAS_MAP[book] || book;
    let rows = await queryDb(`SELECT author, commentary_text, era FROM commentaries WHERE (UPPER(book) = ? OR UPPER(book) = ?) AND chapter = ? AND verse = ?`, [osisCode, book, chapter, verse]);
    if (!rows || rows.length === 0) {
        const storeCommentaries = DirectiveStore.getInstance().theologyRepo.getCommentaries(osisCode, chapter, verse);
        if (storeCommentaries && storeCommentaries.length > 0) {
            rows = storeCommentaries.map(c => ({
                author: c.author,
                era: c.era,
                commentary_text: c.commentary_text
            }));
        }
    }
    return {
        content: [{ type: "text", text: JSON.stringify(rows, null, 2) }]
    };
}
export async function handleGetCrossReferences(args) {
    const book = String(args?.book || "JHN");
    const chapter = parseInt(String(args?.chapter || 3), 10);
    const verse = parseInt(String(args?.verse || 16), 10);
    const category = String(args?.category || "all");
    const maxResults = typeof args?.max_results === "number" ? args.max_results : 5;
    const result = await ScriptureGraphEngine.getInstance().getRankedCrossReferences(book, chapter, verse, category, maxResults, "ukr");
    return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
}
export async function handleFindThematicScriptureChain(args) {
    const theme = String(args?.theme || "living_water");
    const startingVerse = String(args?.starting_verse || "GEN.3.15");
    const result = await ScriptureGraphEngine.findThematicChain(theme, startingVerse);
    return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
}
export async function handleGetProphecyFulfillmentPairs(args) {
    const topic = String(args?.topic || "all");
    const pairs = DirectiveStore.getInstance().getMessianicProphecies(topic);
    return {
        content: [{ type: "text", text: JSON.stringify(pairs, null, 2) }]
    };
}
