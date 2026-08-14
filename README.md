# 📖 Multilingual Holy Bible MCP Server

[![MCP Protocol](https://img.shields.io/badge/MCP-Server-blue.svg)](https://modelcontextprotocol.io)
[![npm](https://img.shields.io/npm/v/@grizlizora/holy-bible-mcp.svg)](https://www.npmjs.com/package/@grizlizora/holy-bible-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Languages: 800+](https://img.shields.io/badge/Languages-800%2B-green.svg)](#supported-languages)
[![Verses: 11.9M](https://img.shields.io/badge/Verses-11.9M-brightgreen.svg)](#database-specifications)
[![Platform: macOS | Windows | Linux](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](#cross-platform-installation)

A high-performance, **100% offline**, zero-latency **Model Context Protocol (MCP) Server** that connects any LLM to **11,907,047 Biblical verses** across **1,081 translations** in **800+ languages**.

Equipped with strict theological guardrails (`bible_scholar` system prompt), Greek/Hebrew Strong's lexicon verification, and SHA-256 Merkle Root cryptographic integrity.

---

## 🌟 Key Features

* **⚡️ Zero-ML High-Speed Engine**: SQLite FTS5 with Memory-Mapped I/O and in-memory LRU cache (< 1.25 ms query).
* **🔒 Cryptographic Proof (Merkle Root)**: Every verse is SHA-256 hashed. Root: `e221d09e3870ddc23d3e1f62858a12b4152792847b911728371d39fa85279bb3`.
* **🛡 Strict Theological Guardrails**: Forces AIs (Claude, GPT, Gemini) to verify scripture, not hallucinate.
* **💻 100% Offline**: Runs on macOS (M-Series ARM / Intel), Windows (x64 / ARM64), and Linux.

---

## 🚀 Quick Start — AI Editors (Trae, Cursor, Claude Desktop, VSCode, Cloud Code)

> **Use this config when adding Holy Bible MCP to an AI coding editor or Claude Desktop.**
> The model can call `get_verse`, `search_keyword`, etc. directly — all results come from the local 5.88 GB SQLite database.

```json
{
  "mcpServers": {
    "holy-bible": {
      "command": "npx",
      "args": ["-y", "@grizlizora/holy-bible-mcp"],
      "env": {
        "DEFAULT_MODE": "deep",
        "DEFAULT_WARMTH": "80",
        "SHOW_METRICS": "on"
      }
    }
  }
}
```

**Config file locations:**
| Editor | Path |
|:---|:---|
| Claude Desktop (macOS) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |
| Claude Desktop (Linux) | `~/.config/Claude/claude_desktop_config.json` |
| Cursor / VSCode / Trae | Settings → MCP → Add Server → paste config |
| Cloud Code | `~/.config/google-cloud-code/mcp.json` |

---

## 🏠 Quick Start — Holy Bible App (Local Self-Hosted System)

> **Use this config when adding to the Holy Bible App** (`holy-bible-mcp` web application).
> The app manages the MCP server lifecycle, database download, and UI automatically.

In the app's MCP settings, paste:

```json
{
  "mcpServers": {
    "holy-bible-local": {
      "command": "node",
      "args": ["../mcp-server/build/index.js"],
      "enabled": true,
      "githubRepo": "https://github.com/grizlizora/holy-bible-mcp",
      "env": {
        "DEFAULT_MODE": "deep",
        "DEFAULT_WARMTH": "80",
        "SHOW_METRICS": "on"
      }
    }
  }
}
```

The `githubRepo` field tells the app to fetch [`mcp-manifest.json`](./mcp-manifest.json) from this repository to discover database download mirrors automatically — no hardcoded URLs.

---

## ⚡ 1-Click Terminal Setup (macOS / Linux / Windows WSL)

```bash
curl -fsSL https://raw.githubusercontent.com/grizlizora/holy-bible-mcp/main/setup.sh | bash
```

This interactive installer will:
1. Set up the MCP server code locally.
2. Download the **5.88 GB Offline Holy Bible SQLite Database** with real-time progress.
3. Output the exact JSON config for your IDE.

---

## 🛠 Available MCP Tools

| Tool | Parameters | Description |
|:---|:---|:---|
| `ask_holy_bible` | `question` (string), `language` (opt), `warmth` (opt 0-100), `mode` (opt) | Semantic question — returns relevant verses with theological context |
| `search_keyword` | `keyword` (string), `language` (opt), `limit` (opt) | FTS5 full-text search across all 11.9M verses |
| `get_verse` | `book`, `chapter`, `verse`, `language` (opt) OR `reference` (string) | Fetch a specific verse by reference |
| `get_chapter_context` | `book`, `chapter`, `language` (opt) | Retrieve an entire chapter |
| `get_strongs_definition` | `word_id` (e.g. `G26`, `H456`) | Greek/Hebrew Strong's lexicon lookup |
| `get_related_verses` | `book`, `chapter`, `verse` | Cross-references and parallel passages |

All tools work 100% offline once the database is downloaded.

---

## 💻 Local Build

```bash
git clone https://github.com/grizlizora/holy-bible-mcp.git
cd holy-bible-mcp
npm install
npm run build
node build/index.js
```

---

## 📦 Database

The 5.88 GB SQLite database is downloaded separately (not bundled in the npm package).

**Auto-download mirrors (tried in order):**
1. GitHub Releases: `github.com/grizlizora/holy-bible-mcp/releases/download/v1.0.0/bible_database.sqlite`
2. HuggingFace: `huggingface.co/datasets/grizlizora/holy-bible-mcp/resolve/main/bible_database.sqlite`

Mirror list is defined in [`mcp-manifest.json`](./mcp-manifest.json) — updated without code changes.

---

## 📄 License

Licensed under the [MIT License](LICENSE). Free for open-source, commercial, and personal AI integration.
