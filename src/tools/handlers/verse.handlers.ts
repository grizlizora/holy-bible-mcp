import { queryDb, isDbReady } from "../../database.js";
import { formatScriptureVerse } from "../../formatting.js";
import { OSIS_ALIAS_MAP } from "../../data/osis_dictionary.js";
import { resolveLanguageCode } from "../../services/language_resolver.js";
import { fetchOnlineVerseText, fetchOnlineChapterVerses } from "../../services/online_bible_fallback.js";
import { ParallelCorpusEngine } from "../../parallel_corpus_engine.js";

const SINGLE_CHAPTER_BOOKS = new Set(["OBA", "PHM", "2JN", "3JN", "JUD", "MAN", "PS151", "LAO"]);

export async function handleGetVerse(args: any) {
  let book = String(args?.book || "").toUpperCase();
  let chapter = Number(args?.chapter || 0);
  let startVerse = Number(args?.verse || 0);
  let endVerse = startVerse;
  const lang = String(args?.language || "ukr");
  const ref = String(args?.reference || "").trim();

  if (ref && (!book || !chapter || !startVerse)) {
    // 1. Standard "John 3:16" or "1 Cor 13:4-8"
    const match = ref.match(/^((?:[1-4]\s*)?[\p{L}\p{N}]+)\s+(\d+)[:.]((\d+)(?:[-–—](\d+))?)$/u);
    if (match) {
      book = match[1].toUpperCase();
      chapter = parseInt(match[2], 10);
      startVerse = parseInt(match[4], 10);
      endVerse = match[5] ? parseInt(match[5], 10) : startVerse;
    } else {
      // 2. Single-chapter books like "Jude 5" or "Юди 5"
      const singleMatch = ref.match(/^((?:[1-4]\s*)?[\p{L}\p{N}]+)\s+(\d+)$/u);
      if (singleMatch) {
        book = singleMatch[1].toUpperCase();
        chapter = 1;
        startVerse = parseInt(singleMatch[2], 10);
        endVerse = startVerse;
      }
    }
  }

  const osisCode = OSIS_ALIAS_MAP[book] || book;
  if (SINGLE_CHAPTER_BOOKS.has(osisCode) && chapter === 0 && startVerse > 0) {
    chapter = 1;
  }
  const detectedLang = resolveLanguageCode(lang, ref || book);

  let rows: any[] = [];
  if (isDbReady() && chapter > 0 && startVerse > 0) {
    rows = await queryDb(
      `SELECT book, chapter, verse, text, language 
       FROM verses 
       WHERE language = ? AND UPPER(book) = ? AND chapter = ? AND verse >= ? AND verse <= ? 
       ORDER BY verse ASC LIMIT 20`,
      [detectedLang, osisCode, chapter || 1, startVerse || 1, endVerse || startVerse || 1]
    );

    if (rows.length === 0) {
      rows = await queryDb(
        `SELECT book, chapter, verse, text, language 
         FROM verses 
         WHERE UPPER(book) = ? AND chapter = ? AND verse >= ? AND verse <= ? 
         ORDER BY verse ASC LIMIT 20`,
        [osisCode, chapter || 1, startVerse || 1, endVerse || startVerse || 1]
      );
    }
  }

  // 🌐 Online fallback if local SQLite is downloading or returned empty
  if (rows.length === 0 && chapter > 0 && startVerse > 0) {
    if (endVerse > startVerse) {
      const chapVerses = await fetchOnlineChapterVerses(osisCode, chapter, detectedLang);
      if (chapVerses.length > 0) {
        rows = chapVerses.filter(v => v.verse >= startVerse && v.verse <= endVerse);
      }
    }
    if (rows.length === 0) {
      for (let v = startVerse; v <= Math.min(startVerse + 10, endVerse); v++) {
        const onlineText = await fetchOnlineVerseText(osisCode, chapter, v, detectedLang);
        if (onlineText) {
          rows.push({
            book: osisCode,
            chapter,
            verse: v,
            text: onlineText,
            language: detectedLang
          });
        }
      }
    }
  }

  if (rows.length > 0) {
    const formatted = rows.map((v: any) => {
      return formatScriptureVerse({ book: v.book, chapter: v.chapter, verse: v.verse, text: v.text, language: detectedLang }).formattedText;
    }).join("\n\n");
    return {
      content: [{ type: "text", text: formatted }]
    };
  }

  return {
    content: [{ type: "text", text: JSON.stringify({ error: "Verse not found", reference: ref || `${book} ${chapter}:${startVerse}` }, null, 2) }]
  };
}

export async function handleGetChapterContext(args: any) {
  const book = String(args?.book || "").toUpperCase();
  const chapter = Number(args?.chapter || 1);
  const lang = String(args?.language || "ukr");
  const osisCode = OSIS_ALIAS_MAP[book] || book;
  const detectedLang = resolveLanguageCode(lang, book);

  let rows: any[] = [];
  if (isDbReady()) {
    rows = await queryDb(
      `SELECT book, chapter, verse, text, language 
       FROM verses 
       WHERE language = ? AND UPPER(book) = ? AND chapter = ? 
       ORDER BY verse ASC`,
      [detectedLang, osisCode, chapter]
    );

    if (rows.length === 0) {
      rows = await queryDb(
        `SELECT book, chapter, verse, text, language 
         FROM verses 
         WHERE UPPER(book) = ? AND chapter = ? 
         ORDER BY verse ASC`,
        [osisCode, chapter]
      );
    }
  }

  if (rows.length === 0) {
    rows = await fetchOnlineChapterVerses(osisCode, chapter, detectedLang);
  }

  const formattedText = rows.map((v: any) => {
    return formatScriptureVerse({ book: v.book || osisCode, chapter: v.chapter || chapter, verse: v.verse, text: v.text, language: detectedLang }).formattedText;
  }).join("\n\n");

  return {
    content: [{ type: "text", text: formattedText || JSON.stringify(rows, null, 2) }]
  };
}

export async function handleGetParallelVerses(args: any) {
  const book = String(args?.book || "JHN");
  const chapter = parseInt(String(args?.chapter || 3), 10);
  const verse = parseInt(String(args?.verse || 16), 10);
  const endVerse = typeof args?.end_verse === "number" ? args.end_verse : undefined;
  const translations = Array.isArray(args?.translations) ? args.translations.map(String) : ["UBIO", "UKRK", "KJV", "BSB"];

  const result = await ParallelCorpusEngine.getInstance().getParallelVerses(book, chapter, verse, endVerse, translations, "ukr");
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
  };
}

export async function handleCompareTranslationsDiff(args: any) {
  const book = String(args?.book || "JHN");
  const chapter = parseInt(String(args?.chapter || 1), 10);
  const verse = parseInt(String(args?.verse || 1), 10);
  const baseTrans = String(args?.base_translation || "UBIO");
  const targetTrans = String(args?.target_translation || "UKRK");

  const result = await ParallelCorpusEngine.getInstance().compareTranslationsDiff(book, chapter, verse, baseTrans, targetTrans, "ukr");
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
  };
}

export async function handleGetTranslationMetadata(args: any) {
  const transId = String(args?.translation_id || "all");
  const result = ParallelCorpusEngine.getInstance().getTranslationMetadata(transId);
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
  };
}
