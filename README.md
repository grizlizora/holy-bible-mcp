# 📖 Holy Bible MCP Server — Мультимовна Біблія для Нейромереж

> **Простими словами:** Це готовий сервер-помічник для ШІ (Claude, ChatGPT, Antigravity, Cursor). Він підключає до вашої нейромережі повну базі даних Біблії **на 800+ мовах (понад 11.9 млн віршів)**. Тепер нейромережа не "галюцинує" і не придумує відповіді від себе, а дає точні цитати та пояснення з оригіналів.

---

## 📌 Зміст / Table of Contents
1. [Що це таке і як це працює?](#-що-це-таке-і-як-це-працює)
2. [Швидке підключення (Quick Start)](#-швидке-підключення-quick-start)
   - [Налаштування для Antigravity IDE](#1-налаштування-для-antigravity-ide)
   - [Налаштування для Claude Desktop](#2-налаштування-для-claude-desktop)
   - [Налаштування для Cursor IDE](#3-налаштування-для-cursor-ide)
3. [Інструкція під всі ОС (Mac / Windows / Linux)](#-інструкція-під-всі-ос-mac--windows--linux)
4. [Доступні інструменти (MCP Tools)](#-доступні-інструменти-mcp-tools)
5. [English Summary](#-english-summary)

---

## 💡 Що це таке і як це працює?

Коли ви запитуєте у звичайної нейромережі щось про Біблію, вона часто плутає вірші або придумує власні трактування. 

**Holy Bible MCP Server вирішує цю проблему:**
1. **Безпека від брехні (Guardrails):** ШІ зобов'язаний шукати відповіді тільки у вашій локальній базі.
2. **800+ мов світу:** Українська, англійська, грецька, іврит, іспанська, німецька та сотні інших.
3. **Оригінальні коріння слів:** ШІ перевіряє значення слів за словником Стронга (давньогрецька/іврит).
4. **100% Офлайн і безкоштовно:** Всі 11.9 мільйонів віршів збережені в одному файлі SQLite на вашому комп'ютері. Інтернет не потрібен!

---

## 🚀 Швидке підключення (Quick Start)

### 1. Налаштування для Antigravity IDE
Файл конфігурації знаходиться за шляхом: `~/.gemini/antigravity/mcp_config.json`

Додайте цей блок у файл:
```json
{
  "mcpServers": {
    "bible-mcp": {
      "command": "node",
      "args": [
        "/Users/roman/Downloads/holy/mcp-server/build/index.js"
      ]
    }
  }
}
```

---

### 2. Налаштування для Claude Desktop

Файл конфігурації `claude_desktop_config.json` знаходиться тут:
* 🍏 **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
* 💻 **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
* 🐧 **Linux:** `~/.config/Claude/claude_desktop_config.json`

Вставте наступне:
```json
{
  "mcpServers": {
    "bible-mcp": {
      "command": "node",
      "args": [
        "/Users/roman/Downloads/holy/mcp-server/build/index.js"
      ]
    }
  }
}
```

---

### 3. Налаштування для Cursor IDE
1. Відкрийте **Cursor Settings** -> **Features** -> **MCP**.
2. Натисніть **+ Add New MCP Server**.
3. Вкажіть:
   - **Name:** `bible-mcp`
   - **Type:** `command`
   - **Command:** `node /Users/roman/Downloads/holy/mcp-server/build/index.js`

---

## 💻 Інструкція під всі ОС (Mac / Windows / Linux)

Сервер підтримує будь-які процесори (**Apple Silicon M1/M2/M3/M4, Intel, AMD, ARM64**).

### Як запустити розробку та збірку локально:

#### 🍏 macOS (Термінал)
```bash
cd /Users/roman/Downloads/holy
source venv/bin/activate
cd mcp-server && npm install && npm run build
```

#### 💻 Windows (PowerShell)
```powershell
cd C:\path\to\holy
.\venv\Scripts\activate
cd mcp-server
npm install
npm run build
```

#### 🐧 Linux (Bash)
```bash
cd /path/to/holy
source venv/bin/activate
cd mcp-server && npm install && npm run build
```

---

## 🛠 Доступні інструменти (MCP Tools)

Коли сервер підключено, у вашого ШІ з'являються 5 нових супер-здібностей:

| Назва інструмента | Що він робить? |
| :--- | :--- |
| `search_keyword` | Шукає будь-які слова чи теми у Біблії потрібною мовою (напр. `"любов AND ворог*"`). |
| `get_verse` | Повертає конкретний вірш за координатою (наприклад, Івана 3:16). |
| `get_chapter_context` | Завантажує весь розділ повністю для розуміння контексту. |
| `get_strongs_definition` | Пояснює первинне значення грецького або єврейського слова за номером Стронга. |
| `get_related_verses` | Знаходить паралельні місця та крос-посилання в інших книгах Біблії. |

---

## 🇬🇧 English Summary

**Holy Bible MCP Server** is a 100% offline, zero-latency Model Context Protocol server.  
- **Dataset:** 11,907,047 verses across 1,081 translations in 800+ languages.
- **Speed:** Built with SQLite FTS5, Memory-Mapped I/O, and an in-memory LRU Cache (< 1.25 ms response time).
- **Integrity:** SHA-256 Merkle Root cryptographic verification (`e221d09e3870ddc23d3e1f62858a12b4152792847b911728371d39fa85279bb3`).

### Quick Start with NPX:
```json
{
  "mcpServers": {
    "bible-mcp": {
      "command": "npx",
      "args": ["-y", "holy-bible-mcp"]
    }
  }
}
```

---

## 📄 Ліцензія
MIT License. Проєкт повністю безкоштовний для особистого та комерційного використання.
