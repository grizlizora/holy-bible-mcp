import sqlite3
import os

DB_FILE = "data/processed/bible_database.sqlite"

def optimize():
    if not os.path.exists(DB_FILE):
        print(f"Database file {DB_FILE} not found.")
        return
        
    print(f"Connecting to {DB_FILE} to create secondary indexes...")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    print("Creating index on (language, book, chapter, verse)...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_verses_lookup ON verses(language, book, chapter, verse);")
    
    print("Creating index on (book, chapter)...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_verses_book_chap ON verses(book, chapter);")
    
    print("Running PRAGMA optimize...")
    cursor.execute("PRAGMA optimize;")
    
    conn.commit()
    conn.close()
    print("✅ Database successfully indexed and optimized!")

if __name__ == "__main__":
    optimize()
