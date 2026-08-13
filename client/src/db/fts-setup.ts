import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Initialize the database connection
const dbPath = process.env.DB_PATH || path.join(process.cwd(), '../data/liquid_ai.db');
console.log(`Setting up FTS5 on database: ${dbPath}`);

const sqlite = new Database(dbPath);

try {
  // 1. Create the virtual table for full-text search using FTS5.
  // We index 'content' (the message text). We also store 'chat_id' so we can join/group.
  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
      id UNINDEXED,
      chat_id UNINDEXED,
      content,
      tokenize='trigram' -- Better for partial word matching and multiple languages (like Ukrainian)
    );
  `);

  // 2. Initial population of the FTS table from existing messages
  sqlite.exec(`
    INSERT INTO messages_fts(rowid, id, chat_id, content)
    SELECT rowid, id, chat_id, content FROM messages 
    WHERE id NOT IN (SELECT id FROM messages_fts);
  `);

  // 3. Create triggers to keep FTS table in sync with messages table automatically
  
  // After Insert
  sqlite.exec(`
    CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
      INSERT INTO messages_fts(rowid, id, chat_id, content) VALUES (new.rowid, new.id, new.chat_id, new.content);
    END;
  `);

  // After Delete
  sqlite.exec(`
    CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
      INSERT INTO messages_fts(messages_fts, rowid, id, chat_id, content) VALUES('delete', old.rowid, old.id, old.chat_id, old.content);
    END;
  `);

  // After Update
  sqlite.exec(`
    CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
      INSERT INTO messages_fts(messages_fts, rowid, id, chat_id, content) VALUES('delete', old.rowid, old.id, old.chat_id, old.content);
      INSERT INTO messages_fts(rowid, id, chat_id, content) VALUES (new.rowid, new.id, new.chat_id, new.content);
    END;
  `);

  console.log("✅ FTS5 Setup Completed Successfully.");
} catch (e) {
  console.error("❌ FTS5 Setup Failed:", e);
} finally {
  sqlite.close();
}
