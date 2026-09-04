/**
 * 📖 BibleRepository (bible_repository.ts)
 *
 * High-performance, zero-allocation data access repository for Canonical Scriptures,
 * Strong's Greek/Hebrew concordances, and cross-reference graphs.
 *
 * Powered by GenericSqlitePool and StatementCompiler.
 */
import { sqlitePool, isDbReady } from './better_sqlite_pool.js';
export class BibleRepository {
    /**
     * Retrieves a single verse by canonical citation
     */
    static async getVerse(book, chapter, verse, translation = 'UBIO') {
        isDbReady();
        const normBook = book.trim().toUpperCase();
        const normTrans = translation.trim().toUpperCase();
        const sql = `
      SELECT id, book, chapter, verse, text, translation, language
      FROM verses
      WHERE book = ? AND chapter = ? AND verse = ? AND translation = ?
      LIMIT 1
    `;
        const row = sqlitePool.get(sql, [normBook, chapter, verse, normTrans]);
        if (!row) {
            // Fallback across any translation
            const fallbackSql = `
        SELECT id, book, chapter, verse, text, translation, language
        FROM verses
        WHERE book = ? AND chapter = ? AND verse = ?
        LIMIT 1
      `;
            return sqlitePool.get(fallbackSql, [normBook, chapter, verse]) || null;
        }
        return row;
    }
    /**
     * Retrieves a range of verses in a chapter
     */
    static async getVerseRange(book, chapter, startVerse, endVerse, translation = 'UBIO') {
        isDbReady();
        const normBook = book.trim().toUpperCase();
        const normTrans = translation.trim().toUpperCase();
        const sql = `
      SELECT id, book, chapter, verse, text, translation, language
      FROM verses
      WHERE book = ? AND chapter = ? AND verse >= ? AND verse <= ? AND translation = ?
      ORDER BY verse ASC
      LIMIT 100
    `;
        const rows = sqlitePool.query(sql, [normBook, chapter, startVerse, endVerse, normTrans]);
        if (rows.length === 0) {
            const fallbackSql = `
        SELECT id, book, chapter, verse, text, translation, language
        FROM verses
        WHERE book = ? AND chapter = ? AND verse >= ? AND verse <= ?
        ORDER BY verse ASC
        LIMIT 100
      `;
            return sqlitePool.query(fallbackSql, [normBook, chapter, startVerse, endVerse]);
        }
        return rows;
    }
    /**
     * Retrieves all verses in a whole chapter
     */
    static async getChapter(book, chapter, translation = 'UBIO') {
        isDbReady();
        const normBook = book.trim().toUpperCase();
        const normTrans = translation.trim().toUpperCase();
        const sql = `
      SELECT id, book, chapter, verse, text, translation, language
      FROM verses
      WHERE book = ? AND chapter = ? AND translation = ?
      ORDER BY verse ASC
    `;
        const rows = sqlitePool.query(sql, [normBook, chapter, normTrans]);
        if (rows.length === 0) {
            const fallbackSql = `
        SELECT id, book, chapter, verse, text, translation, language
        FROM verses
        WHERE book = ? AND chapter = ?
        ORDER BY verse ASC
      `;
            return sqlitePool.query(fallbackSql, [normBook, chapter]);
        }
        return rows;
    }
    /**
     * Retrieves a Strong's Concordance entry
     */
    static async getStrongs(strongsNumber) {
        isDbReady();
        const cleanNum = strongsNumber.trim().toUpperCase();
        const sql = `
      SELECT number, lemma, transliteration, pronunciation, definition, language
      FROM strongs_dictionary
      WHERE UPPER(number) = ?
      LIMIT 1
    `;
        return sqlitePool.get(sql, [cleanNum]) || null;
    }
    /**
     * Retrieves cross references for a given verse
     */
    static async getCrossReferences(book, chapter, verse, limit = 20) {
        isDbReady();
        const sql = `
      SELECT from_book as fromBook, from_chapter as fromChapter, from_verse as fromVerse,
             to_book as toBook, to_chapter as toChapter, to_verse as toVerse, votes
      FROM cross_references
      WHERE UPPER(from_book) = UPPER(?) AND from_chapter = ? AND from_verse = ?
      ORDER BY votes DESC
      LIMIT ?
    `;
        return sqlitePool.query(sql, [book, chapter, verse, limit]);
    }
}
