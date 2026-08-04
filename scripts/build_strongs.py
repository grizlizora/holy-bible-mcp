import sqlite3
import urllib.request
import json
import os

DB_FILE = "data/processed/bible_database.sqlite"

def build_strongs():
    print(f"Connecting to {DB_FILE}...")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS strongs_dictionary (
        id TEXT PRIMARY KEY,
        language TEXT,
        lemma TEXT,
        transliteration TEXT,
        pronunciation TEXT,
        definition TEXT
    )''')
    
    # We will use a pre-parsed open source JSON dictionary
    # Source: https://github.com/syncword/strongs-dictionary-json
    urls = {
        "hebrew": "https://raw.githubusercontent.com/syncword/strongs-dictionary-json/main/strongs-hebrew-dictionary.json",
        "greek": "https://raw.githubusercontent.com/syncword/strongs-dictionary-json/main/strongs-greek-dictionary.json"
    }
    
    total_inserted = 0
    for lang, url in urls.items():
        print(f"Downloading {lang} Strong's dictionary...")
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                
                rows_to_insert = []
                for entry in data:
                    strongs_id = entry.get("strongs", "")
                    if not strongs_id:
                        continue
                    
                    # Prefix with H or G if it's missing
                    if lang == "hebrew" and not strongs_id.startswith("H"):
                        strongs_id = "H" + strongs_id
                    elif lang == "greek" and not strongs_id.startswith("G"):
                        strongs_id = "G" + strongs_id
                        
                    lemma = entry.get("lemma", "")
                    translit = entry.get("transliteration", "")
                    pronounce = entry.get("pronunciation", "")
                    definition = entry.get("strongs_def", "") or entry.get("kjv_def", "")
                    
                    rows_to_insert.append((strongs_id, lang, lemma, translit, pronounce, definition))
                
                cursor.executemany('''
                INSERT OR REPLACE INTO strongs_dictionary (id, language, lemma, transliteration, pronunciation, definition)
                VALUES (?, ?, ?, ?, ?, ?)
                ''', rows_to_insert)
                
                total_inserted += len(rows_to_insert)
                print(f"Inserted {len(rows_to_insert)} {lang} entries.")
        except Exception as e:
            print(f"Failed to download or parse {lang} dictionary: {e}")
            
    conn.commit()
    conn.close()
    print(f"✅ Strong's Dictionary built successfully! Total entries: {total_inserted}")

if __name__ == "__main__":
    build_strongs()
