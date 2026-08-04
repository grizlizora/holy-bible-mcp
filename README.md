# 📖 Multilingual Holy Bible MCP Server

[![MCP Protocol](https://img.shields.io/badge/MCP-Server-blue.svg)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Languages: 800+](https://img.shields.io/badge/Languages-800%2B-green.svg)](#supported-languages)
[![Verses: 11.9M](https://img.shields.io/badge/Verses-11.9M-brightgreen.svg)](#database-specifications)
[![Platform: macOS | Windows | Linux](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](#cross-platform-installation)

A high-performance, 100% offline, zero-latency **Model Context Protocol (MCP) Server** designed to connect Large Language Models (LLMs) to **11,907,047 Biblical verses** across **1,081 translations** in **800+ languages**. 

Equipped with strict theological guardrails (`bible_scholar` system prompt), Greek/Hebrew Strong's lexicon verification, and SHA-256 Merkle Root cryptographic integrity.

---

## 🌟 Key Features

* **⚡️ Zero-ML High-Speed Engine**: Built on SQLite FTS5 with Memory-Mapped I/O (`PRAGMA mmap_size`), secondary SQL indexes, and an in-memory LRU cache (< 1.25 ms query response).
* **🔒 Cryptographic Proof (Merkle Root)**: Every verse is SHA-256 hashed. Global Merkle Root: `e221d09e3870ddc23d3e1f62858a12b4152792847b911728371d39fa85279bb3`.
* **🛡 Strict Theological Guardrails**: Built-in `bible_scholar` system prompt prevents LLM hallucinations by forcing AIs (Claude, GPT, Gemini) to rely exclusively on scripture and verify Greek/Hebrew roots.
* **💻 100% Cross-Platform & Offline**: Runs natively on **macOS (M-Series ARM / Intel)**, **Windows (x64 / ARM64)**, and **Linux**.

---

## 🚀 Quick Start (IDE Configuration)

### 1. Antigravity IDE Configuration
Add the following block to your `mcp_config.json`:

```json
{
  "mcpServers": {
    "bible-mcp": {
      "command": "node",
      "args": [
        "/path/to/holy/mcp-server/build/index.js"
      ]
    }
  }
}
```

### 2. Claude Desktop Setup
Config location:
* 🍏 **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
* 💻 **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
* 🐧 **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bible-mcp": {
      "command": "node",
      "args": [
        "/path/to/holy/mcp-server/build/index.js"
      ]
    }
  }
}
```

### 3. Cursor IDE Setup
1. Open **Cursor Settings** -> **Features** -> **MCP**.
2. Click **+ Add New MCP Server**.
3. Set **Name**: `bible-mcp` | **Type**: `command`
4. Set **Command**: `node /path/to/holy/mcp-server/build/index.js`

---

## 🛠 Available MCP Tools

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `search_keyword` | `query` (string), `language` (opt string) | Full-Text Search using FTS5 operators (`AND`, `OR`, wildcards `*`). |
| `get_verse` | `book` (string), `chapter` (num), `verse` (num), `language` (opt string) | Retrieve specific verse by canonical reference. |
| `get_chapter_context` | `book` (string), `chapter` (num), `language` (opt string) | Retrieve an entire chapter formatted for LLM context windows. |
| `get_strongs_definition` | `word_id` (string e.g. `G26`, `H456`) | Lookup Greek/Hebrew lexicon root meanings. |
| `get_related_verses` | `book`, `chapter`, `verse` | Retrieve cross-references and parallel passages. |

---

## 💻 Cross-Platform Building & Running

### Prerequisites
* Node.js >= 18
* Python >= 3.10 (for dataset building)

### Local Compilation
```bash
# macOS / Linux
cd mcp-server
npm install
npm run build

# Windows (PowerShell)
cd mcp-server
npm install
npm run build
```

---

## 📄 License
Licensed under the [MIT License](LICENSE). Free for open-source, commercial, and personal AI integration.
