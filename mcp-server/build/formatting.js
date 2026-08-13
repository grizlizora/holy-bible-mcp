/**
 * 🧹 Master Markdown Asterisk & Bullet Normalizer
 * Cleans stray double-asterisk numbers/bullets emitted by LLMs (e.g. "** 2. **Header" -> "2. **Header**")
 */
export function sanitizeAsteriskBullets(text) {
    if (!text)
        return "";
    return text
        .replace(/(^|\n|\s)\*\*\s*(\d+\.|\-|•|\*)\s*\*\*\s*/g, '$1$2 **')
        .replace(/(^|\n|\s)\*\*\s*(\d+\.|\-|•|\*)\s*/g, '$1$2 ')
        .replace(/\*\*\s*(\d+\.|\-|•|\*)\s*\*\*/g, '$1')
        .replace(/(^|\n)(\s*(?:\d+\.|\-|•|\*)\s*)\*\*\s*(\d+\.|\-|•|\*)\s*/g, '$1$2');
}
/**
 * 📊 Markdown Table Normalizer
 * Ensures Markdown tables emitted by LLMs have proper newlines before table rows
 * so parsers in Trea, Cursor, Cloud Code, and ReactMarkdown always render them as clean tables.
 */
export function normalizeMarkdownTables(text) {
    if (!text)
        return "";
    return text.replace(/([^\n])\n(\|[^\n]+\|\r?\n\|[-:\s|]+\|)/g, '$1\n\n$2');
}
/**
 * ✨ Master Universal Markdown Sanitizer & Harmonizer
 * Combines bullet sanitization, table normalization, and clean spacing for 100% harmonious rendering
 * across Trea, Cloud Code CLI, Cursor, Claude Desktop, and Liquid AI Web System.
 */
export function sanitizeMarkdownText(text) {
    if (!text)
        return "";
    const cleanBullets = sanitizeAsteriskBullets(text);
    const cleanTables = normalizeMarkdownTables(cleanBullets);
    return cleanTables;
}
/**
 * 🌐 Dual-Mode Response Formatter
 * Outputs clean Markdown for universal AI clients (Trea Cloud Code, Cursor, Claude Desktop)
 * or structured JSON metadata for programmatic callers.
 */
export function formatResponse(data, mode = 'markdown') {
    if (mode === 'json') {
        try {
            return JSON.stringify(data, null, 2);
        }
        catch (e) {
            return String(data);
        }
    }
    if (typeof data === 'string') {
        return sanitizeAsteriskBullets(data);
    }
    if (data?.text) {
        return sanitizeAsteriskBullets(data.text);
    }
    return String(data);
}
import { getLocalizedBookNameFromDict } from './data/osis_dictionary.js';
/**
 * 📖 Dual-Mode Scripture Verse Formatter
 * Generates both clean Markdown blockquotes (for Trea, Cursor, Cloud Code CLI)
 * and interactive citation tags (for Liquid AI Web System).
 */
export function formatScriptureVerse(item) {
    const { book, chapter, verse, text, language = 'ukr' } = item;
    const locBook = getLocalizedBookNameFromDict(book, language);
    const displayTitle = `${locBook} ${chapter}:${verse}`;
    const osisRef = `${book.toUpperCase()} ${chapter}:${verse}`;
    const cleanText = (text || '').trim();
    // 1. Elegant Markdown Blockquote (for Trea, Cursor, Cloud Code, Claude Desktop)
    const markdownBlock = `> «${cleanText}»\n> — **${displayTitle}**`;
    // 2. Interactive Citation Tag (for Liquid AI Web System)
    const citationTag = `{{CITATION: ${osisRef}|${displayTitle}|${language}|Cross}}`;
    // 3. Dual-Mode Formatted Text
    const formattedText = `📖 **${displayTitle}**\n> «${cleanText}»\n${citationTag}`;
    return { displayTitle, markdownBlock, citationTag, formattedText };
}
