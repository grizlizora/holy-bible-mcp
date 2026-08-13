import urllib.request
import json
import os

URLS = {
    "en_kjv.json": "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json"
}

def download_bibles():
    os.makedirs("data/raw", exist_ok=True)
    for filename, url in URLS.items():
        filepath = os.path.join("data/raw", filename)
        print(f"Downloading {filename}...")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode('utf-8-sig'))
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Successfully downloaded {filename}")
        except Exception as e:
            print(f"Error downloading {filename}: {e}")

if __name__ == "__main__":
    download_bibles()
