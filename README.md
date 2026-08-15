# 📖 Multilingual Holy Bible MCP Server v2.0

[![MCP Protocol](https://img.shields.io/badge/MCP-Protocol%202025--03--26-blue.svg)](https://modelcontextprotocol.io)
[![npm](https://img.shields.io/npm/v/@grizlizora/holy-bible-mcp.svg)](https://www.npmjs.com/package/@grizlizora/holy-bible-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Languages: 800+](https://img.shields.io/badge/Languages-800%2B-green.svg)](#supported-languages)
[![Verses: 11.9M](https://img.shields.io/badge/Verses-11.9M-brightgreen.svg)](#database-specifications)
[![Platform: macOS | Windows | Linux](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](#cross-platform-installation)

A high-performance, **100% offline**, zero-latency **Model Context Protocol (MCP) Server** that connects any LLM (Claude, GPT-4o, Gemini, DeepSeek-R1, Llama 3, Qwen) to **11,907,047 Biblical verses** across **1,081 translations** in **800+ languages**.

Equipped with the complete **MCP Protocol Triad** (`Tools`, `Resources`, `Prompts`), dual transport (`Stdio` + `SSE`), **100% SQLite-driven architecture**, Hebrew/Greek Robinson morphology, 344k+ TSK cross-reference graph, Trench's synonyms, and 15-translation parallel corpus diff engine.

---

## 🌟 Key Features

* **🏛 Complete MCP Protocol Triad**:
  * **Resources (`bible://...`)**: Canonical chapters, Strong's entries, cross-reference networks, and word-by-word interlinear text via standard RFC 6570 URI templates.
  * **Prompts**: Built-in workflows for Theological Exegesis, Pastoral Devotionals, Parallel Translation Comparison, and Original Languages Deep Dive.
  * **Tools (16+ Handlers)**: Advanced semantic, morphological, graph, and parallel translation tools.
* **🗄 100% SQLite-Driven Knowledge Engine**: All translation metadata, Trench's synonyms, Messianic prophecies, thematic chains, and prompts are stored in `data/directives.sqlite` and cached in memory (0.0ms lookup time).
* **⚡️ Zero-Latency FTS5 & Hybrid Search**: SQLite FTS5 with Memory-Mapped I/O, Ukrainian morphology lemmatizer, and Reciprocal Rank Fusion (RRF).
* **🔗 344,000+ Cross-Reference Graph**: Treasury of Scripture Knowledge (TSK) graph with PageRank ranking and anti-flooding diversity filter.
* **📜 Original Languages & Morphology**: Westminster Leningrad Codex (Hebrew WLC) + NA28 / Berean Greek NT + Septuagint (LXX) with full Robinson grammatical codes.
* **🌐 Dual Transport Architecture**: Local high-speed `Stdio` IPC transport and multi-session `SSE` / HTTP streaming transport (`/sse`, `/messages`, `/health`).
* **🧠 Context Token Optimizer & CoT Protocol**: 40/20/20/20 mathematical token allocation across 4K, 8K, 32K, and 128K+ context windows with `<think>` Chain-of-Thought reasoning rules for DeepSeek-R1 and Claude 3.7.

---

## 🚀 Quick Start — AI Editors (Trae IDE, Cursor, Claude Desktop, VS Code)

### 1. Trae IDE Configuration (`.trae/trae.mcp.json`)
```json
{
  "mcpServers": {
    "holy-bible-mcp": {
      "command": "node",
      "args": ["${workspaceFolder}/build/index.js"],
      "env": {
        "MODES_CONTROL": "on",
        "WARMTH_CONTROL": "on",
        "SHOW_METRICS": "on",
        "DEFAULT_MODE": "auto",
        "DEFAULT_WARMTH": "80"
      }
    }
  }
}
```

### 2. Cursor IDE Configuration (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "holy-bible-mcp": {
      "command": "node",
      "args": ["${workspaceFolder}/build/index.js"],
      "env": {
        "MODES_CONTROL": "on",
        "WARMTH_CONTROL": "on",
        "SHOW_METRICS": "on",
        "DEFAULT_MODE": "auto",
        "DEFAULT_WARMTH": "80"
      }
    }
  }
}
```

### 3. Claude Desktop Configuration (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "holy-bible-mcp": {
      "command": "npx",
      "args": ["-y", "@grizlizora/holy-bible-mcp"],
      "env": {
        "MODES_CONTROL": "on",
        "WARMTH_CONTROL": "on",
        "SHOW_METRICS": "on",
        "DEFAULT_MODE": "auto",
        "DEFAULT_WARMTH": "80"
      }
    }
  }
}
```

---

## 🛠 Available MCP Tools

| Tool | Parameters | Description |
|:---|:---|:---|
| `ask_holy_bible` | `question`, `language`, `mode` | **Master Tool**: Canonical answers with verified scripture anchors and theological directives |
| `get_interlinear_verse` | `book`, `chapter`, `verse`, `parallel_translation` | Word-by-word Hebrew (WLC) / Greek (NA28) interlinear with morphology and Strong's |
| `get_strongs_etymology` | `strongs_id` (e.g. `G26`, `H1254`) | Strong's Concordance, BDB/Thayer definitions, and Trench's Synonyms distinctions |
| `get_cross_references` | `book`, `chapter`, `verse`, `max_results` | Top-ranked theological cross-references from 344k+ TSK graph with anti-flooding filter |
| `find_thematic_scripture_chain`| `theme`, `starting_verse` | Traces progressive revelation across covenants (e.g. *Living Water*, *Seed of Faith*) |
| `get_prophecy_fulfillment_pairs` | `topic` | Matched OT Messianic Prophecies and their NT Historical Fulfillments in Christ |
| `search_scripture_hybrid` | `query`, `language`, `mode`, `top_k` | Hybrid search combining FTS5 BM25, Ukrainian morphology stemming, and vector RRF |
| `find_scriptures_by_life_situation` | `situation_description`, `emotion`, `language` | Pastoral counseling matcher for real-world emotional struggles (anxiety, grief, burnout) |
| `get_parallel_verses` | `book`, `chapter`, `verse`, `translations` | Aligns scripture across 15 translations (UBIO, UKRK, UTT, KJV, BSB, WLC, NA28, etc.) |
| `compare_translations_diff` | `book`, `chapter`, `verse`, `base_translation`, `target_translation` | Token-level Myers LCS Diff analysis comparing translations and translation philosophies |
| `get_translation_metadata` | `translation_id` | Metadata, translation philosophy (Formal vs Dynamic), and textual basis |
| `search_keyword` | `keyword`, `translation`, `limit` | Ultra-fast FTS5 full-text search across 11.9M verses |
| `get_verse` | `book`, `chapter`, `verse`, `language` | Retrieve exact verse by reference |
| `get_chapter_context` | `book`, `chapter`, `language` | Retrieve entire chapter context |
| `extract_vector_context` | `query`, `full_text`, `max_tokens` | Hierarchical chunker and vector reasoning over large attachments |
| `get_model_recommendations` | `model_name`, `parameter_size_b` | Adaptive sampling parameters (min_p, temperature, top_p, num_ctx) |

---

## 📜 Available MCP Resources

Access biblical content via standard RFC 6570 URIs:
* `bible://{translation}/{book}/{chapter}` — Read entire chapter (e.g. `bible://ubio/GEN/1`, `bible://kjv/JHN/3`, `bible://web/PSA/23`).
* `bible://strongs/{number}` — Strong's Concordance article (e.g. `bible://strongs/G26` for *Agape*, `bible://strongs/H1254` for *Bara*).
* `bible://crossref/{book}/{chapter}/{verse}` — Cross-reference network (e.g. `bible://crossref/JHN/3/16`).
* `bible://interlinear/{book}/{chapter}/{verse}` — Word-by-word interlinear text with morphology.

---

## 💬 Available MCP Prompts

* `theological_exegesis` — Historical-grammatical exegesis workflow with original language nuances.
* `pastoral_devotional` — Empathetic, Christ-centered pastoral encouragement tailored to life trials.
* `parallel_translation_comparison` — Manuscript and linguistic comparison across Bible translations.
* `original_languages_deep_dive` — Exhaustive Greek/Hebrew word study with Strong's etymology.
* `holy_bible_study` — Tier-calibrated Biblical study system prompt with 4-part canonical trajectory.
* `biblical_guidance_prompt` — Moral worldview guidance grounded in the 3 Eternal Moral Axioms.

---

## 💻 Local Build & Verification

```bash
git clone https://github.com/grizlizora/holy-bible-mcp.git
cd holy-bible-mcp
npm install
npm run build
npm test
```

---

## 📄 License

Licensed under the [MIT License](LICENSE). Free for open-source, commercial, and personal AI integration.
