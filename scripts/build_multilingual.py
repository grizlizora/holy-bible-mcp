import sqlite3
import hashlib
import os
import subprocess
import glob
from tqdm import tqdm

RAW_DIR = "data/raw"
CORPUS_DIR = os.path.join(RAW_DIR, "ebible-corpus")
PROCESSED_DIR = "data/processed"
DB_FILE = os.path.join(PROCESSED_DIR, "bible_database.sqlite")
REPO_URL = "https://github.com/BibleNLP/ebible.git"

def hash_string(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

import urllib.request
import zipfile
import shutil

def ensure_corpus():
    if not os.path.exists(CORPUS_DIR):
        print(f"Cloning {REPO_URL} into {CORPUS_DIR}...")
        subprocess.run(["git", "-c", "credential.helper=", "clone", "--depth", "1", REPO_URL, CORPUS_DIR], check=True)
    else:
        print(f"Corpus already exists at {CORPUS_DIR}")

def parse_and_insert():
    print(f"Connecting to {DB_FILE}...")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Ensure tables exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS verses (
        id TEXT PRIMARY KEY,
        language TEXT,
        translation TEXT,
        book TEXT,
        chapter INTEGER,
        verse INTEGER,
        text TEXT,
        original_data JSON,
        hash TEXT
    )''')
    
    cursor.execute('''
    CREATE VIRTUAL TABLE IF NOT EXISTS verses_fts USING fts5(
        text,
        content='verses',
        content_rowid='rowid'
    )''')

    # Add trigger if not exists
    cursor.execute('''
    CREATE TRIGGER IF NOT EXISTS verses_ai AFTER INSERT ON verses BEGIN
        INSERT INTO verses_fts(rowid, text) VALUES (new.rowid, new.text);
    END;
    ''')
    
    # Load canonical vref.txt
    vref_file = os.path.join(CORPUS_DIR, "metadata", "vref.txt")
    vrefs = []
    if os.path.exists(vref_file):
        with open(vref_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line: continue
                # Line format: "GEN 1:1"
                parts = line.split(' ')
                book = parts[0]
                ch_num, v_num = 1, 1
                if len(parts) > 1 and ':' in parts[1]:
                    ch_num, v_num = map(int, parts[1].split(':', 1))
                vrefs.append((book, ch_num, v_num))
    print(f"Loaded {len(vrefs)} canonical verse references from vref.txt")
    
    txt_files = glob.glob(os.path.join(CORPUS_DIR, "**", "*.txt"), recursive=True)
    # Filter out metadata files
    txt_files = [f for f in txt_files if "metadata" not in f and "translations" not in f]
    print(f"Found {len(txt_files)} translation files to process.")
    
    total_inserted = 0
    all_hashes = []
    
    # Process files
    for filepath in tqdm(txt_files, desc="Processing Translations"):
        filename = os.path.basename(filepath)
        parts = filename.split('-')
        language = parts[0] if len(parts) > 0 else "unknown"
        translation = filename.replace('.txt', '')
        
        verses_to_insert = []
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = [l.strip() for l in f]
                
            for idx, text in enumerate(lines):
                if not text: continue
                
                # Match line index to vref
                if idx < len(vrefs):
                    book, ch_num, v_num = vrefs[idx]
                else:
                    book, ch_num, v_num = "UNK", 1, idx + 1
                    
                verse_id = f"{language.upper()}_{translation.upper()}_{book}_{ch_num}_{v_num}"
                canonical_str = f"{verse_id}:{text}"
                v_hash = hash_string(canonical_str)
                all_hashes.append(v_hash)
                
                verses_to_insert.append((
                    verse_id, language, translation, book, ch_num, v_num, text, "{}", v_hash
                ))
        except Exception as e:
            continue
            
        if verses_to_insert:
            cursor.executemany('''
            INSERT OR IGNORE INTO verses (id, language, translation, book, chapter, verse, text, original_data, hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', verses_to_insert)
            total_inserted += len(verses_to_insert)
            conn.commit()

    print(f"Total verses inserted across all languages: {total_inserted}")
    
    print("Recalculating Global Merkle Root...")
    all_hashes.sort()
    merkle_root = hash_string("".join(all_hashes))
    
    cursor.execute('CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT)')
    cursor.execute('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)', ("merkle_root", merkle_root))
    conn.commit()
    
    print(f"✅ Multilingual Database built successfully! Global Merkle Root: {merkle_root}")
    conn.close()

if __name__ == "__main__":
    ensure_corpus()
    parse_and_insert()
