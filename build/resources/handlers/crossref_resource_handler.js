/**
 * 🔗 CrossrefResourceHandler (crossref_resource_handler.ts)
 */
import { queryDb } from "../../database.js";
import { ResourceUriParser } from "../resource_uri_parser.js";
export class CrossrefResourceHandler {
    static async handle(uri, parsed) {
        const { book = "JHN", chapter = 3, verse = 16 } = parsed;
        const osisCode = ResourceUriParser.normalizeOsisBook(book);
        const rows = await queryDb(`SELECT concept_name, book as target_book, chapter as target_chapter, verse as target_verse, theological_principle 
       FROM semantic_concepts 
       WHERE UPPER(book) = ? AND chapter = ? AND verse = ? LIMIT 20`, [osisCode, chapter, verse]);
        return {
            contents: [
                {
                    uri,
                    mimeType: "application/json",
                    text: JSON.stringify({
                        source: `${osisCode} ${chapter}:${verse}`,
                        crossReferencesCount: rows.length,
                        references: rows
                    }, null, 2)
                }
            ]
        };
    }
}
