import sqlite3
import json
import hashlib
import os

RAW_DIR = "data/raw"
PROCESSED_DIR = "data/processed"
DB_FILE = os.path.join(PROCESSED_DIR, "bible_database.sqlite")

def hash_string(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def build_database():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    
    # Remove existing DB to start fresh
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
        
    print(f"Creating SQLite database at {DB_FILE}...")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # 1. Create main verses table
    cursor.execute('''
    CREATE TABLE verses (
        id TEXT PRIMARY KEY,
        language TEXT,
        translation TEXT,
        book TEXT,
        chapter INTEGER,
        verse INTEGER,
        text TEXT,
        original_data JSON,
        hash TEXT
    )
    ''')
    
    # 2. Create FTS5 virtual table for full-text search
    cursor.execute('''
    CREATE VIRTUAL TABLE verses_fts USING fts5(
        text,
        content='verses',
        content_rowid='rowid'
    )
    ''')
    
    # Triggers to keep FTS table in sync with verses table
    cursor.execute('''
    CREATE TRIGGER verses_ai AFTER INSERT ON verses BEGIN
        INSERT INTO verses_fts(rowid, text) VALUES (new.rowid, new.text);
    END;
    ''')
    
    print("Database schema created. Loading raw JSON data...")
    
    all_hashes = []
    verses_to_insert = []
    
    kjv_path = os.path.join(RAW_DIR, "en_kjv.json")
    if not os.path.exists(kjv_path):
        print(f"Error: Could not find {kjv_path}.")
        return
        
    with open(kjv_path, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
        
    for book_data in data:
        book_abbrev = book_data.get("abbrev", "unknown")
        chapters = book_data.get("chapters", [])
        
        for c_idx, chapter_verses in enumerate(chapters):
            ch_num = c_idx + 1
            for v_idx, verse_text in enumerate(chapter_verses):
                v_num = v_idx + 1
                verse_id = f"ENG_KJV_{book_abbrev.upper()}_{ch_num}_{v_num}"
                
                canonical_str = f"{verse_id}:{verse_text}"
                v_hash = hash_string(canonical_str)
                all_hashes.append(v_hash)
                
                verses_to_insert.append((
                    verse_id, "eng", "kjv", book_abbrev, ch_num, v_num, verse_text, "{}", v_hash
                ))
                
    print(f"Inserting {len(verses_to_insert)} verses into SQLite...")
    cursor.executemany('''
    INSERT INTO verses (id, language, translation, book, chapter, verse, text, original_data, hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', verses_to_insert)
    
    conn.commit()
    
    print("Calculating Global Merkle Root...")
    all_hashes.sort()
    merkle_root = hash_string("".join(all_hashes))
    
    # Save metadata table
    cursor.execute('CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT)')
    cursor.execute('INSERT INTO metadata (key, value) VALUES (?, ?)', ("merkle_root", merkle_root))
    conn.commit()
    
    print(f"✅ Database built successfully! Merkle Root: {merkle_root}")
    
    # Test FTS5 Search
    print("\nRunning test FTS5 search for 'love AND enemies':")
    cursor.execute("""
        SELECT v.id, v.text 
        FROM verses_fts f 
        JOIN verses v ON f.rowid = v.rowid 
        WHERE verses_fts MATCH 'love AND enemies' 
        LIMIT 3
    """)
    for row in cursor.fetchall():
        print(f" - [{row[0]}] {row[1]}")
        
    conn.close()

if __name__ == "__main__":
    build_database()
