import { ScriptureGraphEngine } from "../../scripture_graph_engine.js";
import { ResourceUriParser, ParsedBibleUri } from "../resource_uri_parser.js";

export class CrossrefResourceHandler {
  public static async handle(uri: string, parsed: ParsedBibleUri) {
    const { book = "JHN", chapter = 3, verse = 16 } = parsed;
    const osisCode = ResourceUriParser.normalizeOsisBook(book);

    const rankedResult = await ScriptureGraphEngine.getInstance().getRankedCrossReferences(
      osisCode,
      chapter,
      verse,
      "all",
      15,
      "ukr"
    );

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify({
            source: `${osisCode} ${chapter}:${verse}`,
            sourceTitle: rankedResult.sourceTitle,
            crossReferencesCount: rankedResult.results.length,
            references: rankedResult.results
          }, null, 2)
        }
      ]
    };
  }
}

