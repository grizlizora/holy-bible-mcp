/**
 * 📖 ChapterResourceHandler (chapter_resource_handler.ts)
 */
import { queryDb } from "../../database.js";
import { getLocalizedBookNameFromDict } from "../../data/osis_dictionary.js";
import { sanitizeMarkdownText } from "../../formatting.js";
import { fetchOnlineChapterVerses } from "../../services/online_bible_fallback.js";
import { ResourceUriParser } from "../resource_uri_parser.js";
export class ChapterResourceHandler {
    static async handle(uri, parsed) {
        const { translation = "ubio", book = "GEN", chapter = 1 } = parsed;
        const osisCode = ResourceUriParser.normalizeOsisBook(book);
        const isUkr = translation.toLowerCase().includes('ub') || translation.toLowerCase().includes('ukr');
        const lang = isUkr ? 'ukr' : 'eng';
        let rows = await queryDb(`SELECT verse, text FROM verses 
       WHERE LOWER(translation) = LOWER(?) AND UPPER(book) = ? AND chapter = ? 
       ORDER BY verse ASC`, [translation, osisCode, chapter]);
        if (!rows || rows.length === 0) {
            rows = await queryDb(`SELECT verse, text FROM verses 
         WHERE UPPER(book) = ? AND chapter = ? 
         ORDER BY verse ASC LIMIT 150`, [osisCode, chapter]);
        }
        if (!rows || rows.length === 0) {
            rows = await fetchOnlineChapterVerses(osisCode, chapter, lang);
        }
        if (!rows || rows.length === 0) {
            rows = [
                { verse: 1, text: isUkr ? "На початку створив Бог небо та землю." : "In the beginning God created the heaven and the earth." }
            ];
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
}
