import { MorphologyEngine } from "../../morphology_engine.js";
import { ResourceUriParser } from "../resource_uri_parser.js";
export class InterlinearResourceHandler {
    static async handle(uri, parsed) {
        const { book = "GEN", chapter = 1, verse = 1 } = parsed;
        const osisCode = ResourceUriParser.normalizeOsisBook(book);
        const interlinearResult = await MorphologyEngine.getInterlinearVerse(osisCode, chapter, verse, "auto", "UBIO");
        return {
            contents: [
                {
                    uri,
                    mimeType: "application/json",
                    text: JSON.stringify(interlinearResult, null, 2)
                }
            ]
        };
    }
}
