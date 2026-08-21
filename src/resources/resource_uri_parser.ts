/**
 * 🛠️ ResourceUriParser (resource_uri_parser.ts)
 * 
 * Parses and validates standard bible:// resource URIs.
 */

import { OSIS_ALIAS_MAP } from "../data/osis_dictionary.js";

export interface ParsedBibleUri {
  type: "chapter" | "strongs" | "crossref" | "interlinear";
  translation?: string;
  book?: string;
  chapter?: number;
  verse?: number;
  strongsId?: string;
}

export class ResourceUriParser {
  public static parse(uri: string): ParsedBibleUri | null {
    // 1. bible://{translation}/{book}/{chapter}
    const chapterMatch = uri.match(/^bible:\/\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)\/(\d+)$/i);
    if (chapterMatch) {
      return {
        type: "chapter",
        translation: chapterMatch[1].toLowerCase(),
        book: chapterMatch[2],
        chapter: parseInt(chapterMatch[3], 10)
      };
    }

    // 2. bible://strongs/{number}
    const strongsMatch = uri.match(/^bible:\/\/strongs\/([gGhH]?\d+)$/i);
    if (strongsMatch) {
      return {
        type: "strongs",
        strongsId: strongsMatch[1].toUpperCase()
      };
    }

    // 3. bible://crossref/{book}/{chapter}/{verse}
    const crossRefMatch = uri.match(/^bible:\/\/crossref\/([a-zA-Z0-9_-]+)\/(\d+)\/(\d+)$/i);
    if (crossRefMatch) {
      return {
        type: "crossref",
        book: crossRefMatch[1],
        chapter: parseInt(crossRefMatch[2], 10),
        verse: parseInt(crossRefMatch[3], 10)
      };
    }

    // 4. bible://interlinear/{book}/{chapter}/{verse}
    const interlinearMatch = uri.match(/^bible:\/\/interlinear\/([a-zA-Z0-9_-]+)\/(\d+)\/(\d+)$/i);
    if (interlinearMatch) {
      return {
        type: "interlinear",
        book: interlinearMatch[1],
        chapter: parseInt(interlinearMatch[2], 10),
        verse: parseInt(interlinearMatch[3], 10)
      };
    }

    return null;
  }

  public static normalizeOsisBook(input = ""): string {
    const clean = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    return OSIS_ALIAS_MAP[clean] || clean;
  }
}
