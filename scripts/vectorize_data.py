import json
import os
import duckdb

print("Initializing... Please wait. (First run may take 2-5 minutes to download the 2.3GB neural network model)")

import torch
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

PROCESSED_DIR = "data/processed"
INPUT_FILE = os.path.join(PROCESSED_DIR, "bible_reference.json")
DB_FILE = os.path.join(PROCESSED_DIR, "vectors.duckdb")
MODEL_NAME = "BAAI/bge-m3"
BATCH_SIZE = 32

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found. Run Stage 1 first.")
        return

    print("Loading data...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
        verses = data.get("verses", [])
        
    print(f"Loaded {len(verses)} verses to vectorize.")

    # Determine optimal device (MPS for Mac M3 Pro)
    device = "cpu"
    if torch.backends.mps.is_available():
        device = "mps"
        print("Using Apple Silicon Metal Performance Shaders (MPS) for acceleration.")
    elif torch.cuda.is_available():
        device = "cuda"
        print("Using CUDA for acceleration.")
    else:
        print("Using CPU (MPS/CUDA not available).")

    print(f"Loading embedding model: {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME, device=device)

    # Initialize DuckDB
    print(f"Connecting to DuckDB at {DB_FILE}...")
    con = duckdb.connect(DB_FILE)
    
    # We install the VSS extension for DuckDB to support vector math if needed later, 
    # but for now we just store the vectors as FLOAT[] (DuckDB native array)
    con.execute("CREATE TABLE IF NOT EXISTS bible_verses (id VARCHAR PRIMARY KEY, text VARCHAR, embedding FLOAT[])")
    
    # Optional: check how many are already processed to resume
    existing_count = con.execute("SELECT COUNT(*) FROM bible_verses").fetchone()[0]
    print(f"Found {existing_count} existing vectors in database.")
    
    # We'll just overwrite or insert new for simplicity
    
    print("Starting vectorization...")
    for i in tqdm(range(0, len(verses), BATCH_SIZE), desc="Vectorizing Batches"):
        batch = verses[i:i + BATCH_SIZE]
        texts = [v["text"] for v in batch]
        ids = [v["id"] for v in batch]
        
        # Encode texts
        embeddings = model.encode(texts, convert_to_numpy=True)
        
        # Prepare for DB insertion
        db_rows = []
        for v_id, text, emb in zip(ids, texts, embeddings):
            db_rows.append((v_id, text, emb.tolist()))
            
        con.executemany("INSERT OR REPLACE INTO bible_verses (id, text, embedding) VALUES (?, ?, ?)", db_rows)
        
    final_count = con.execute("SELECT COUNT(*) FROM bible_verses").fetchone()[0]
    print(f"\nVectorization complete. Database now contains {final_count} verses.")
    con.close()

if __name__ == "__main__":
    main()
