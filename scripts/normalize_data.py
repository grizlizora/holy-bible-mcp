import json
import hashlib
import os

RAW_DIR = "data/raw"
PROCESSED_DIR = "data/processed"

def hash_string(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def normalize_thiagobodruk_format(filepath, lang, translation):
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
        
    normalized = []
    
    for book_data in data:
        book_abbrev = book_data.get("abbrev", "unknown")
        chapters = book_data.get("chapters", [])
        
        for c_idx, chapter_verses in enumerate(chapters):
            ch_num = c_idx + 1
            for v_idx, verse_text in enumerate(chapter_verses):
                v_num = v_idx + 1
                
                verse_id = f"{lang.upper()}_{translation.upper()}_{book_abbrev.upper()}_{ch_num}_{v_num}"
                
                # We hash a canonical string to ensure immutability
                canonical_str = f"{verse_id}:{verse_text}"
                v_hash = hash_string(canonical_str)
                
                normalized.append({
                    "id": verse_id,
                    "lang": lang,
                    "translation": translation,
                    "book": book_abbrev,
                    "chapter": ch_num,
                    "verse": v_num,
                    "text": verse_text,
                    "sha256": v_hash,
                    "original_ref": [] # placeholder for Strong's
                })
                
    return normalized

def main():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    all_verses = []
    
    # Process KJV
    kjv_path = os.path.join(RAW_DIR, "en_kjv.json")
    if os.path.exists(kjv_path):
        print("Normalizing KJV...")
        kjv_verses = normalize_thiagobodruk_format(kjv_path, "eng", "kjv")
        all_verses.extend(kjv_verses)
        print(f"Loaded {len(kjv_verses)} verses from KJV.")
        
    # Calculate Merkle Root (simplified: hash of all concatenated sorted hashes)
    print("Calculating Global Merkle Root...")
    sorted_hashes = sorted([v["sha256"] for v in all_verses])
    merkle_root = hash_string("".join(sorted_hashes))
    print(f"Merkle Root: {merkle_root}")
    
    output_path = os.path.join(PROCESSED_DIR, "bible_reference.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            "merkle_root": merkle_root,
            "verses": all_verses
        }, f, ensure_ascii=False, indent=2)
        
    print(f"Saved normalized dataset to {output_path}")

if __name__ == "__main__":
    main()
