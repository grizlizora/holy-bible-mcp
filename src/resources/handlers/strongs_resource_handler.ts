/**
 * 🏛️ StrongsResourceHandler (strongs_resource_handler.ts)
 */

import { queryDb } from "../../database.js";
import { ParsedBibleUri } from "../resource_uri_parser.js";

export class StrongsResourceHandler {
  public static async handle(uri: string, parsed: ParsedBibleUri) {
    const { strongsId = "G26" } = parsed;
    const normalizedId = strongsId.toUpperCase();
    
    const rows = await queryDb(
      `SELECT strongs_id, lemma, transliteration, pronunciation, definition 
       FROM strongs_dictionary 
       WHERE UPPER(strongs_id) = ? OR UPPER(id) = ? LIMIT 1`,
      [normalizedId, normalizedId]
    );

    if (!rows || rows.length === 0) {
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify({
              strongs_id: normalizedId,
              status: "not_found",
              message: `Strong's entry '${strongsId}' is available in full local database.`
            }, null, 2)
          }
        ]
      };
    }

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(rows[0], null, 2)
        }
      ]
    };
  }
}
