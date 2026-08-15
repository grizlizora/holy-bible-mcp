import { queryDb } from "../../database.js";
import { MorphologyEngine } from "../../morphology_engine.js";

export async function handleGetStrongsDefinition(args: any) {
  const wordId = String(args?.word_id || "").toUpperCase();
  const rows = await queryDb(
    `SELECT strongs_id, original_word, transliteration, definition FROM strongs_dictionary WHERE UPPER(strongs_id) = ? LIMIT 1`,
    [wordId]
  );
  return {
    content: [{ type: "text", text: JSON.stringify(rows[0] || { error: "Strong ID not found" }, null, 2) }]
  };
}

export async function handleGetInterlinearVerse(args: any) {
  const book = String(args?.book || "GEN");
  const chapter = parseInt(String(args?.chapter || 1), 10);
  const verse = parseInt(String(args?.verse || 1), 10);
  const parallelTranslation = String(args?.parallel_translation || "UBIO");

  const result = await MorphologyEngine.getInterlinearVerse(book, chapter, verse, "auto", parallelTranslation);
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
  };
}

export async function handleGetStrongsEtymology(args: any) {
  const strongsId = String(args?.strongs_id || args?.word || "G26");
  const result = await MorphologyEngine.getStrongsEtymology(strongsId);
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
  };
}
