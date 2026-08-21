/**
 * 🔤 InterlinearResourceHandler (interlinear_resource_handler.ts)
 */

import { queryDb } from "../../database.js";
import { ResourceUriParser, ParsedBibleUri } from "../resource_uri_parser.js";

export class InterlinearResourceHandler {
  public static async handle(uri: string, parsed: ParsedBibleUri) {
    const { book = "GEN", chapter = 1, verse = 1 } = parsed;
    const osisCode = ResourceUriParser.normalizeOsisBook(book);

    const verseRow = await queryDb(
      `SELECT text, original_data FROM verses 
       WHERE UPPER(book) = ? AND chapter = ? AND verse = ? LIMIT 1`,
      [osisCode, chapter, verse]
    );

    const originalData = verseRow.length > 0 && verseRow[0].original_data 
      ? (typeof verseRow[0].original_data === 'string' ? JSON.parse(verseRow[0].original_data) : verseRow[0].original_data)
      : { source: "Nestle-Aland 28 / Westminster Leningrad Codex" };

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify({
            reference: `${osisCode} ${chapter}:${verse}`,
            canonicalText: verseRow[0]?.text || "",
            morphology: originalData
          }, null, 2)
        }
      ]
    };
  }
}
