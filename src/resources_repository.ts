import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  McpError,
  ErrorCode
} from "@modelcontextprotocol/sdk/types.js";
import { queryDb } from "./database.js";
import { OSIS_ALIAS_MAP, getLocalizedBookNameFromDict } from "./data/osis_dictionary.js";
import { sanitizeMarkdownText } from "./formatting.js";

/**
 * 📜 MCP Resources Repository Subsystem for Holy Bible MCP
 * Exposes canonical scripture chapters, Strong's concordance articles,
 * cross-reference networks, and word-by-word interlinear text via standard MCP URIs.
 */

export function registerResourceHandlers(server: Server): void {
  // 1. Dynamic Resource Templates Discovery Handler
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return {
      resourceTemplates: [
        {
          uriTemplate: "bible://{translation}/{book}/{chapter}",
          name: "Canonical Scripture Chapter Reader",
          description: "Full chapter text formatted with verse citations (e.g. bible://kjv/JHN/3, bible://ubio/GEN/1, bible://web/PSA/23)",
          mimeType: "text/markdown"
        },
        {
          uriTemplate: "bible://strongs/{number}",
          name: "Strong's Exhaustive Concordance Entry",
          description: "Greek & Hebrew lexical lemma, transliteration, pronunciation and definition (e.g. bible://strongs/G26 for Agape, bible://strongs/H1254 for Bara)",
          mimeType: "application/json"
        },
        {
          uriTemplate: "bible://crossref/{book}/{chapter}/{verse}",
          name: "Biblical Cross-References Network",
          description: "Curated parallel verses, prophecy links, and doctrinal cross-references (e.g. bible://crossref/JHN/3/16, bible://crossref/ROM/8/28)",
          mimeType: "application/json"
        },
        {
          uriTemplate: "bible://interlinear/{book}/{chapter}/{verse}",
          name: "Original Language Interlinear Verse",
          description: "Word-by-word original Hebrew/Greek with English/Ukrainian gloss, lemmas, and Strong's mapping (e.g. bible://interlinear/GEN/1/1)",
          mimeType: "application/json"
        }
      ]
    };
  });

  // 2. Curated Essential Resources List Handler
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: "bible://kjv/JHN/3",
          name: "Gospel of John: Chapter 3 (KJV)",
          description: "Full chapter: Nicodemus discourse, New Birth, and God's love for the world.",
          mimeType: "text/markdown"
        },
        {
          uri: "bible://ubio/PSA/23",
          name: "Псалом 23 (Огієнко)",
          description: "Пастирський псалом абсолютного уповання на Господа: «Господь то мій Пастир...».",
          mimeType: "text/markdown"
        },
        {
          uri: "bible://kjv/EXO/20",
          name: "The Ten Commandments (Exodus 20 KJV)",
          description: "The Decalogue given at Mount Sinai.",
          mimeType: "text/markdown"
        },
        {
          uri: "bible://ubio/1CO/13",
          name: "Гімн Любові (1 Коринфянам 13 Огієнко)",
          description: "Канонічне визначення жертовної любові (Агапе).",
          mimeType: "text/markdown"
        },
        {
          uri: "bible://kjv/ROM/8",
          name: "Romans 8: Life in the Spirit (KJV)",
          description: "No condemnation in Christ, the witness of the Spirit, and unbreakable divine love.",
          mimeType: "text/markdown"
        },
        {
          uri: "bible://strongs/G26",
          name: "Strong's G26: Agape (ἀγάπη)",
          description: "Unconditional, self-sacrificing covenant love.",
          mimeType: "application/json"
        },
        {
          uri: "bible://strongs/H1254",
          name: "Strong's H1254: Bara (בָּרָא)",
          description: "Divine ex-nihilo creative act in Genesis 1:1.",
          mimeType: "application/json"
        }
      ]
    };
  });

  // 3. Universal Resource Reader Handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const parsed = parseBibleResourceUri(uri);

    if (!parsed) {
      throw new McpError(ErrorCode.InvalidRequest, `Unsupported resource URI scheme: ${uri}`);
    }

    switch (parsed.type) {
      case "chapter": {
        const { translation = "ubio", book = "GEN", chapter = 1 } = parsed;
        const osisCode = normalizeOsisBook(book);
        
        let rows = await queryDb(
          `SELECT verse, text FROM verses 
           WHERE LOWER(translation) = LOWER(?) AND UPPER(book) = ? AND chapter = ? 
           ORDER BY verse ASC`,
          [translation, osisCode, chapter]
        );

        if (!rows || rows.length === 0) {
          // Fallback to any matching translation for this book & chapter
          rows = await queryDb(
            `SELECT verse, text FROM verses 
             WHERE UPPER(book) = ? AND chapter = ? 
             ORDER BY verse ASC LIMIT 150`,
            [osisCode, chapter]
          );
        }

        if (!rows || rows.length === 0) {
          throw new McpError(ErrorCode.InvalidRequest, `No scripture records found for resource: ${uri}`);
        }

        const localizedBook = getLocalizedBookNameFromDict(osisCode, translation.toLowerCase().includes('ub') ? 'ukr' : 'eng');
        let mdContent = `# 📖 ${localizedBook} ${chapter} (${translation.toUpperCase()})\n\n`;
        for (const r of rows) {
          mdContent += `**${r.verse}** ${r.text}\n\n`;
        }

        return {
          contents: [
            {
              uri,
              mimeType: "text/markdown",
              text: sanitizeMarkdownText(mdContent.trim())
            }
          ]
        };
      }

      case "strongs": {
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

      case "crossref": {
        const { book = "JHN", chapter = 3, verse = 16 } = parsed;
        const osisCode = normalizeOsisBook(book);

        const rows = await queryDb(
          `SELECT concept_name, book as target_book, chapter as target_chapter, verse as target_verse, theological_principle 
           FROM semantic_concepts 
           WHERE UPPER(book) = ? AND chapter = ? AND verse = ? LIMIT 20`,
          [osisCode, chapter, verse]
        );

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

      case "interlinear": {
        const { book = "GEN", chapter = 1, verse = 1 } = parsed;
        const osisCode = normalizeOsisBook(book);

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

      default:
        throw new McpError(ErrorCode.InvalidRequest, `Unhandled resource type for URI: ${uri}`);
    }
  });
}

/** 🛠️ URI Parser & Helper Functions */
interface ParsedUri {
  type: "chapter" | "strongs" | "crossref" | "interlinear";
  translation?: string;
  book?: string;
  chapter?: number;
  verse?: number;
  strongsId?: string;
}

function parseBibleResourceUri(uri: string): ParsedUri | null {
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

function normalizeOsisBook(input: string = ""): string {
  const clean = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return OSIS_ALIAS_MAP[clean] || clean;
}
