import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../data/directives.sqlite');
const jsonPath = path.resolve(__dirname, '../src/data/osis_dictionary.json');

console.log(`[OSIS-MIGRATION] Migrating OSIS dictionary from ${jsonPath} to SQLite: ${dbPath}`);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("PRAGMA busy_timeout = 5000;");
  db.run("PRAGMA journal_mode = WAL;");
  db.run("PRAGMA synchronous = NORMAL;");
  db.run("PRAGMA temp_store = MEMORY;");
  db.run("PRAGMA mmap_size = 30000000000;");
  db.run("PRAGMA cache_size = -64000;");

  db.run(`CREATE TABLE IF NOT EXISTS osis_book_dictionary (
    osis_code TEXT PRIMARY KEY,
    book_order INTEGER,
    name_ukr TEXT,
    name_eng TEXT,
    name_rus TEXT,
    raw_json TEXT
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS osis_aliases (
    alias TEXT PRIMARY KEY,
    osis_code TEXT NOT NULL
  );`);

  const rawJson = fs.readFileSync(jsonPath, 'utf-8');
  const parsed = JSON.parse(rawJson);
  const books = parsed.books || {};

  const stmtBook = db.prepare(`INSERT OR REPLACE INTO osis_book_dictionary (osis_code, book_order, name_ukr, name_eng, name_rus, raw_json) VALUES (?, ?, ?, ?, ?, ?)`);
  const stmtAlias = db.prepare(`INSERT OR REPLACE INTO osis_aliases (alias, osis_code) VALUES (?, ?)`);

  let order = 1;
  for (const [osisRaw, bookData] of Object.entries(books)) {
    const osis = osisRaw.toUpperCase();
    const nameUkr = bookData.names?.ukr || bookData.names?.uk || '';
    const nameEng = bookData.names?.eng || bookData.names?.en || '';
    const nameRus = bookData.names?.rus || bookData.names?.ru || '';

    stmtBook.run(osis, order++, nameUkr, nameEng, nameRus, JSON.stringify(bookData));

    // Register self as alias
    stmtAlias.run(osis, osis);

    if (nameUkr) stmtAlias.run(nameUkr.toUpperCase(), osis);
    if (nameEng) stmtAlias.run(nameEng.toUpperCase(), osis);
    if (nameRus) stmtAlias.run(nameRus.toUpperCase(), osis);

    if (Array.isArray(bookData.aliases)) {
      for (const a of bookData.aliases) {
        if (a) stmtAlias.run(String(a).toUpperCase(), osis);
      }
    }
  }

  stmtBook.finalize();
  stmtAlias.finalize(() => {
    console.log(`[OSIS-MIGRATION] ✅ Successfully migrated ${order - 1} OSIS books and thousands of aliases to SQLite.`);
    db.close();
  });
});
