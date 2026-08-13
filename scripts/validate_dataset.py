import duckdb
import os
import json

PROCESSED_DIR = "data/processed"
DB_FILE = os.path.join(PROCESSED_DIR, "vectors.duckdb")
INPUT_FILE = os.path.join(PROCESSED_DIR, "bible_reference.json")

def validate():
    if not os.path.exists(DB_FILE) or not os.path.exists(INPUT_FILE):
        print("Required files missing.")
        return False
        
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
        expected_count = len(data.get("verses", []))

    con = duckdb.connect(DB_FILE)
    actual_count = con.execute("SELECT COUNT(*) FROM bible_verses").fetchone()[0]
    
    print(f"Validation: Expected {expected_count} verses, found {actual_count} in DuckDB.")
    
    if expected_count != actual_count:
        print("❌ Integrity Check FAILED!")
        return False
        
    sample = con.execute("SELECT id, text FROM bible_verses LIMIT 1").fetchone()
    print(f"Sample verse: {sample[0]} -> {sample[1]}")
    
    # We will simulate a vector search logic test here if needed, but array dimensions can be checked
    dim = con.execute("SELECT array_length(embedding) FROM bible_verses LIMIT 1").fetchone()[0]
    print(f"Vector dimension: {dim} (expected 1024 for bge-m3)")
    
    if dim != 1024:
        print("❌ Vector Dimension Check FAILED!")
        return False
        
    print("✅ All checks PASSED!")
    return True

if __name__ == "__main__":
    validate()
